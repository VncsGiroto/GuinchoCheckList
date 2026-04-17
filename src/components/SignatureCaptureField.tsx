import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import { useMemo, useState } from "react";
import { APP_COLORS } from "../theme/colors";

interface SignatureCaptureFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const SignatureCaptureField = ({ label, value, onChange, disabled = false }: SignatureCaptureFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const htmlStyle = useMemo(
    () => `
      .m-signature-pad { box-shadow: none; border: none; }
      body, html { width: 100%; height: 100%; margin: 0; padding: 0; background: #ffffff; }
    `,
    [],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {value ? (
        <Image resizeMode="contain" source={{ uri: value }} style={styles.previewImage} />
      ) : (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sem assinatura registrada</Text>
        </View>
      )}

      <View style={styles.actionsRow}>
        <Pressable
          disabled={disabled}
          onPress={() => setIsOpen(true)}
          style={[styles.actionButton, disabled ? styles.actionButtonDisabled : undefined]}
        >
          <Text style={styles.actionText}>{value ? "Refazer assinatura" : "Capturar assinatura"}</Text>
        </Pressable>
        <Pressable
          disabled={disabled || !value}
          onPress={() => onChange(null)}
          style={[styles.clearButton, disabled || !value ? styles.actionButtonDisabled : undefined]}
        >
          <Text style={styles.clearText}>Limpar</Text>
        </Pressable>
      </View>

      <Modal animationType="slide" transparent visible={isOpen}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Desenhe a assinatura</Text>
            <View style={styles.signatureWrap}>
              <SignatureScreen
                autoClear={false}
                clearText="Limpar"
                descriptionText="Assine dentro da area"
                confirmText="Confirmar"
                onEmpty={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                onOK={(signatureDataUrl: string) => {
                  onChange(signatureDataUrl);
                  setIsOpen(false);
                }}
                webStyle={htmlStyle}
              />
            </View>
            <Pressable onPress={() => setIsOpen(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  emptyBox: {
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: APP_COLORS.text,
    opacity: 0.7,
    fontSize: 13,
  },
  previewImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    backgroundColor: "#FFFFFF",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: APP_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  clearButton: {
    minHeight: 44,
    minWidth: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  clearText: {
    color: APP_COLORS.danger,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 12,
    gap: 10,
    minHeight: 420,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  signatureWrap: {
    flex: 1,
    minHeight: 300,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
  },
  closeButton: {
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: APP_COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
