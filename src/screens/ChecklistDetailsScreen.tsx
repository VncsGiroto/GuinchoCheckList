import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { LabeledTextInput } from "../components/LabeledTextInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusChip } from "../components/StatusChip";
import { APP_COLORS } from "../theme/colors";
import type { ChecklistRecord, GeoPoint } from "../types/checklist";
import { useMemo, useState } from "react";
import { useLocationCapture } from "../hooks/useLocationCapture";
import { generateChecklistPdfAsync } from "../services/pdf/generateChecklistPdf";
import * as Sharing from "expo-sharing";

interface ChecklistDetailsScreenProps {
  checklist: ChecklistRecord;
  onBack: () => void;
  onPickupSave: (signatureBase64: string | null, coordinates: GeoPoint | null, timestampIso: string) => Promise<void>;
  onDeliverySave: (signatureBase64: string | null, coordinates: GeoPoint | null, timestampIso: string) => Promise<void>;
}

const translateStatus = (status: ChecklistRecord["status"]): string => {
  if (status === "rascunho") return "Rascunho";
  if (status === "em_transito") return "Em transito";
  return "Concluido";
};

const formatCoordinates = (coordinates: ChecklistRecord["pickup"]["coordinates"]): string => {
  if (!coordinates) {
    return "Nao capturado";
  }

  return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
};

export const ChecklistDetailsScreen = ({
  checklist,
  onBack,
  onPickupSave,
  onDeliverySave,
}: ChecklistDetailsScreenProps) => {
  const { hasLocationPermission, isLoadingLocation, captureLocationAsync } = useLocationCapture();
  const [pickupSignature, setPickupSignature] = useState("");
  const [deliverySignature, setDeliverySignature] = useState("");
  const [isSavingPickup, setIsSavingPickup] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const isPickupLocked = useMemo(() => {
    return checklist.status !== "rascunho" || Boolean(checklist.pickup.signatureBase64);
  }, [checklist.pickup.signatureBase64, checklist.status]);

  const isDeliveryLocked = checklist.status === "concluido";

  const handleSavePickupAsync = async () => {
    setIsSavingPickup(true);
    try {
      const coordinates = await captureLocationAsync();
      const timestampIso = new Date().toISOString();
      await onPickupSave(pickupSignature.trim() || null, coordinates, timestampIso);
      setPickupSignature("");
      Alert.alert("Coleta salva", "GPS e horario foram registrados.");
    } catch (error) {
      Alert.alert("Erro na coleta", (error as Error).message);
    } finally {
      setIsSavingPickup(false);
    }
  };

  const handleSaveDeliveryAsync = async () => {
    setIsSavingDelivery(true);
    try {
      const coordinates = await captureLocationAsync();
      const timestampIso = new Date().toISOString();
      await onDeliverySave(deliverySignature.trim() || null, coordinates, timestampIso);
      setDeliverySignature("");
      Alert.alert("Entrega salva", "GPS e horario foram registrados.");
    } catch (error) {
      Alert.alert("Erro na entrega", (error as Error).message);
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleGeneratePdfAsync = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfPath = await generateChecklistPdfAsync(checklist);
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(pdfPath);
      } else {
        Alert.alert("PDF gerado", `Arquivo salvo em: ${pdfPath}`);
      }
    } catch (error) {
      Alert.alert("Erro ao gerar PDF", (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PrimaryButton label="Voltar para inicio" onPress={onBack} />

      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{checklist.customer.name}</Text>
          <StatusChip label={translateStatus(checklist.status)} variant={checklist.status === "concluido" ? "success" : "default"} />
        </View>
        <Text style={styles.subtitle}>
          {checklist.vehicle.plate} • {checklist.vehicle.brand} {checklist.vehicle.model}
        </Text>
        <Text style={styles.meta}>
          Localizacao: {hasLocationPermission ? "permitida" : "nao permitida"} {isLoadingLocation ? "• capturando..." : ""}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Dados do veiculo</Text>
        <LabeledTextInput editable={false} label="Placa" onChangeText={() => undefined} value={checklist.vehicle.plate} />
        <LabeledTextInput editable={false} label="Marca" onChangeText={() => undefined} value={checklist.vehicle.brand} />
        <LabeledTextInput editable={false} label="Modelo" onChangeText={() => undefined} value={checklist.vehicle.model} />
        <LabeledTextInput editable={false} label="Cor" onChangeText={() => undefined} value={checklist.vehicle.color} />
        <LabeledTextInput editable={false} label="Ano" onChangeText={() => undefined} value={checklist.vehicle.year} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Etapa de coleta</Text>
        <Text style={styles.meta}>Hora: {checklist.pickup.timestampIso ?? "Nao capturado"}</Text>
        <Text style={styles.meta}>GPS: {formatCoordinates(checklist.pickup.coordinates)}</Text>
        <LabeledTextInput
          editable={!isPickupLocked}
          label="Assinatura coleta (base64 opcional)"
          multiline
          onChangeText={setPickupSignature}
          value={pickupSignature}
        />
        <PrimaryButton
          disabled={isPickupLocked || isSavingPickup}
          label={isPickupLocked ? "Coleta bloqueada" : isSavingPickup ? "Salvando coleta..." : "Salvar coleta"}
          onPress={handleSavePickupAsync}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Etapa de entrega</Text>
        <Text style={styles.meta}>Hora: {checklist.delivery.timestampIso ?? "Nao capturado"}</Text>
        <Text style={styles.meta}>GPS: {formatCoordinates(checklist.delivery.coordinates)}</Text>
        <LabeledTextInput
          editable={!isDeliveryLocked}
          label="Assinatura entrega (base64 opcional)"
          multiline
          onChangeText={setDeliverySignature}
          value={deliverySignature}
        />
        <PrimaryButton
          disabled={checklist.status === "rascunho" || isDeliveryLocked || isSavingDelivery}
          label={
            checklist.status === "rascunho"
              ? "Salve coleta primeiro"
              : isDeliveryLocked
                ? "Entrega bloqueada"
                : isSavingDelivery
                  ? "Salvando entrega..."
                  : "Salvar entrega"
          }
          onPress={handleSaveDeliveryAsync}
        />
      </View>

      <PrimaryButton
        disabled={isGeneratingPdf}
        label={isGeneratingPdf ? "Gerando PDF..." : "Gerar e compartilhar PDF"}
        onPress={handleGeneratePdfAsync}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: APP_COLORS.text,
    flex: 1,
  },
  subtitle: {
    fontSize: 15,
    color: APP_COLORS.text,
    opacity: 0.85,
  },
  meta: {
    fontSize: 13,
    color: APP_COLORS.text,
    opacity: 0.8,
  },
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
});
