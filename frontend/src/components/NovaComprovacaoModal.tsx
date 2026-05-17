import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { FileCheck, Upload, X } from 'lucide-react-native';

import { Button, Card, colors, Input } from './ui';

export function NovaComprovacaoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [registered, setRegistered] = useState(false);

  function close() {
    setRegistered(false);
    onClose();
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={close}>
      <View style={styles.overlay}>
        <Card style={styles.modal}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.title}>{registered ? 'Comprovacao Registrada' : 'Nova Comprovacao de Lastro'}</Text>
              <Text style={styles.subtitle}>
                {registered
                  ? 'A operacao recebeu um hash rastreavel para auditoria.'
                  : 'Registre uma operacao de logistica reversa com evidencias.'}
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
                <Text style={styles.fieldLabel}>ID da Comprovacao</Text>
                <Text style={styles.hashText}>COMP-006</Text>
                <Text style={[styles.fieldLabel, styles.fieldGap]}>Hash do Lastro</Text>
                <Text style={styles.hashText}>0x4f8a7c2d1e9b3f6a5c8d2e7b4a9c1f3d</Text>
              </View>
              <Button onPress={close}>Ver Comprovacao</Button>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.twoCols}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Material</Text>
                  <Input value="Plastico PET" />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Quantidade (kg)</Text>
                  <Input value="1250" />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tipo de Operacao</Text>
                <Input value="Coleta" />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Parceiro Responsavel</Text>
                <Input value="RecycleTech Ltda" />
              </View>
              <View style={styles.uploadBox}>
                <Upload color={colors.muted} size={28} />
                <Text style={styles.uploadTitle}>Arraste arquivos aqui</Text>
                <Text style={styles.uploadText}>Notas fiscais, certificados, fotos e comprovantes.</Text>
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Observacoes</Text>
                <TextInput
                  multiline
                  placeholder="Informacoes adicionais..."
                  placeholderTextColor={colors.muted}
                  style={styles.textArea}
                />
              </View>
              <View style={styles.actions}>
                <Button variant="outline" onPress={close}>
                  Cancelar
                </Button>
                <Button onPress={() => setRegistered(true)}>Registrar Comprovacao</Button>
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
    gap: 14,
    marginTop: 18,
  },
  twoCols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 7,
    minWidth: 180,
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
    minHeight: 82,
    padding: 12,
    textAlignVertical: 'top',
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
