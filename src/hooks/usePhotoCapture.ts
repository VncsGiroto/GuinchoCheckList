import { useCallback, useEffect, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import * as ImageManipulator from "expo-image-manipulator";
import { useCameraPermissions } from "expo-camera";

const PHOTO_DIRECTORY = `${FileSystem.documentDirectory}checklist-photos`;
const MAX_WIDTH = 1200;
const COMPRESS_QUALITY = 0.8;

const buildPhotoName = (checklistId: string, label: string): string => {
  return `${checklistId}_${label}_${Date.now()}.jpg`;
};

export const usePhotoCapture = () => {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [isSavingPhoto, setIsSavingPhoto] = useState<boolean>(false);

  useEffect(() => {
    if (!cameraPermission) {
      void requestCameraPermission();
    }
  }, [cameraPermission, requestCameraPermission]);

  const ensureDirectoryAsync = useCallback(async () => {
    const directoryInfo = await FileSystem.getInfoAsync(PHOTO_DIRECTORY);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(PHOTO_DIRECTORY, { intermediates: true });
    }
  }, []);

  const compressAndPersistPhotoAsync = useCallback(
    async (photoUri: string, checklistId: string, label: string): Promise<string> => {
      setIsSavingPhoto(true);

      try {
        await ensureDirectoryAsync();

        const manipulated = await ImageManipulator.manipulateAsync(
          photoUri,
          [{ resize: { width: MAX_WIDTH } }],
          { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
        );

        const outputPath = `${PHOTO_DIRECTORY}/${buildPhotoName(checklistId, label)}`;
        await FileSystem.copyAsync({ from: manipulated.uri, to: outputPath });
        return outputPath;
      } catch (error) {
        throw new Error(`Failed to persist photo: ${(error as Error).message}`);
      } finally {
        setIsSavingPhoto(false);
      }
    },
    [ensureDirectoryAsync],
  );

  return {
    cameraType: "back" as const,
    hasCameraPermission: cameraPermission?.granted ?? false,
    isSavingPhoto,
    requestCameraPermission,
    compressAndPersistPhotoAsync,
  };
};
