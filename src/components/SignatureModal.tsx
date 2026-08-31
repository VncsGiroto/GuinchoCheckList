import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import { APP_COLORS } from "../theme/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SignatureModalProps {
  visible: boolean;
  isCanvasReady: boolean;
  signatureKey: number;
  signatureRef: React.RefObject<any>;
  htmlStyle: string;
  onOK: (signatureDataUrl: string) => void;
  onEmpty: () => void;
  onClear: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

export const SignatureModal = ({
  visible,
  isCanvasReady,
  signatureKey,
  signatureRef,
  htmlStyle,
  onOK,
  onEmpty,
  onClear,
  onConfirm,
  onClose,
}: SignatureModalProps) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" transparent={false} visible={visible}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
          <Text style={styles.modalTitle}>Desenhe a assinatura</Text>
          <View style={styles.signatureWrap}>
            {isCanvasReady ? (
              <SignatureScreen
                androidLayerType="software"
                autoClear={false}
                descriptionText="Assine dentro da area"
                key={signatureKey}
                onEmpty={onEmpty}
                onOK={onOK}
                ref={signatureRef}
                webStyle={htmlStyle}
                webviewProps={{
                  androidLayerType: "software",
                  cacheEnabled: false,
                }}
              />
            ) : (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={APP_COLORS.primary} />
                <Text style={styles.loadingText}>Ajustando area de assinatura...</Text>
              </View>
            )}
          </View>
          <View style={styles.modalActions}>
            <Pressable onPress={onClear} style={styles.secondaryButton}>
              <Text style={styles.secondaryText}>Limpar</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.primaryButton}>
              <Text style={styles.primaryText}>Confirmar assinatura</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modalCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    gap: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  signatureWrap: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    fontSize: 13,
    color: APP_COLORS.text,
    opacity: 0.8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 8,
  },
  primaryButton: {
    flex: 1.3,
    minHeight: 44,
    borderRadius: 10,
    backgroundColor: APP_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  secondaryText: {
    color: APP_COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 10,
    backgroundColor: APP_COLORS.text,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
