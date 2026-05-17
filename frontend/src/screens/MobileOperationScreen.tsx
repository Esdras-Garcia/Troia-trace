import { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type LayoutChangeEvent, type GestureResponderEvent } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AlertTriangle,
  Camera as CameraIcon,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  LogOut,
  MapPin,
  PackageCheck,
  QrCode,
  RefreshCw,
  Route,
  ShieldCheck,
  Truck,
  Upload,
  Wifi,
  WifiOff,
} from 'lucide-react-native';

import {
  attachMobileEvidence,
  createMobileCertificate,
  getMobileBootstrap,
  logout,
  scanMobileQrCode,
  updateMobileComprovacaoStatus,
  type CertificatePayload,
  type ComprovacaoAction,
  type ComprovacaoActionPayload,
  type MobileMe,
} from '../api/client';
import type { CertificateItem, Comprovacao, MaterialItem, PartnerItem } from '../data/dashboard';
import { Badge, Button, Card, colors, Input, Progress } from '../components/ui';

type MobileTab = 'tarefas' | 'qr' | 'conferencia' | 'coleta' | 'destinacao' | 'certificacao' | 'historico' | 'offline';

type EvidenceFile = {
  nome: string;
  tipo: string;
  conteudo: string;
  origem: 'camera' | 'galeria' | 'documento';
  createdAt: string;
  latitude?: number;
  longitude?: number;
  address?: string;
};

type OperationLocation = {
  latitude: number;
  longitude: number;
  address?: string;
};

type OfflineAction = {
  id: string;
  label: string;
  targetId: string;
  payload: ComprovacaoActionPayload;
  action: ComprovacaoAction;
  createdAt: string;
};

type CollectionProblem = 'Material ausente' | 'Peso divergente' | 'Local errado' | 'QR Code inválido' | 'Documento ausente' | 'Coleta recusada';

export function MobileOperationScreen({ onLoggedOut }: { onLoggedOut: () => void }) {
  const [tab, setTab] = useState<MobileTab>('tarefas');
  const [comprovacoes, setComprovacoes] = useState<Comprovacao[]>([]);
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [parceiros, setParceiros] = useState<PartnerItem[]>([]);
  const [certificados, setCertificados] = useState<CertificateItem[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [offline, setOffline] = useState(false);
  const [syncQueue, setSyncQueue] = useState<OfflineAction[]>(() => readQueue());
  const [me, setMe] = useState<MobileMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const selected = comprovacoes.find((item) => item.id === selectedId) ?? comprovacoes[0] ?? null;

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const storedQueue = await readQueueAsync();
        if (active) {
          setSyncQueue(storedQueue);
        }
        const bootstrap = await getMobileBootstrap();
        if (!active) return;
        setMe(bootstrap.me);
        setComprovacoes(bootstrap.tasks);
        setMateriais(bootstrap.materiais);
        setParceiros(bootstrap.parceiros);
        setCertificados(bootstrap.certificados);
        setSelectedId((current) => current || bootstrap.tasks[0]?.id || '');
        setApiError('');
      } catch (error) {
        if (active) {
          setApiError(errorMessage(error));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const normalized = normalize(query);
    return comprovacoes.filter((item) =>
      normalize(`${item.id} ${item.material} ${item.parceiro} ${item.tipo} ${statusLabel(item.status)}`).includes(normalized),
    );
  }, [comprovacoes, query]);

  const taskStats = useMemo(() => {
    return {
      assigned: comprovacoes.length,
      pendingCollection: countByStatus(comprovacoes, collectionStatuses),
      pendingDestination: countByStatus(comprovacoes, destinationStatuses),
      pendingCertificate: countByStatus(comprovacoes, certificationStatuses),
      divergences: countByStatus(comprovacoes, blockedStatuses),
    };
  }, [comprovacoes]);

  async function handleLogout() {
    await logout();
    onLoggedOut();
  }

  function selectTask(item: Comprovacao, nextTab: MobileTab = tabForTaskStatus(item.status)) {
    setSelectedId(item.id);
    setTab(nextTab);
  }

  async function scanQr(code = qrCode) {
    try {
      const normalizedCode = code.trim();
      if (!normalizedCode) return;
      setQrCode(normalizedCode);
      const found = await scanMobileQrCode(normalizedCode);
      if (found) {
        setComprovacoes((current) => current.some((item) => item.id === found.id) ? current : [found, ...current]);
        setSelectedId(found.id);
        setTab('conferencia');
        setApiError('');
      }
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  async function runAction(action: ComprovacaoAction, payload: ComprovacaoActionPayload, label: string) {
    if (!selected) return;

    if (offline) {
      const queued = {
        // eslint-disable-next-line react-hooks/purity
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        action,
        label,
        targetId: selected.id,
        payload,
        createdAt: new Date().toISOString(),
      };
      setSyncQueue((current) => writeQueue([queued, ...current]));
      patchLocalStatus(selected.id, predictedStatus(selected.status, action));
      return;
    }

    try {
      const updated = await updateMobileComprovacaoStatus(selected.id, action, payload);
      setComprovacoes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedId(updated.id);
      setApiError('');
    } catch (error) {
      setApiError(errorMessage(error));
      throw error;
    }
  }

  async function attachEvidenceToSelected(evidence: EvidenceFile, observacoes: string) {
    if (!selected) return;
    if (offline) return;
    try {
      const updated = await attachMobileEvidence(selected.id, {
        evidenciaNome: evidence.nome,
        evidenciaTipo: evidence.tipo,
        evidenciaConteudo: evidence.conteudo,
        observacoes,
      });
      setComprovacoes((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApiError('');
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  async function syncPending() {
    const pending = [...syncQueue].reverse();
    const syncedIds = new Set<string>();

    try {
      for (const item of pending) {
        const updated = await updateMobileComprovacaoStatus(item.targetId, item.action, item.payload);
        syncedIds.add(item.id);
        setComprovacoes((current) => current.map((task) => (task.id === updated.id ? updated : task)));
      }

      setSyncQueue((current) => writeQueue(current.filter((item) => !syncedIds.has(item.id))));
      setApiError('');
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  async function saveCertificate(payload: CertificatePayload, evidence?: EvidenceFile) {
    if (!selected) return;
    try {
      const certificado = await createMobileCertificate(selected.id, payload);
      setCertificados((current) => [certificado, ...current]);
      await runAction(
        selected.status === 'AGUARDANDO_CERTIFICACAO' ? 'CERTIFICAR' : 'SOLICITAR_CERTIFICADO',
        {
          responsavel: selected.parceiro,
          documento: certificado.id,
          observacoes: [`Certificado mobile enviado para ${payload.material}.`, evidenceLocation(evidence ?? null)].filter(Boolean).join(' | '),
          evidenciaNome: evidence?.nome,
          evidenciaTipo: evidence?.tipo,
          evidenciaConteudo: evidence?.conteudo,
        },
        'Enviar certificado',
      );
      setApiError('');
    } catch (error) {
      setApiError(errorMessage(error));
    }
  }

  function patchLocalStatus(id: string, status: Comprovacao['status']) {
    setComprovacoes((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
  }

  return (
    <KeyboardAvoidingView
      style={styles.app}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Troia Trace Mobile</Text>
          <Text style={styles.subtitle}>{me ? `${me.user.name} • ${me.user.role}` : 'Operação de campo, conferência e evidências'}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={[styles.connectionPill, offline ? styles.offlinePill : styles.onlinePill]} onPress={() => setOffline((current) => !current)}>
            {offline ? <WifiOff color={colors.warning} size={16} /> : <Wifi color={colors.success} size={16} />}
            <Text style={styles.connectionText}>{offline ? 'Offline' : 'Online'}</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={handleLogout}>
            <LogOut color={colors.text} size={18} />
          </Pressable>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroller} contentContainerStyle={styles.tabs} keyboardShouldPersistTaps="handled">
        {mobileTabs.map((item) => (
          <Pressable key={item.key} style={[styles.tab, tab === item.key && styles.tabActive]} onPress={() => setTab(item.key)}>
            <item.icon color={tab === item.key ? colors.primary : colors.muted} size={16} />
            <Text style={[styles.tabText, tab === item.key && styles.tabTextActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {apiError ? (
        <View style={styles.errorBanner}>
          <AlertTriangle color={colors.danger} size={16} />
          <Text style={styles.errorText}>{apiError}</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {tab === 'tarefas' ? (
          <TasksView
            loading={loading}
            query={query}
            onChangeQuery={setQuery}
            tasks={filteredTasks}
            stats={taskStats}
            selectedId={selected?.id ?? ''}
            onSelect={selectTask}
          />
        ) : null}

        {tab === 'qr' ? (
          <QrView qrCode={qrCode} onChange={setQrCode} onScan={scanQr} selected={selected} />
        ) : null}

        {tab === 'conferencia' ? (
          <ConferenceView selected={selected} materiais={materiais} parceiros={parceiros} onRunAction={runAction} onAttachEvidence={attachEvidenceToSelected} />
        ) : null}

        {tab === 'coleta' ? (
          <CollectionView selected={selected} onRunAction={runAction} />
        ) : null}

        {tab === 'destinacao' ? (
          <DestinationView selected={selected} parceiros={parceiros} onRunAction={runAction} />
        ) : null}

        {tab === 'certificacao' ? (
          <CertificationView selected={selected} materiais={materiais} certificados={certificados} onSave={saveCertificate} />
        ) : null}

        {tab === 'historico' ? (
          <HistoryView selected={selected} certificados={certificados} />
        ) : null}

        {tab === 'offline' ? (
          <OfflineView queue={syncQueue} offline={offline} onSync={syncPending} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function TasksView({
  loading,
  query,
  onChangeQuery,
  tasks,
  stats,
  selectedId,
  onSelect,
}: {
  loading: boolean;
  query: string;
  onChangeQuery: (value: string) => void;
  tasks: Comprovacao[];
  stats: { assigned: number; pendingCollection: number; pendingDestination: number; pendingCertificate: number; divergences: number };
  selectedId: string;
  onSelect: (item: Comprovacao, nextTab?: MobileTab) => void;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.statGrid}>
        <TaskStat icon={ClipboardCheck} label="Atribuídos" value={stats.assigned} tone={colors.primary} />
        <TaskStat icon={Truck} label="Coletas" value={stats.pendingCollection} tone={colors.accent} />
        <TaskStat icon={MapPin} label="Destinação" value={stats.pendingDestination} tone={colors.warning} />
        <TaskStat icon={ShieldCheck} label="Certificação" value={stats.pendingCertificate} tone={colors.success} />
      </View>

      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Minhas tarefas</Text>
            <Text style={styles.panelSub}>{loading ? 'Carregando operação...' : `${tasks.length} tarefas operacionais`}</Text>
          </View>
          {stats.divergences ? <Badge tone="danger" style={styles.panelBadge}>{stats.divergences} divergências</Badge> : <Badge tone="success" style={styles.panelBadge}>Sem bloqueios</Badge>}
        </View>
        <Input value={query} onChangeText={onChangeQuery} placeholder="Buscar por QR, lote, material ou parceiro" />
        <View style={styles.taskList}>
          {tasks.map((item) => (
            <Pressable key={item.id} style={[styles.taskRow, item.id === selectedId && styles.taskRowActive]} onPress={() => onSelect(item)}>
              <View style={styles.taskMain}>
                <Text style={styles.taskId}>{item.id}</Text>
                <Text style={styles.taskTitle}>{item.material}</Text>
                <Text style={styles.taskMeta}>{item.parceiro} • {item.quantidade}</Text>
              </View>
              <StatusBadge status={item.status} style={styles.taskStatusBadge} />
            </Pressable>
          ))}
        </View>
      </Card>
    </View>
  );
}

function QrView({ qrCode, onChange, onScan, selected }: { qrCode: string; onChange: (value: string) => void; onScan: (code?: string) => void; selected: Comprovacao | null }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanned, setScanned] = useState(false);

  async function openScanner() {
    if (Platform.OS === 'web') return;
    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission.granted) return;
    setScanned(false);
    setScannerOpen(true);
  }

  function handleBarcodeScanned(result: BarcodeScanningResult) {
    if (scanned) return;
    const code = result.data?.trim();
    if (!code) return;
    setScanned(true);
    setScannerOpen(false);
    onChange(code);
    onScan(code);
  }

  return (
    <View style={styles.stack}>
      <Card style={styles.panel}>
        <View style={styles.qrBox}>
          <QrCode color={colors.primary} size={64} />
          <Text style={styles.panelTitle}>Bipar QR Code</Text>
          <Text style={styles.panelSub}>Abra a câmera para ler o QR Code da comprovação ou informe o código manualmente.</Text>
        </View>
        {scannerOpen ? (
          <View style={styles.qrCameraFrame}>
            <CameraView
              style={styles.qrCamera}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
            />
            <View pointerEvents="none" style={styles.qrScanGuide} />
            <Pressable style={styles.qrCloseButton} onPress={() => setScannerOpen(false)}>
              <Text style={styles.qrCloseText}>Fechar</Text>
            </Pressable>
          </View>
        ) : null}
        <Input value={qrCode} onChangeText={onChange} placeholder="Ex.: COMP-001" autoCapitalize="characters" />
        <View style={styles.actionRow}>
          <Button onPress={openScanner} style={styles.flexButton}>Abrir câmera</Button>
          <Button variant="outline" onPress={() => onScan()} style={styles.flexButton}>Validar manual</Button>
        </View>
        {permission?.granted === false ? <Text style={styles.permissionText}>Permissão da câmera negada. Libere o acesso nas configurações do aparelho.</Text> : null}
      </Card>

      {selected ? <TaskDetailCard selected={selected} /> : null}
    </View>
  );
}

function ConferenceView({
  selected,
  materiais,
  parceiros,
  onRunAction,
  onAttachEvidence,
}: {
  selected: Comprovacao | null;
  materiais: MaterialItem[];
  parceiros: PartnerItem[];
  onRunAction: (action: ComprovacaoAction, payload: ComprovacaoActionPayload, label: string) => Promise<void>;
  onAttachEvidence: (evidence: EvidenceFile, observacoes: string) => Promise<void>;
}) {
  const [quantidade, setQuantidade] = useState('');
  const [material, setMaterial] = useState('');
  const [conservacao, setConservacao] = useState('Adequado');
  const [observacoes, setObservacoes] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null);
  const materialOptions = useMemo(() => uniqueValues(materiais.map((item) => item.material)), [materiais]);
  const partnerStatus = parceiros.find((item) => item.parceiro === selected?.parceiro)?.status ?? 'Não homologado';
  const expectedWeight = parseWeight(selected?.quantidade ?? '');
  const realWeight = Number(quantidade.replace(',', '.')) || 0;
  const weightDiff = expectedWeight && realWeight ? Math.abs(realWeight - expectedWeight) / expectedWeight : 0;
  const validation = !selected
    ? { label: 'Selecione uma tarefa', tone: 'muted' as const }
    : !evidence
      ? { label: 'Evidência obrigatória pendente', tone: 'warning' as const }
      : partnerStatus !== 'Homologado'
        ? { label: 'Parceiro exige revisão', tone: 'warning' as const }
        : weightDiff > 0.1
          ? { label: 'Divergência de peso', tone: 'danger' as const }
          : { label: 'Conferência aprovada', tone: 'success' as const };
  const progress = conferenceProgress({
    selected: Boolean(selected),
    hasWeight: Boolean(quantidade.trim()),
    hasMaterial: Boolean((material || selected?.material || '').trim()),
    hasEvidence: Boolean(evidence),
    hasNotes: Boolean(observacoes.trim()),
  });

  async function submit() {
    if (!selected) return;
    const action = validation.tone === 'danger' ? 'REGISTRAR_DIVERGENCIA' : 'CONFERIR';
    await onRunAction(
      action,
      {
        responsavel: selected.parceiro,
        documento: evidence?.nome,
        observacoes: [
          `Peso real: ${quantidade || selected.quantidade}`,
          `Material real: ${material || selected.material}`,
          `Conservacao: ${conservacao}`,
          evidenceLocation(evidence),
          observacoes,
        ].filter(Boolean).join(' | '),
        evidenciaNome: evidence?.nome,
        evidenciaTipo: evidence?.tipo,
        evidenciaConteudo: evidence?.conteudo,
      },
      'Conferência',
    );
  }

  return (
    <View style={styles.stack}>
      {selected ? <TaskDetailCard selected={selected} /> : <EmptyState text="Selecione uma tarefa para conferir." />}
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Conferência do resíduo</Text>
            <Text style={styles.panelSub}>Comparação de esperado versus informado em campo.</Text>
          </View>
          <Badge tone={validation.tone} style={styles.panelBadge}>{validation.label}</Badge>
        </View>
        <Progress value={progress} color={toneColor(validation.tone)} />
        <View style={styles.formGrid}>
          <Field label="Peso real (kg)">
            <Input value={quantidade} onChangeText={(value) => setQuantidade(formatDecimal(value))} keyboardType="decimal-pad" placeholder={selected?.quantidade ?? '0'} />
          </Field>
          <Field label="Material real">
            <ChoiceGroup options={materialOptions.length ? materialOptions : [selected?.material ?? 'Material']} value={material || selected?.material || ''} onChange={setMaterial} />
          </Field>
          <Field label="Estado/conservação">
            <ChoiceGroup options={['Adequado', 'Avariado', 'Contaminado', 'Misturado']} value={conservacao} onChange={setConservacao} />
          </Field>
          <Field label="Evidência obrigatória">
            <EvidencePicker
              evidence={evidence}
              onChange={(file) => {
                setEvidence(file);
                void onAttachEvidence(file, 'Evidência anexada na conferência mobile.');
              }}
            />
          </Field>
          <Field label="Observações">
            <TextInput value={observacoes} onChangeText={setObservacoes} placeholder="Detalhes da conferência" placeholderTextColor={colors.muted} multiline style={styles.textArea} />
          </Field>
        </View>
        <View style={styles.actionRow}>
          <Button variant="outline" onPress={() => selected && onRunAction('INICIAR_CONFERENCIA', { responsavel: selected.parceiro }, 'Iniciar conferência')}>Iniciar</Button>
          <Button onPress={submit}>Concluir conferência</Button>
        </View>
      </Card>
    </View>
  );
}

function CollectionView({ selected, onRunAction }: { selected: Comprovacao | null; onRunAction: (action: ComprovacaoAction, payload: ComprovacaoActionPayload, label: string) => Promise<void> }) {
  const [problem, setProblem] = useState<CollectionProblem | ''>('');
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null);
  const [location, setLocation] = useState<OperationLocation | null>(null);

  async function updateLocation() {
    const current = await currentLocation();
    if (current) {
      setLocation(current);
    }
  }

  return (
    <View style={styles.stack}>
      {selected ? <TaskDetailCard selected={selected} /> : <EmptyState text="Selecione uma coleta." />}
      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>Gestão da coleta</Text>
        <Text style={styles.panelSub}>Controle início, recebimento, entrega e problemas operacionais.</Text>
        <ChoiceGroup options={collectionProblems} value={problem} onChange={(value) => setProblem(value as CollectionProblem)} />
        <Field label="Localização atual">
          <View style={styles.locationRow}>
            <Text style={styles.locationText}>{formatLocation(location) || 'Localização ainda não capturada.'}</Text>
            <Button variant="outline" onPress={updateLocation} style={styles.locationButton}>Atualizar</Button>
          </View>
        </Field>
        <EvidencePicker evidence={evidence} onChange={setEvidence} />
        <View style={styles.actionRow}>
          <Button
            variant="outline"
            onPress={() => selected && onRunAction('INICIAR_CONFERENCIA', {
              responsavel: selected.parceiro,
              observacoes: formatLocation(location),
            }, 'Iniciar coleta')}
          >
            Iniciar coleta
          </Button>
          <Button
            onPress={() => selected && onRunAction('REGISTRAR_DIVERGENCIA', {
              responsavel: selected.parceiro,
              documento: evidence?.nome,
              observacoes: [problem || 'Problema operacional registrado na coleta.', formatLocation(location), evidenceLocation(evidence)].filter(Boolean).join(' | '),
              evidenciaNome: evidence?.nome,
              evidenciaTipo: evidence?.tipo,
              evidenciaConteudo: evidence?.conteudo,
            }, 'Registrar problema')}
          >
            Registrar problema
          </Button>
        </View>
      </Card>
    </View>
  );
}

function DestinationView({
  selected,
  parceiros,
  onRunAction,
}: {
  selected: Comprovacao | null;
  parceiros: PartnerItem[];
  onRunAction: (action: ComprovacaoAction, payload: ComprovacaoActionPayload, label: string) => Promise<void>;
}) {
  const [destino, setDestino] = useState('');
  const [peso, setPeso] = useState('');
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null);
  const [location, setLocation] = useState<OperationLocation | null>(null);
  const partnerOptions = useMemo(() => uniqueValues(parceiros.map((item) => item.parceiro)), [parceiros]);

  async function updateLocation() {
    const current = await currentLocation();
    if (current) {
      setLocation(current);
    }
  }

  function openMap() {
    if (!location) return;
    void Linking.openURL(mapUrl(location));
  }

  async function selectMapLocation(coordinates: { latitude: number; longitude: number }) {
    setLocation({
      ...coordinates,
      address: await currentAddress(coordinates),
    });
  }

  async function submit() {
    if (!selected) return;
    const action: ComprovacaoAction = selected.status === 'CONFERIDO' ? 'LIBERAR_DESTINACAO' : 'REGISTRAR_DESTINO';
    await onRunAction(action, {
      responsavel: selected.parceiro,
      destino: destino || partnerOptions[0],
      documento: evidence?.nome,
      observacoes: [`Peso destinado: ${peso || selected.quantidade}`, formatLocation(location), evidenceLocation(evidence)].filter(Boolean).join(' | '),
      evidenciaNome: evidence?.nome,
      evidenciaTipo: evidence?.tipo,
      evidenciaConteudo: evidence?.conteudo,
    }, 'Registrar destinação');
  }

  return (
    <View style={styles.stack}>
      {selected ? <TaskDetailCard selected={selected} /> : <EmptyState text="Selecione um resíduo para destinar." />}
      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>Registrar destinação</Text>
        <Text style={styles.panelSub}>Confirme receptora, peso destinado e comprovante.</Text>
        <Field label="Destino">
          <ChoiceGroup options={partnerOptions} value={destino || partnerOptions[0] || ''} onChange={setDestino} />
        </Field>
        <Field label="Peso destinado">
          <Input value={peso} onChangeText={(value) => setPeso(formatDecimal(value))} keyboardType="decimal-pad" placeholder={selected?.quantidade} />
        </Field>
        <Field label="Localização da destinação">
          <View style={styles.mapPreview}>
            <MapPreview location={location} onSelect={selectMapLocation} />
            <Text style={styles.locationText}>{formatLocation(location) || 'Capture a localização atual e toque no mapa para selecionar o destino.'}</Text>
            <View style={styles.actionRow}>
              <Button variant="outline" onPress={updateLocation} style={styles.flexButton}>Usar minha localização</Button>
              <Button onPress={openMap} style={styles.flexButton}>Abrir externo</Button>
            </View>
          </View>
        </Field>
        <Field label="Comprovante">
          <EvidencePicker evidence={evidence} onChange={setEvidence} />
        </Field>
        <Button onPress={submit}>Confirmar destinação</Button>
      </Card>
    </View>
  );
}

function CertificationView({
  selected,
  materiais,
  certificados,
  onSave,
}: {
  selected: Comprovacao | null;
  materiais: MaterialItem[];
  certificados: CertificateItem[];
  onSave: (payload: CertificatePayload, evidence?: EvidenceFile) => Promise<void>;
}) {
  const [code, setCode] = useState(() => nextCertificateId());
  const [material, setMaterial] = useState('');
  const [status, setStatus] = useState('Em análise');
  const [evidence, setEvidence] = useState<EvidenceFile | null>(null);
  const materialOptions = useMemo(() => uniqueValues(materiais.map((item) => item.material)), [materiais]);

  async function submit() {
    if (!selected) return;
    await onSave({
      id: code,
      material: material || selected.material || materialOptions[0] || 'Material',
      status,
      data: currentDisplayDate(),
    }, evidence ?? undefined);
    setCode(nextCertificateId());
    setEvidence(null);
  }

  return (
    <View style={styles.stack}>
      {selected ? <TaskDetailCard selected={selected} /> : <EmptyState text="Selecione uma comprovação para certificar." />}
      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>Envio de certificado</Text>
        <Text style={styles.panelSub}>Anexe certificado, laudo ou comprovante de transformação.</Text>
        <Field label="Código">
          <Input value={code} onChangeText={(value) => setCode(value.toUpperCase().slice(0, 40))} />
        </Field>
        <Field label="Material">
          <ChoiceGroup options={materialOptions.length ? materialOptions : [selected?.material ?? 'Material']} value={material || selected?.material || ''} onChange={setMaterial} />
        </Field>
        <Field label="Status">
          <ChoiceGroup options={['Em análise', 'Aprovado', 'Rejeitado']} value={status} onChange={setStatus} />
        </Field>
        <Field label="Certificado">
          <EvidencePicker evidence={evidence} onChange={setEvidence} />
        </Field>
        <Button onPress={submit}>Enviar certificado</Button>
      </Card>
      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>Certificados recentes</Text>
        {certificados.slice(0, 4).map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <FileText color={colors.accent} size={16} />
            <Text style={styles.historyText}>{item.id} • {item.material} • {item.status}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function HistoryView({ selected, certificados }: { selected: Comprovacao | null; certificados: CertificateItem[] }) {
  if (!selected) {
    return <EmptyState text="Selecione uma tarefa para ver o histórico." />;
  }

  const linkedCertificates = certificados.filter((item) => item.material === selected.material);
  const history = splitHistory(selected.observacoes);

  return (
    <View style={styles.stack}>
      <TaskDetailCard selected={selected} />
      <Card style={styles.panel}>
        <Text style={styles.panelTitle}>Histórico operacional</Text>
        <View style={styles.historyRow}>
          <History color={colors.primary} size={16} />
          <Text style={styles.historyText}>Criado em {selected.dataEmissao}</Text>
        </View>
        {history.map((item) => (
          <View key={item} style={styles.historyRow}>
            <CheckCircle2 color={colors.success} size={16} />
            <Text style={styles.historyText}>{item}</Text>
          </View>
        ))}
        {selected.evidenciaNome ? (
          <View style={styles.historyRow}>
            <Upload color={colors.accent} size={16} />
            <Text style={styles.historyText}>Evidência salva: {selected.evidenciaNome}</Text>
          </View>
        ) : null}
        {linkedCertificates.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <ShieldCheck color={colors.warning} size={16} />
            <Text style={styles.historyText}>Certificado {item.id}: {item.status}</Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function OfflineView({ queue, offline, onSync }: { queue: OfflineAction[]; offline: boolean; onSync: () => Promise<void> }) {
  return (
    <View style={styles.stack}>
      <Card style={styles.panel}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHeaderText}>
            <Text style={styles.panelTitle}>Fila offline</Text>
            <Text style={styles.panelSub}>Ações ficam pendentes até a conexão voltar.</Text>
          </View>
          <Badge tone={offline ? 'warning' : 'success'} style={styles.panelBadge}>{offline ? 'Offline' : 'Online'}</Badge>
        </View>
        {queue.map((item) => (
          <View key={item.id} style={styles.historyRow}>
            <RefreshCw color={colors.warning} size={16} />
            <Text style={styles.historyText}>{item.label} • {item.targetId}</Text>
          </View>
        ))}
        {queue.length === 0 ? <Text style={styles.emptyText}>Nenhuma ação pendente.</Text> : null}
        <Button onPress={onSync}>Sincronizar agora</Button>
      </Card>
    </View>
  );
}

function TaskDetailCard({ selected }: { selected: Comprovacao }) {
  return (
    <Card style={styles.panel}>
      <View style={styles.taskDetailHeader}>
        <View style={styles.panelHeaderText}>
          <Text style={styles.taskId}>{selected.id}</Text>
          <Text style={styles.panelTitle}>{selected.material}</Text>
          <Text style={styles.panelSub}>{selected.parceiro} • {selected.quantidade} • {selected.tipo}</Text>
        </View>
        <StatusBadge status={selected.status} style={styles.detailStatusBadge} />
      </View>
    </Card>
  );
}

function MapPreview({ location, onSelect }: { location: OperationLocation | null; onSelect: (location: { latitude: number; longitude: number }) => void }) {
  const tiles = useMemo(() => location ? mapTiles(location) : [], [location]);
  const [size, setSize] = useState({ width: 0, height: 0 });

  function handleLayout(event: LayoutChangeEvent) {
    setSize({
      width: event.nativeEvent.layout.width,
      height: event.nativeEvent.layout.height,
    });
  }

  function handlePress(event: GestureResponderEvent) {
    if (!location || !size.width || !size.height) return;
    onSelect(coordinateFromMapPress(
      location,
      event.nativeEvent.locationX,
      event.nativeEvent.locationY,
      size.width,
      size.height,
    ));
  }

  if (!location) {
    return (
      <View style={styles.mapGrid}>
        <MapPin color={colors.muted} size={34} />
        <Text style={styles.mapHint}>Use sua localização para iniciar o mapa.</Text>
      </View>
    );
  }

  return (
    <Pressable style={styles.mapGrid} onLayout={handleLayout} onPress={handlePress}>
      <View style={styles.mapTiles}>
        {tiles.map((tile) => (
          <Image key={`${tile.x}-${tile.y}`} source={{ uri: tile.url }} style={styles.mapTile} />
        ))}
      </View>
      <View pointerEvents="none" style={styles.mapMarker}>
        <MapPin color={colors.primary} size={34} />
      </View>
      <Text pointerEvents="none" style={styles.mapHintOverlay}>Toque para mover o destino</Text>
    </Pressable>
  );
}

function EvidencePicker({ evidence, onChange }: { evidence: EvidenceFile | null; onChange: (file: EvidenceFile) => void }) {
  return (
    <View style={styles.evidenceGrid}>
      <Pressable style={styles.evidenceButton} onPress={() => pickEvidence('camera', onChange)}>
        <CameraIcon color={colors.primary} size={18} />
        <Text style={styles.evidenceText}>Foto</Text>
      </Pressable>
      <Pressable style={styles.evidenceButton} onPress={() => pickEvidence('galeria', onChange)}>
        <Upload color={colors.accent} size={18} />
        <Text style={styles.evidenceText}>Galeria</Text>
      </Pressable>
      <Pressable style={styles.evidenceButton} onPress={() => pickEvidence('documento', onChange)}>
        <FileText color={colors.warning} size={18} />
        <Text style={styles.evidenceText}>Documento</Text>
      </Pressable>
      {evidence ? <Text style={styles.evidenceName}>{evidence.nome}</Text> : null}
    </View>
  );
}

function ChoiceGroup({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <View style={styles.choiceGroup}>
      {options.map((item) => (
        <Pressable key={item} style={[styles.choice, value === item && styles.choiceActive]} onPress={() => onChange(item)}>
          <Text style={[styles.choiceText, value === item && styles.choiceTextActive]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function TaskStat({ icon: Icon, label, value, tone }: { icon: typeof ClipboardCheck; label: string; value: number; tone: string }) {
  return (
    <Card style={styles.statCard}>
      <Icon color={tone} size={20} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

function StatusBadge({ status, style }: { status: Comprovacao['status']; style?: React.ComponentProps<typeof Badge>['style'] }) {
  return <Badge tone={statusTone(status)} style={style}>{statusLabel(status)}</Badge>;
}

const collectionStatuses: Comprovacao['status'][] = [
  'CADASTRADO',
  'AGUARDANDO_CONFERENCIA',
  'EM_CONFERENCIA',
  'CONFERENCIA_COM_DIVERGENCIA',
];

const destinationStatuses: Comprovacao['status'][] = [
  'CONFERIDO',
  'AGUARDANDO_DESTINACAO',
];

const certificationStatuses: Comprovacao['status'][] = [
  'DESTINADO',
  'AGUARDANDO_CERTIFICACAO',
  'CERTIFICADO',
  'RELATORIO_GERADO',
];

const blockedStatuses: Comprovacao['status'][] = [
  'CONFERENCIA_COM_DIVERGENCIA',
  'REJEITADO',
  'CANCELADO',
];

function tabForTaskStatus(status: Comprovacao['status']): MobileTab {
  if (destinationStatuses.includes(status)) {
    return 'destinacao';
  }

  if (['DESTINADO', 'AGUARDANDO_CERTIFICACAO'].includes(status)) {
    return 'certificacao';
  }

  if (['CERTIFICADO', 'RELATORIO_GERADO', 'REJEITADO', 'CANCELADO'].includes(status)) {
    return 'historico';
  }

  return 'conferencia';
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card style={styles.panel}>
      <AlertTriangle color={colors.warning} size={22} />
      <Text style={styles.panelTitle}>{text}</Text>
    </Card>
  );
}

const mobileTabs: Array<{ key: MobileTab; label: string; icon: typeof ClipboardCheck }> = [
  { key: 'tarefas', label: 'Tarefas', icon: ClipboardCheck },
  { key: 'qr', label: 'QR Code', icon: QrCode },
  { key: 'conferencia', label: 'Conferir', icon: PackageCheck },
  { key: 'coleta', label: 'Coleta', icon: Truck },
  { key: 'destinacao', label: 'Destino', icon: Route },
  { key: 'certificacao', label: 'Certificar', icon: ShieldCheck },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'offline', label: 'Offline', icon: RefreshCw },
];

const collectionProblems: CollectionProblem[] = ['Material ausente', 'Peso divergente', 'Local errado', 'QR Code inválido', 'Documento ausente', 'Coleta recusada'];

async function pickEvidence(origin: EvidenceFile['origem'], onChange: (file: EvidenceFile) => void) {
  const location = await currentLocation();
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = origin === 'documento' ? 'application/pdf,image/*' : 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || file.size > 1_500_000) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result ?? '');
        onChange({
          nome: file.name.slice(0, 120),
          tipo: file.type || 'application/octet-stream',
          conteudo: result.split(',')[1] ?? result,
          origem: origin,
          createdAt: new Date().toISOString(),
          latitude: location?.latitude,
          longitude: location?.longitude,
          address: location?.address,
        });
      };
      reader.readAsDataURL(file);
    };
    input.click();
    return;
  }

  if (origin === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      base64: true,
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    onChange({
      nome: asset.fileName ?? `foto-${Date.now()}.jpg`,
      tipo: asset.mimeType ?? 'image/jpeg',
      conteudo: asset.base64,
      origem: origin,
      createdAt: new Date().toISOString(),
      latitude: location?.latitude,
      longitude: location?.longitude,
      address: location?.address,
    });
    return;
  }

  if (origin === 'galeria') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      base64: true,
      quality: 0.7,
    });
    const asset = result.assets?.[0];
    if (result.canceled || !asset?.base64) return;
    onChange({
      nome: asset.fileName ?? `imagem-${Date.now()}.jpg`,
      tipo: asset.mimeType ?? 'image/jpeg',
      conteudo: asset.base64,
      origem: origin,
      createdAt: new Date().toISOString(),
      latitude: location?.latitude,
      longitude: location?.longitude,
      address: location?.address,
    });
    return;
  }

  const documentResult = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: ['application/pdf', 'image/*'],
  });
  const asset = documentResult.assets?.[0];
  if (documentResult.canceled || !asset) return;
  const conteudo = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  onChange({
    nome: asset.name.slice(0, 120),
    tipo: asset.mimeType ?? 'application/octet-stream',
    conteudo,
    origem: origin,
    createdAt: new Date().toISOString(),
    latitude: location?.latitude,
    longitude: location?.longitude,
    address: location?.address,
  });
}

async function currentLocation(): Promise<OperationLocation | null> {
  if (Platform.OS === 'web') return null;
  const permission = await Location.requestForegroundPermissionsAsync();
  if (!permission.granted) return null;
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const coordinates = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
  const address = await currentAddress(coordinates);
  return {
    ...coordinates,
    address,
  };
}

async function currentAddress(location: { latitude: number; longitude: number }) {
  try {
    const [address] = await Location.reverseGeocodeAsync(location);
    return formatAddress(address);
  } catch {
    return '';
  }
}

function readQueue() {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem('troia.mobile.syncQueue') ?? '[]') as OfflineAction[];
  } catch {
    return [];
  }
}

async function readQueueAsync() {
  if (Platform.OS === 'web') {
    return readQueue();
  }
  try {
    return JSON.parse(await AsyncStorage.getItem('troia.mobile.syncQueue') ?? '[]') as OfflineAction[];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineAction[]) {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem('troia.mobile.syncQueue', JSON.stringify(queue));
  } else {
    void AsyncStorage.setItem('troia.mobile.syncQueue', JSON.stringify(queue));
  }
  return queue;
}

function countByStatus(items: Comprovacao[], statuses: Comprovacao['status'][]) {
  return items.filter((item) => statuses.includes(item.status)).length;
}

function predictedStatus(current: Comprovacao['status'], action: ComprovacaoAction): Comprovacao['status'] {
  if (action === 'INICIAR_CONFERENCIA') return 'EM_CONFERENCIA';
  if (action === 'CONFERIR') return 'CONFERIDO';
  if (action === 'REGISTRAR_DIVERGENCIA') return 'CONFERENCIA_COM_DIVERGENCIA';
  if (action === 'REJEITAR') return 'REJEITADO';
  if (action === 'LIBERAR_DESTINACAO') return 'AGUARDANDO_DESTINACAO';
  if (action === 'REGISTRAR_DESTINO') return 'DESTINADO';
  if (action === 'SOLICITAR_CERTIFICADO') return 'AGUARDANDO_CERTIFICACAO';
  if (action === 'CERTIFICAR') return 'CERTIFICADO';
  return current;
}

function conferenceProgress({
  selected,
  hasWeight,
  hasMaterial,
  hasEvidence,
  hasNotes,
}: {
  selected: boolean;
  hasWeight: boolean;
  hasMaterial: boolean;
  hasEvidence: boolean;
  hasNotes: boolean;
}) {
  if (!selected) return 0;
  return [
    20,
    hasWeight ? 20 : 0,
    hasMaterial ? 20 : 0,
    hasEvidence ? 30 : 0,
    hasNotes ? 10 : 0,
  ].reduce((total, value) => total + value, 0);
}

function parseWeight(value: string) {
  return Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

function formatDecimal(value: string) {
  const normalized = value.replace(/[^\d,.]/g, '').replace(/\./g, ',');
  const [integer = '', ...decimalParts] = normalized.split(',');
  const decimal = decimalParts.join('').slice(0, 3);
  return normalized.includes(',') ? `${integer.slice(0, 9)},${decimal}` : integer.slice(0, 9);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function splitHistory(value?: string | null) {
  return (value ?? '').split('\n').map((item) => item.trim()).filter(Boolean);
}

function evidenceLocation(evidence: EvidenceFile | null) {
  if (!evidence?.latitude || !evidence?.longitude) return '';
  return formatLocation(evidence);
}

function formatLocation(location: { latitude?: number; longitude?: number } | null) {
  if (!location?.latitude || !location?.longitude) return '';
  const coordinates = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  const address = 'address' in location ? location.address : '';
  return ['Localização', address, coordinates].filter(Boolean).join(': ');
}

function formatAddress(address?: Location.LocationGeocodedAddress) {
  if (!address) return '';
  const street = [address.street, address.streetNumber].filter(Boolean).join(', ');
  const city = [address.district, address.city, address.region].filter(Boolean).join(' - ');
  return [address.name, street, city, address.postalCode, address.country].filter(Boolean).join(', ');
}

function mapUrl(location: { latitude: number; longitude: number }) {
  const query = `${location.latitude},${location.longitude}`;
  if (Platform.OS === 'ios') {
    return `http://maps.apple.com/?ll=${query}&q=Destinação`;
  }
  return `geo:${query}?q=${query}(Destinação)`;
}

function mapTiles(location: { latitude: number; longitude: number }) {
  const zoom = 15;
  const center = latLngToTile(location.latitude, location.longitude, zoom);
  return [-1, 0, 1].flatMap((row) =>
    [-1, 0, 1].map((column) => {
      const x = center.x + column;
      const y = center.y + row;
      return {
        x,
        y,
        url: `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`,
      };
    }),
  );
}

function latLngToTile(latitude: number, longitude: number, zoom: number) {
  const latitudeRad = latitude * Math.PI / 180;
  const scale = 2 ** zoom;
  return {
    x: Math.floor((longitude + 180) / 360 * scale),
    y: Math.floor((1 - Math.log(Math.tan(latitudeRad) + 1 / Math.cos(latitudeRad)) / Math.PI) / 2 * scale),
  };
}

function coordinateFromMapPress(
  center: { latitude: number; longitude: number },
  locationX: number,
  locationY: number,
  width: number,
  height: number,
) {
  const zoom = 15;
  const tileSize = 256;
  const displayedTileSize = 100;
  const centerPixel = latLngToWorldPixel(center.latitude, center.longitude, zoom, tileSize);
  const scale = tileSize / displayedTileSize;
  return worldPixelToLatLng(
    centerPixel.x + (locationX - width / 2) * scale,
    centerPixel.y + (locationY - height / 2) * scale,
    zoom,
    tileSize,
  );
}

function latLngToWorldPixel(latitude: number, longitude: number, zoom: number, tileSize: number) {
  const latitudeRad = latitude * Math.PI / 180;
  const scale = tileSize * 2 ** zoom;
  return {
    x: (longitude + 180) / 360 * scale,
    y: (1 - Math.log(Math.tan(latitudeRad) + 1 / Math.cos(latitudeRad)) / Math.PI) / 2 * scale,
  };
}

function worldPixelToLatLng(x: number, y: number, zoom: number, tileSize: number) {
  const scale = tileSize * 2 ** zoom;
  const longitude = x / scale * 360 - 180;
  const latitudeRad = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / scale)));
  return {
    latitude: latitudeRad * 180 / Math.PI,
    longitude,
  };
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Não foi possível enviar os dados para a API.';
}

function currentDisplayDate() {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()).replace('.', '');
}

function nextCertificateId() {
  return `CERT-${Math.floor(1000 + Math.random() * 9000)}`;
}

function statusLabel(status: Comprovacao['status']) {
  const labels: Record<Comprovacao['status'], string> = {
    CADASTRADO: 'Cadastrado',
    AGUARDANDO_CONFERENCIA: 'Aguardando conferência',
    EM_CONFERENCIA: 'Em conferência',
    CONFERIDO: 'Conferido',
    CONFERENCIA_COM_DIVERGENCIA: 'Com divergência',
    REJEITADO: 'Rejeitado',
    AGUARDANDO_DESTINACAO: 'Aguardando destinação',
    DESTINADO: 'Destinado',
    AGUARDANDO_CERTIFICACAO: 'Aguardando certificação',
    CERTIFICADO: 'Certificado',
    RELATORIO_GERADO: 'Relatório gerado',
    CANCELADO: 'Cancelado',
  };
  return labels[status] ?? status;
}

function statusTone(status: Comprovacao['status']): 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' {
  if (['CERTIFICADO', 'RELATORIO_GERADO', 'DESTINADO'].includes(status)) return 'success';
  if (['CONFERENCIA_COM_DIVERGENCIA', 'AGUARDANDO_CERTIFICACAO'].includes(status)) return 'warning';
  if (['REJEITADO', 'CANCELADO'].includes(status)) return 'danger';
  if (['EM_CONFERENCIA', 'CONFERIDO', 'AGUARDANDO_DESTINACAO'].includes(status)) return 'accent';
  return 'primary';
}

function toneColor(tone: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted') {
  return {
    primary: colors.primary,
    accent: colors.accent,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    muted: colors.muted,
  }[tone];
}

const styles = StyleSheet.create({
  app: {
    backgroundColor: colors.background,
    flex: 1,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  brand: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  connectionPill: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 10,
  },
  onlinePill: {
    backgroundColor: `${colors.success}14`,
    borderColor: `${colors.success}55`,
  },
  offlinePill: {
    backgroundColor: `${colors.warning}14`,
    borderColor: `${colors.warning}55`,
  },
  connectionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  tabScroller: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    maxHeight: 58,
  },
  tabs: {
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  tab: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 10,
  },
  tabActive: {
    backgroundColor: `${colors.primary}16`,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
  },
  tabTextActive: {
    color: colors.text,
  },
  errorBanner: {
    alignItems: 'flex-start',
    backgroundColor: `${colors.danger}12`,
    borderBottomColor: `${colors.danger}45`,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    gap: 14,
    padding: 14,
    paddingBottom: 140,
  },
  stack: {
    gap: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    gap: 6,
    minWidth: 140,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  panel: {
    gap: 14,
  },
  panelHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  panelHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  panelBadge: {
    flexShrink: 1,
    maxWidth: '100%',
  },
  taskDetailHeader: {
    alignItems: 'flex-start',
    gap: 10,
  },
  detailStatusBadge: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  panelTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  panelSub: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  taskList: {
    gap: 9,
  },
  taskRow: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  taskRowActive: {
    borderColor: colors.primary,
  },
  taskMain: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  taskStatusBadge: {
    flexShrink: 1,
    maxWidth: '46%',
  },
  taskId: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  taskTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  taskMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  qrBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  qrCameraFrame: {
    backgroundColor: colors.sidebar,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  qrCamera: {
    height: '100%',
    width: '100%',
  },
  qrScanGuide: {
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 2,
    height: 180,
    left: '50%',
    marginLeft: -90,
    marginTop: -90,
    position: 'absolute',
    top: '50%',
    width: 180,
  },
  qrCloseButton: {
    backgroundColor: `${colors.sidebar}dd`,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  qrCloseText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  permissionText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  formGrid: {
    gap: 12,
  },
  field: {
    gap: 7,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  choiceGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choice: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  choiceActive: {
    backgroundColor: `${colors.primary}18`,
    borderColor: colors.primary,
  },
  choiceText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  choiceTextActive: {
    color: colors.text,
  },
  textArea: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    minHeight: 96,
    padding: 12,
    textAlignVertical: 'top',
  },
  locationRow: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
    padding: 10,
  },
  locationText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
    minWidth: 170,
  },
  locationButton: {
    minWidth: 110,
  },
  mapPreview: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 10,
  },
  mapGrid: {
    alignItems: 'center',
    backgroundColor: colors.sidebar,
    borderColor: `${colors.primary}55`,
    borderRadius: 8,
    borderWidth: 1,
    height: 150,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  mapTiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 300,
    width: 300,
  },
  mapTile: {
    height: 100,
    width: 100,
  },
  mapMarker: {
    alignItems: 'center',
    backgroundColor: `${colors.card}dd`,
    borderColor: `${colors.primary}66`,
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
    left: '50%',
    marginLeft: -24,
    marginTop: -24,
    position: 'absolute',
    top: '50%',
    width: 48,
  },
  mapHint: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  mapHintOverlay: {
    backgroundColor: `${colors.sidebar}dd`,
    borderRadius: 999,
    bottom: 10,
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    left: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    position: 'absolute',
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceButton: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    minHeight: 38,
    paddingHorizontal: 10,
  },
  evidenceText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
  evidenceName: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    width: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  flexButton: {
    flex: 1,
    minWidth: 140,
  },
  historyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  historyText: {
    color: colors.muted,
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 8,
  },
});
