import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CameraView } from "expo-camera";
import { LabeledTextInput } from "../../components/LabeledTextInput";
import { PrimaryButton } from "../../components/PrimaryButton";
import { StatusChip } from "../../components/StatusChip";
import { APP_COLORS } from "../../theme/colors";
import type { ChecklistRecord, GeoPoint } from "../../types/checklist";
import { useState } from "react";
import { useLocationCapture } from "../../hooks/useLocationCapture";
import { useChecklistStageState } from "../../hooks/useChecklistStageState";
import { PHOTO_LABELS, usePhotoCaptureStage } from "../../hooks/usePhotoCaptureStage";
import { useChecklistActions } from "../../hooks/useChecklistActions";
import { StageSection } from "./StageSection";

type ChecklistDetailsScreenProps = {
  checklist: ChecklistRecord;
  onBack: () => void;
  onDeleteChecklist: () => Promise<void>;
  onPickupSave: (
    signatureBase64: string | null,
    coordinates: GeoPoint | null,
    timestampIso: string,
    photoPaths: string[],
    receiverName: string | null,
    receiverDocumentId: string | null,
  ) => Promise<void>;
  onDeliverySave: (
    signatureBase64: string | null,
    coordinates: GeoPoint | null,
    timestampIso: string,
    photoPaths: string[],
    receiverName: string | null,
    receiverDocumentId: string | null,
  ) => Promise<void>;
};

const translateStatus = (status: ChecklistRecord["status"]): string => {
  if (status === "rascunho") return "Rascunho";
  if (status === "em_transito") return "Em transito";
  return "Concluido";
};

export const ChecklistDetailsScreen = ({
  checklist,
  onBack,
  onDeleteChecklist,
  onPickupSave,
  onDeliverySave,
}: ChecklistDetailsScreenProps) => {
  const { hasLocationPermission, isLoadingLocation, captureLocationAsync } = useLocationCapture();
  const {
    pickupSignature,
    setPickupSignature,
    deliverySignature,
    setDeliverySignature,
    pickupReceiverName,
    setPickupReceiverName,
    pickupReceiverDocumentId,
    setPickupReceiverDocumentId,
    deliveryReceiverName,
    setDeliveryReceiverName,
    deliveryReceiverDocumentId,
    setDeliveryReceiverDocumentId,
    isPickupLocked,
    isDeliveryLocked,
  } = useChecklistStageState(checklist);

  const {
    cameraRef,
    hasCameraPermission,
    requestCameraPermission,
    isSavingPhoto,
    activeStageCamera,
    setActiveStageCamera,
    activePhotoLabel,
    setActivePhotoLabel,
    pickupDraftPhotos,
    deliveryDraftPhotos,
    existingPickupCount,
    existingDeliveryCount,
    capturePhotoAsync,
    clearStagePhotos,
  } = usePhotoCaptureStage(checklist);

  const { isGeneratingPdf, isDeletingChecklist, handleGeneratePdfAsync, handleDeletePress } = useChecklistActions(
    checklist,
    onDeleteChecklist,
  );

  const [isSavingPickup, setIsSavingPickup] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);

  const handleSavePickupAsync = async () => {
    setIsSavingPickup(true);
    try {
      const coordinates = await captureLocationAsync();
      const timestampIso = new Date().toISOString();
      await onPickupSave(
        pickupSignature,
        coordinates,
        timestampIso,
        pickupDraftPhotos,
        pickupReceiverName.trim() || null,
        pickupReceiverDocumentId.trim() || null,
      );
      clearStagePhotos("pickup");
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
      await onDeliverySave(
        deliverySignature,
        coordinates,
        timestampIso,
        deliveryDraftPhotos,
        deliveryReceiverName.trim() || null,
        deliveryReceiverDocumentId.trim() || null,
      );
      clearStagePhotos("delivery");
      setActiveStageCamera(null);
      Alert.alert("Entrega salva", "GPS, horario e fotos da entrega foram registrados.");
    } catch (error) {
      Alert.alert("Erro na entrega", (error as Error).message);
    } finally {
      setIsSavingDelivery(false);
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
        <Text style={styles.cardTitle}>Fotos</Text>
        <Text style={styles.meta}>Escolha o angulo e fotografe para coleta ou entrega.</Text>
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
        {!hasCameraPermission ? <PrimaryButton label="Permitir camera" onPress={() => void requestCameraPermission()} /> : null}
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
          Fotos coleta: {existingPickupCount + pickupDraftPhotos.length} | Fotos entrega: {existingDeliveryCount + deliveryDraftPhotos.length}
        </Text>
        <View style={styles.previewRow}>
          {pickupDraftPhotos.concat(deliveryDraftPhotos).slice(-4).map((photoPath) => (
            <Image key={photoPath} source={{ uri: photoPath }} style={styles.previewImage} />
          ))}
        </View>
      </View>

      <StageSection
        coordinates={checklist.pickup.coordinates}
        isLocked={isPickupLocked}
        isSaving={isSavingPickup}
        lockedLabel="Coleta bloqueada"
        onReceiverDocumentIdChange={setPickupReceiverDocumentId}
        onReceiverNameChange={setPickupReceiverName}
        onSave={handleSavePickupAsync}
        onSignatureChange={setPickupSignature}
        receiverDocumentId={pickupReceiverDocumentId}
        receiverName={pickupReceiverName}
        saveLabel="Salvar coleta"
        savingLabel="Salvando coleta..."
        signature={pickupSignature}
        timestampIso={checklist.pickup.timestampIso}
        title="Etapa de coleta"
      />

      <StageSection
        coordinates={checklist.delivery.coordinates}
        isLocked={isDeliveryLocked || checklist.status === "rascunho"}
        isSaving={isSavingDelivery}
        lockedLabel={checklist.status === "rascunho" ? "Salve coleta primeiro" : "Entrega bloqueada"}
        onReceiverDocumentIdChange={setDeliveryReceiverDocumentId}
        onReceiverNameChange={setDeliveryReceiverName}
        onSave={handleSaveDeliveryAsync}
        onSignatureChange={setDeliverySignature}
        receiverDocumentId={deliveryReceiverDocumentId}
        receiverName={deliveryReceiverName}
        saveLabel={checklist.status === "rascunho" ? "Salve coleta primeiro" : "Salvar entrega"}
        savingLabel="Salvando entrega..."
        signature={deliverySignature}
        timestampIso={checklist.delivery.timestampIso}
        title="Etapa de entrega"
      />

      <PrimaryButton
        disabled={isGeneratingPdf}
        label={isGeneratingPdf ? "Gerando PDF..." : "Gerar e compartilhar PDF"}
        onPress={handleGeneratePdfAsync}
      />

      <Pressable
        disabled={isDeletingChecklist}
        onPress={handleDeletePress}
        style={[styles.deleteButton, isDeletingChecklist ? styles.deleteButtonDisabled : undefined]}
      >
        <Text style={styles.deleteButtonText}>{isDeletingChecklist ? "Excluindo checklist..." : "Excluir Checklist"}</Text>
      </Pressable>
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
  deleteButton: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: APP_COLORS.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
