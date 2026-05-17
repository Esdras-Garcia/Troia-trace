import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BarChart3, Check, Download, FileCheck, X } from 'lucide-react-native';

import { generateReport, downloadReport } from '../api/client';
import type { MaterialItem, ReportItem } from '../data/dashboard';
import { Button, Card, colors, Input } from './ui';

export function GerarRelatorioModal({
  visible,
  materiais,
  onClose,
  onGenerated,
}: {
  visible: boolean;
  materiais: MaterialItem[];
  onClose: () => void;
  onGenerated?: (report: ReportItem) => void;
}) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [created, setCreated] = useState<ReportItem | null>(null);
  const [tipo, setTipo] = useState('Rastreabilidade completa');
  const [formato, setFormato] = useState<'PDF' | 'XLSX'>('PDF');
  const [periodoInicio, setPeriodoInicio] = useState('2024-05-01');
  const [periodoFim, setPeriodoFim] = useState('2024-05-31');
  const [selectedMateriais, setSelectedMateriais] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const materialOptions = useMemo(() => {
    return [...new Set(materiais.map((m) => m.material).filter(Boolean))];
  }, [materiais]);

  const reportTypes = [
    'Rastreabilidade completa',
    'Volume por material',
    'Performance de parceiros',
    'Indicadores ESG',
  ];
  const formatOptions: Array<{ label: string; value: 'PDF' | 'XLSX' }> = [
    { label: 'PDF', value: 'PDF' },
    { label: 'Excel', value: 'XLSX' },
  ];

  function close() {
    setStep('form');
    setCreated(null);
    setSubmitting(false);
    onClose();
  }

  async function submit() {
    setSubmitting(true);
    try {
      const report = await generateReport({
        tipo,
        formato,
        periodoInicio,
        periodoFim,
        materiais: selectedMateriais,
      });
      setCreated(report);
      onGenerated?.(report);
      setStep('success');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    if (!created) return;
    setDownloading(true);
    try {
      await downloadReport(created.relatorio);
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
    } finally {
      setDownloading(false);
    }
  }

  function toggleMaterial(material: string) {
    setSelectedMateriais((current) =>
      current.includes(material)
        ? current.filter((m) => m !== material)
        : [...current, material]
    );
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>{step === 'success' ? 'Relatório Gerado' : 'Gerar Novo Relatório'}</Text>
              <Text style={styles.subtitle}>
                {step === 'success'
                  ? 'O relatório foi processado e está disponível para download.'
                  : 'Selecione os parâmetros para a exportação de dados.'}
              </Text>
            </View>
            <Pressable style={styles.closeButton} onPress={close}>
              <X color={colors.text} size={18} />
            </Pressable>
          </View>

          {step === 'success' ? (
            <View style={styles.successStack}>
              <View style={styles.successIcon}>
                <FileCheck color={colors.primary} size={26} />
              </View>
              <View style={styles.resultBox}>
                <Text style={styles.fieldLabel}>Nome do Arquivo</Text>
                <Text style={styles.resultText}>{created?.relatorio}</Text>
                <Text style={[styles.fieldLabel, styles.fieldGap]}>Formato / Status</Text>
                <Text style={styles.resultText}>{created?.formato} • {created?.status}</Text>
              </View>
              <View style={styles.actions}>
                <Button variant="outline" onPress={close}>Fechar</Button>
                <Pressable style={styles.primaryActionButton} onPress={handleDownload}>
                  <Download color="#fff" size={18} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '900' }}>
                    {downloading ? 'Baixando...' : 'Baixar Arquivo'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tipo de Relatório</Text>
                <View style={styles.optionGroup}>
                  {reportTypes.map((type) => (
                    <Pressable
                      key={type}
                      style={[styles.optionButton, tipo === type && styles.optionButtonSelected]}
                      onPress={() => setTipo(type)}
                    >
                      <Text style={[styles.optionText, tipo === type && styles.optionTextSelected]}>{type}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.twoCols}>
                <View style={[styles.field, styles.twoColField]}>
                  <Text style={styles.fieldLabel}>Início do Período</Text>
                  <Input value={periodoInicio} onChangeText={setPeriodoInicio} placeholder="AAAA-MM-DD" />
                </View>
                <View style={[styles.field, styles.twoColField]}>
                  <Text style={styles.fieldLabel}>Fim do Período</Text>
                  <Input value={periodoFim} onChangeText={setPeriodoFim} placeholder="AAAA-MM-DD" />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Formato de Saída</Text>
                <View style={styles.optionGroup}>
                  {formatOptions.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[styles.optionButton, formato === option.value && styles.optionButtonSelected]}
                      onPress={() => setFormato(option.value)}
                    >
                      <Text style={[styles.optionText, formato === option.value && styles.optionTextSelected]}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Materiais (opcional)</Text>
                <View style={styles.optionGroup}>
                  {materialOptions.map((m) => {
                    const selected = selectedMateriais.includes(m);
                    return (
                      <Pressable
                        key={m}
                        style={[styles.optionButton, selected && styles.optionButtonSelected]}
                        onPress={() => toggleMaterial(m)}
                      >
                        {selected && <Check color="#fff" size={14} style={{ marginRight: 4 }} />}
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{m}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.actions}>
                <Button variant="outline" onPress={close}>
                  Cancelar
                </Button>
                <Pressable style={styles.primaryActionButton} onPress={submit}>
                  <BarChart3 color="#fff" size={18} style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontWeight: '900' }}>
                    {submitting ? 'Processando...' : 'Gerar Relatório'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        </Card>
      </View>
    </Modal>
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
    gap: 16,
    marginTop: 18,
  },
  twoCols: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    gap: 8,
  },
  twoColField: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
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
    minHeight: 38,
    paddingHorizontal: 12,
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
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  primaryActionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 16,
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
  resultBox: {
    backgroundColor: `${colors.primary}0f`,
    borderColor: `${colors.primary}44`,
    borderRadius: 8,
    borderWidth: 1,
    padding: 14,
  },
  resultText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 4,
  },
  fieldGap: {
    marginTop: 14,
  },
});
