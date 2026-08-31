import { useRef, useState } from "react";
import { Alert } from "react-native";
import { CameraView } from "expo-camera";
import { usePhotoCapture } from "./usePhotoCapture";
import type { ChecklistRecord } from "../types/checklist";

type StageType = "pickup" | "delivery";
type PhotoLabelKey = "frente" | "traseira" | "lado_esq" | "lado_dir" | "teto" | "interior" | "danos";

export const PHOTO_LABELS: Array<{ key: PhotoLabelKey; label: string }> = [
  { key: "frente", label: "Frente" },
  { key: "traseira", label: "Traseira" },
  { key: "lado_esq", label: "Lado Esq" },
  { key: "lado_dir", label: "Lado Dir" },
  { key: "teto", label: "Teto" },
  { key: "interior", label: "Interior" },
  { key: "danos", label: "Danos" },
];

const includesStage = (photoPath: string, stage: StageType): boolean => photoPath.includes(`_${stage}_`);

export const usePhotoCaptureStage = (checklist: ChecklistRecord) => {
  const cameraRef = useRef<CameraView | null>(null);
  const { hasCameraPermission, requestCameraPermission, compressAndPersistPhotoAsync, isSavingPhoto } = usePhotoCapture();
  const [activeStageCamera, setActiveStageCamera] = useState<StageType | null>(null);
  const [activePhotoLabel, setActivePhotoLabel] = useState<PhotoLabelKey>("frente");
  const [pickupDraftPhotos, setPickupDraftPhotos] = useState<string[]>([]);
  const [deliveryDraftPhotos, setDeliveryDraftPhotos] = useState<string[]>([]);

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

  const clearStagePhotos = (stage: StageType) => {
    if (stage === "pickup") setPickupDraftPhotos([]);
    else setDeliveryDraftPhotos([]);
  };

  return {
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
  };
};

export type { StageType, PhotoLabelKey };
