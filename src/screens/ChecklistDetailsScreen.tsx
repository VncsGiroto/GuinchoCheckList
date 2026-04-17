import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CameraView } from "expo-camera";
import { LabeledTextInput } from "../components/LabeledTextInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusChip } from "../components/StatusChip";
import { APP_COLORS } from "../theme/colors";
import type { ChecklistRecord, GeoPoint } from "../types/checklist";
import { useMemo, useRef, useState } from "react";
import { useLocationCapture } from "../hooks/useLocationCapture";
import { usePhotoCapture } from "../hooks/usePhotoCapture";
import { generateChecklistPdfAsync } from "../services/pdf/generateChecklistPdf";
import * as Sharing from "expo-sharing";

type StageType = "pickup" | "delivery";
type PhotoLabelKey = "frente" | "traseira" | "lado_esq" | "lado_dir" | "teto" | "interior" | "danos";

interface ChecklistDetailsScreenProps {
  checklist: ChecklistRecord;
  onBack: () => void;
  onPickupSave: (
    signatureBase64: string | null,
    coordinates: GeoPoint | null,
    timestampIso: string,
    photoPaths: string[],
  ) => Promise<void>;
  onDeliverySave: (
    signatureBase64: string | null,
    coordinates: GeoPoint | null,
    timestampIso: string,
    photoPaths: string[],
  ) => Promise<void>;
}

const PHOTO_LABELS: Array<{ key: PhotoLabelKey; label: string }> = [
  { key: "frente", label: "Frente" },
  { key: "traseira", label: "Traseira" },
  { key: "lado_esq", label: "Lado Esq" },
  { key: "lado_dir", label: "Lado Dir" },
  { key: "teto", label: "Teto" },
  { key: "interior", label: "Interior" },
  { key: "danos", label: "Danos" },
];

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

const includesStage = (photoPath: string, stage: StageType): boolean => photoPath.includes(`_${stage}_`);

export const ChecklistDetailsScreen = ({
  checklist,
  onBack,
  onPickupSave,
  onDeliverySave,
}: ChecklistDetailsScreenProps) => {
  const cameraRef = useRef<CameraView | null>(null);
  const { hasLocationPermission, isLoadingLocation, captureLocationAsync } = useLocationCapture();
  const { hasCameraPermission, requestCameraPermission, compressAndPersistPhotoAsync, isSavingPhoto } = usePhotoCapture();
  const [pickupSignature, setPickupSignature] = useState("");
  const [deliverySignature, setDeliverySignature] = useState("");
  const [isSavingPickup, setIsSavingPickup] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeStageCamera, setActiveStageCamera] = useState<StageType | null>(null);
  const [activePhotoLabel, setActivePhotoLabel] = useState<PhotoLabelKey>("frente");
  const [pickupDraftPhotos, setPickupDraftPhotos] = useState<string[]>([]);
  const [deliveryDraftPhotos, setDeliveryDraftPhotos] = useState<string[]>([]);

  const isPickupLocked = useMemo(() => {
    return checklist.status !== "rascunho" || Boolean(checklist.pickup.signatureBase64);
  }, [checklist.pickup.signatureBase64, checklist.status]);

  const isDeliveryLocked = checklist.status === "concluido";

  const existingPickupCount = checklist.photoPaths.filter((photoPath) => includesStage(photoPath, "pickup")).length;
  const existingDeliveryCount = checklist.photoPaths.filter((photoPath) => includesStage(photoPath, "delivery")).length;

  const capturePhotoAsync = async () => {
    if (!activeStageCamera) {
      return;
    }

    if (!cameraRef.current) {
      Alert.alert("Camera", "Camera indisponivel no momento.");
      return;
    }

    try {
      const captured = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: true,
      });

      if (!captured?.uri) {
        throw new Error("Nao foi possivel capturar imagem.");
      }

      const label = `${activeStageCamera}_${activePhotoLabel}`;
      const persistedPhotoPath = await compressAndPersistPhotoAsync(captured.uri, checklist.id, label);

      if (activeStageCamera === "pickup") {
        setPickupDraftPhotos((current) => [...current, persistedPhotoPath]);
      } else {
        setDeliveryDraftPhotos((current) => [...current, persistedPhotoPath]);
      }
    } catch (error) {
      Alert.alert("Erro na foto", (error as Error).message);
    }
  };

  const handleSavePickupAsync = async () => {
    setIsSavingPickup(true);
    try {
      const coordinates = await captureLocationAsync();
      const timestampIso = new Date().toISOString();
      await onPickupSave(pickupSignature.trim() || null, coordinates, timestampIso, pickupDraftPhotos);
      setPickupSignature("");
      setPickupDraftPhotos([]);
      setActiveStageCamera(null);
      Alert.alert("Coleta salva", "GPS, horario e fotos da coleta foram registrados.");
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
      await onDeliverySave(deliverySignature.trim() || null, coordinates, timestampIso, deliveryDraftPhotos);
      setDeliverySignature("");
      setDeliveryDraftPhotos([]);
      setActiveStageCamera(null);
      Alert.alert("Entrega salva", "GPS, horario e fotos da entrega foram registrados.");
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

  const renderPhotoChips = () => {
    return (
      <View style={styles.photoLabelWrap}>
        {PHOTO_LABELS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => setActivePhotoLabel(item.key)}
            style={[styles.photoChip, activePhotoLabel === item.key ? styles.photoChipActive : undefined]}
          >
            <Text style={[styles.photoChipText, activePhotoLabel === item.key ? styles.photoChipTextActive : undefined]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PrimaryButton label="Voltar para inicio" onPress={onBack} />

      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{checklist.customer.name}</Text>
          <StatusChip
            label={translateStatus(checklist.status)}
            variant={checklist.status === "concluido" ? "success" : "default"}
          />
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
        <Text style={styles.cardTitle}>Fotos</Text>
        <Text style={styles.meta}>Escolha o angulo e fotografe para coleta ou entrega.</Text>
        {renderPhotoChips()}
        {!hasCameraPermission ? (
          <PrimaryButton label="Permitir camera" onPress={() => void requestCameraPermission()} />
        ) : null}
        <View style={styles.photoActionRow}>
          <PrimaryButton
            disabled={!hasCameraPermission || isPickupLocked}
            label={isPickupLocked ? "Coleta bloqueada" : "Camera coleta"}
            onPress={() => setActiveStageCamera("pickup")}
          />
          <PrimaryButton
            disabled={!hasCameraPermission || checklist.status === "rascunho" || isDeliveryLocked}
            label={isDeliveryLocked ? "Entrega bloqueada" : "Camera entrega"}
            onPress={() => setActiveStageCamera("delivery")}
          />
        </View>
        {activeStageCamera ? (
          <View style={styles.cameraWrap}>
            <Text style={styles.meta}>Camera ativa: {activeStageCamera === "pickup" ? "Coleta" : "Entrega"}</Text>
            <CameraView ref={cameraRef} style={styles.camera} />
            <PrimaryButton
              disabled={isSavingPhoto}
              label={isSavingPhoto ? "Processando foto..." : "Capturar foto"}
              onPress={() => void capturePhotoAsync()}
            />
          </View>
        ) : null}
        <Text style={styles.meta}>
          Fotos coleta: {existingPickupCount + pickupDraftPhotos.length} | Fotos entrega:{" "}
          {existingDeliveryCount + deliveryDraftPhotos.length}
        </Text>
        <View style={styles.previewRow}>
          {pickupDraftPhotos.concat(deliveryDraftPhotos).slice(-4).map((photoPath) => (
            <Image key={photoPath} source={{ uri: photoPath }} style={styles.previewImage} />
          ))}
        </View>
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
  photoLabelWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    backgroundColor: APP_COLORS.card,
  },
  photoChipActive: {
    backgroundColor: APP_COLORS.primary,
    borderColor: APP_COLORS.primary,
  },
  photoChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  photoChipTextActive: {
    color: "#FFFFFF",
  },
  photoActionRow: {
    gap: 8,
  },
  cameraWrap: {
    gap: 8,
  },
  camera: {
    height: 250,
    borderRadius: 12,
    overflow: "hidden",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  previewImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
  },
});
