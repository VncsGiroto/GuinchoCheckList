import { ActivityIndicator, Dimensions, Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import { useEffect, useMemo, useRef, useState } from "react";
import { APP_COLORS } from "../theme/colors";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SignatureCaptureFieldProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export const SignatureCaptureField = ({ label, value, onChange, disabled = false }: SignatureCaptureFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [signatureKey, setSignatureKey] = useState(0);
  const signatureRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const waitForLandscapeAsync = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const { width, height } = Dimensions.get("window");
        if (width > height) {
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    };

    const applySignatureOrientationAsync = async () => {
      if (isOpen) {
        setIsCanvasReady(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        await waitForLandscapeAsync();
        await new Promise((resolve) => setTimeout(resolve, 120));
        setSignatureKey((current) => current + 1);
        setIsCanvasReady(true);
      } else {
        setIsCanvasReady(false);
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      }
    };

    void applySignatureOrientationAsync();

    return () => {
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, [isOpen]);

  const htmlStyle = useMemo(
    () => `
      .m-signature-pad--footer { display: none; margin: 0; }
      .m-signature-pad { box-shadow: none; border: none; }
      .m-signature-pad--body { border: none; }
      .m-signature-pad--body canvas { width: 100% !important; height: 100% !important; }
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

      <Modal animationType="slide" transparent={false} visible={isOpen}>
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
                  onEmpty={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                  onOK={(signatureDataUrl: string) => {
                    onChange(signatureDataUrl);
                    setIsOpen(false);
                  }}
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
              <Pressable
                onPress={() => {
                  signatureRef.current?.clearSignature();
                  onChange(null);
                }}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryText}>Limpar</Text>
              </Pressable>
              <Pressable onPress={() => signatureRef.current?.readSignature()} style={styles.primaryButton}>
                <Text style={styles.primaryText}>Confirmar assinatura</Text>
              </Pressable>
              <Pressable onPress={() => setIsOpen(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
            </View>
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
