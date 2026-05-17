import { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Package, X, Check, Trash2 } from 'lucide-react-native';

import { createMaterial, updateMaterial, deleteMaterial } from '../api/client';
import type { MaterialItem } from '../data/dashboard';
import { Button, Card, colors, Input } from './ui';

export function MaterialModal({
  visible,
  material,
  onClose,
  onSaved,
  onDeleted,
}: {
  visible: boolean;
  material: MaterialItem | null;
  onClose: () => void;
  onSaved: (material: MaterialItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [nome, setNome] = useState('');
  const [volume, setVolume] = useState('');
  const [taxa, setTaxa] = useState('');
  const [situacao, setSituacao] = useState('Estável');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (material) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNome(limitText(material.material, 120));
      setVolume(formatKg(material.volume));
      setTaxa(formatPercent(material.taxa));
      setSituacao(material.situacao);
    } else {
      setNome('');
      setVolume('');
      setTaxa('');
      setSituacao('Estável');
    }
  }, [material, visible]);

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = {
        material: limitText(nome, 120).trim(),
        volume: formatKg(volume),
        taxa: formatPercent(taxa),
        situacao,
      };
      let savedMaterial;
      if (material) {
        savedMaterial = await updateMaterial(material.id, payload);
      } else {
        savedMaterial = await createMaterial(payload);
      }
      onSaved(savedMaterial);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar material:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!material) return;
    setDeleting(true);
    try {
      await deleteMaterial(material.id);
      onDeleted(material.id);
      onClose();
    } catch (error) {
      console.error('Erro ao excluir material:', error);
    } finally {
      setDeleting(false);
    }
  }

  const situacaoOptions = ['Estável', 'Em alta', 'Em queda', 'Crítico'];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <Package color={colors.primary} size={20} />
              <Text style={styles.title}>{material ? 'Editar Material' : 'Novo Material'}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <X color={colors.text} size={18} />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nome do Material</Text>
              <Input
                value={nome}
                onChangeText={(value) => setNome(limitText(value, 120))}
                placeholder="Ex: Plástico PET"
                maxLength={120}
              />
            </View>

            <View style={styles.twoCols}>
              <View style={[styles.field, styles.twoColField]}>
                <Text style={styles.fieldLabel}>Volume Atual</Text>
                <Input
                  value={volume}
                  onChangeText={(value) => setVolume(formatKg(value))}
                  placeholder="Ex: 1.250 kg"
                  keyboardType="number-pad"
                  maxLength={16}
                />
              </View>
              <View style={[styles.field, styles.twoColField]}>
                <Text style={styles.fieldLabel}>Taxa de Reciclagem</Text>
                <Input
                  value={taxa}
                  onChangeText={(value) => setTaxa(formatPercent(value))}
                  placeholder="Ex: 65%"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Situação</Text>
              <View style={styles.optionGroup}>
                {situacaoOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={[styles.optionButton, situacao === opt && styles.optionButtonSelected]}
                    onPress={() => setSituacao(opt)}
                  >
                    <Text style={[styles.optionText, situacao === opt && styles.optionTextSelected]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.actions}>
              {material && (
                <Button variant="ghost" onPress={handleDelete} style={styles.deleteBtn}>
                  <Trash2 color={colors.danger} size={18} />
                  <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir'}</Text>
                </Button>
              )}
              <View style={{ flex: 1 }} />
              <Button variant="outline" onPress={onClose}>
                Cancelar
              </Button>
              <Button onPress={handleSubmit}>
                <Check color="#fff" size={18} style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontWeight: '900' }}>
                  {submitting ? 'Salvando...' : 'Salvar Material'}
                </Text>
              </Button>
            </View>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

function limitText(value: string, maxLength: number) {
  return value.slice(0, maxLength);
}

function formatPercent(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  return `${Math.min(Number(digits), 100)}%`;
}

function formatKg(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (!digits) return '';
  return `${Number(digits).toLocaleString('pt-BR')} kg`;
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
    maxWidth: 500,
    width: '100%',
  },
  modalHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
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
    marginTop: 10,
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
    marginTop: 8,
  },
  deleteBtn: {
    borderColor: colors.danger,
  },
  deleteText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '900',
    marginLeft: 6,
  },
});
