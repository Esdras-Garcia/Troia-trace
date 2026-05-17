import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Check, FileCheck, Package, Upload, Users, X } from 'lucide-react-native';

import { createComprovacao } from '../api/client';
import type { Comprovacao, MaterialItem, PartnerItem } from '../data/dashboard';
import { Button, Card, colors, Input } from './ui';

export function NovaComprovacaoModal({
  visible,
  materiais,
  parceiros,
  onClose,
  onCreated,
  onViewCreated,
}: {
  visible: boolean;
  materiais: MaterialItem[];
  parceiros: PartnerItem[];
  onClose: () => void;
  onCreated?: (comprovacao: Comprovacao) => void;
  onViewCreated?: (comprovacao: Comprovacao) => void;
}) {
  const [registered, setRegistered] = useState(false);
  const [created, setCreated] = useState<Comprovacao | null>(null);
  const [material, setMaterial] = useState('');
  const [quantidadeKg, setQuantidadeKg] = useState('');
  const [tipo, setTipo] = useState('');
  const [parceiro, setParceiro] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const materialOptions = useMemo(() => uniqueValues(materiais.map((item) => item.material)), [materiais]);
  const parceiroOptions = useMemo(() => uniqueValues(parceiros.map((item) => item.parceiro)), [parceiros]);
  const selectedMaterial = material || materialOptions[0] || '';
  const selectedParceiro = parceiro || parceiroOptions[0] || '';

  function close() {
    setRegistered(false);
    setCreated(null);
    setSubmitting(false);
    setQuantidadeKg('');
    setTipo('');
    setObservacoes('');
    onClose();
  }

  async function submit() {
    setSubmitting(true);
    try {
      const comprovacao = await createComprovacao({
        material: selectedMaterial.trim(),
        quantidadeKg: Number(quantidadeKg.replace(',', '.')),
        tipo: tipo.trim(),
        parceiro: selectedParceiro.trim(),
        observacoes: observacoes.trim(),
      });
      setCreated(comprovacao);
      onCreated?.(comprovacao);
      setRegistered(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>{registered ? 'Comprovação Registrada' : 'Nova Comprovação de Lastro'}</Text>
              <Text style={styles.subtitle}>
                {registered
                  ? 'A operação recebeu um hash rastreável para auditoria.'
                  : 'Registre uma operação de logística reversa com evidências.'}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={close}>
              <X color={colors.text} size={18} />
            </Pressable>
          </View>

          {registered ? (
            <View style={styles.successStack}>
              <View style={styles.successIcon}>
                <FileCheck color={colors.primary} size={26} />
              </View>
              <View style={styles.hashBox}>
                <Text style={styles.fieldLabel}>ID da Comprovação</Text>
                <Text style={styles.hashText}>{created?.id ?? 'COMP-006'}</Text>
                <Text style={[styles.fieldLabel, styles.fieldGap]}>Hash do Lastro</Text>
                <Text style={styles.hashText}>{created?.hashLastro ?? '0x4f8a7c2d1e9b3f6a5c8d2e7b4a9c1f3d'}</Text>
              </View>
              <Button
                onPress={() => {
                  if (created) {
                    onViewCreated?.(created);
                  }
                  close();
                }}
              >
                Ver Comprovação
              </Button>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.twoCols}>
                <View style={[styles.field, styles.twoColField]}>
                  <Text style={styles.fieldLabel}>Material</Text>
                  <OptionSelect
                    emptyText="Nenhum material cadastrado"
                    icon="material"
                    options={materialOptions}
                    value={selectedMaterial}
                    onChange={setMaterial}
                  />
                </View>
                <View style={[styles.field, styles.twoColField]}>
                  <Text style={styles.fieldLabel}>Quantidade (kg)</Text>
                  <Input
                    value={quantidadeKg}
                    onChangeText={(value) => setQuantidadeKg(formatQuantity(value))}
                    keyboardType="decimal-pad"
                    maxLength={13}
                  />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tipo de Operação</Text>
                <Input value={tipo} onChangeText={setTipo} maxLength={80} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Parceiro Responsável</Text>
                <OptionSelect
                  emptyText="Nenhum parceiro cadastrado"
                  icon="parceiro"
                  options={parceiroOptions}
                  value={selectedParceiro}
                  onChange={setParceiro}
                />
              </View>
              <View style={styles.uploadBox}>
                <Upload color={colors.muted} size={28} />
                <Text style={styles.uploadTitle}>Arraste arquivos aqui</Text>
                <Text style={styles.uploadText}>Notas fiscais, certificados, fotos e comprovantes.</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Observações</Text>
                <TextInput
                  multiline
                  placeholder="Informações adicionais..."
                  placeholderTextColor={colors.muted}
                  value={observacoes}
                  onChangeText={setObservacoes}
                  maxLength={500}
                  style={styles.textArea}
                />
              </View>
              <View style={styles.actions}>
                <Button variant="outline" onPress={close}>
                  Cancelar
                </Button>
                <Button onPress={submit}>{submitting ? 'Registrando...' : 'Registrar Comprovação'}</Button>
              </View>
            </View>
          )}
        </Card>
      </View>
    </Modal>
  );
}

function formatQuantity(value: string) {
  const normalized = value.replace(/[^\d,.]/g, '').replace(/\./g, ',');
  const [integer = '', ...decimalParts] = normalized.split(',');
  const decimal = decimalParts.join('').slice(0, 3);
  const limitedInteger = integer.slice(0, 9);

  if (normalized.includes(',')) {
    return `${limitedInteger}${limitedInteger || decimal ? ',' : ''}${decimal}`;
  }

  return limitedInteger;
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function OptionSelect({
  emptyText,
  icon,
  options,
  value,
  onChange,
}: {
  emptyText: string;
  icon: 'material' | 'parceiro';
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  const EmptyIcon = icon === 'material' ? Package : Users;

  if (!options.length) {
    return (
      <View style={styles.emptySelect}>
        <EmptyIcon color={colors.muted} size={16} />
        <Text style={styles.emptySelectText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={styles.optionGroup}>
      {options.map((option) => {
        const selected = option === value;

        return (
          <Pressable
            key={option}
            style={[styles.optionButton, selected && styles.optionButtonSelected]}
            onPress={() => onChange(option)}
          >
            {selected ? <Check color="#fff" size={14} /> : <EmptyIcon color={colors.muted} size={14} />}
            <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: '#000000aa',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  modal: {
    maxWidth: 560,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'space-between',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderRadius: 8,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  form: {
    gap: 14,
    marginTop: 18,
  },
  twoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    gap: 7,
    minWidth: 180,
  },
  twoColField: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  textArea: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.text,
    height: 92,
    padding: 12,
    textAlignVertical: 'top',
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    maxWidth: '100%',
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionButtonSelected: {
    backgroundColor: `${colors.primary}22`,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionTextSelected: {
    color: colors.text,
  },
  emptySelect: {
    alignItems: 'center',
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    minHeight: 42,
    paddingHorizontal: 12,
  },
  emptySelectText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  uploadBox: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: 'dashed',
    borderWidth: 1,
    gap: 5,
    padding: 20,
  },
  uploadTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  uploadText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  successStack: {
    gap: 16,
    marginTop: 20,
  },
  successIcon: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}18`,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  hashBox: {
    backgroundColor: `${colors.primary}0f`,
    borderColor: `${colors.primary}44`,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  hashText: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: 13,
    marginTop: 4,
  },
  fieldGap: {
    marginTop: 14,
  },
});
