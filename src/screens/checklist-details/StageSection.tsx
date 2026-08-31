import { StyleSheet, Text, View } from "react-native";
import { LabeledTextInput } from "../../components/LabeledTextInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { SignatureCaptureField } from "../../components/SignatureCaptureField";
import { APP_COLORS } from "../../theme/colors";

interface StageSectionProps {
  title: string;
  timestampIso: string | null;
  coordinates: { latitude: number; longitude: number } | null;
  receiverName: string;
  onReceiverNameChange: (value: string) => void;
  receiverDocumentId: string;
  onReceiverDocumentIdChange: (value: string) => void;
  signature: string | null;
  onSignatureChange: (value: string | null) => void;
  isLocked: boolean;
  isSaving: boolean;
  onSave: () => void;
  saveLabel: string;
  savingLabel: string;
  lockedLabel: string;
}

const formatCoordinates = (coordinates: { latitude: number; longitude: number } | null): string => {
  if (!coordinates) {
    return "Nao capturado";
  }
  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
};

export const StageSection = ({
  title,
  timestampIso,
  coordinates,
  receiverName,
  onReceiverNameChange,
  receiverDocumentId,
  onReceiverDocumentIdChange,
  signature,
  onSignatureChange,
  isLocked,
  isSaving,
  onSave,
  saveLabel,
  savingLabel,
  lockedLabel,
}: StageSectionProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.meta}>Hora: {timestampIso ?? "Nao capturado"}</Text>
      <Text style={styles.meta}>GPS: {formatCoordinates(coordinates)}</Text>
      <LabeledTextInput editable={!isLocked} label="Responsável - Nome" onChangeText={onReceiverNameChange} value={receiverName} />
      <LabeledTextInput
        editable={!isLocked}
        label="Documento (CPF/RG)"
        onChangeText={onReceiverDocumentIdChange}
        value={receiverDocumentId}
      />
      <SignatureCaptureField disabled={isLocked} label={`Assinatura ${title.toLowerCase()} (opcional)`} onChange={onSignatureChange} value={signature} />
      <PrimaryButton
        disabled={isLocked || isSaving}
        label={isLocked ? lockedLabel : isSaving ? savingLabel : saveLabel}
        onPress={onSave}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    padding: 12,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  meta: {
    fontSize: 13,
    color: APP_COLORS.text,
    opacity: 0.8,
  },
});
