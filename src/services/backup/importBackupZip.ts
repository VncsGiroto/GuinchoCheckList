import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";
import {
  CHECKLIST_DATABASE_FILE_NAME,
  CHECKLIST_PHOTOS_DIRECTORY_NAME,
} from "../../constants/storage";
import { initializeDatabaseAsync, resetDatabaseConnectionAsync } from "../../database/client";

const SQLITE_DIRECTORY = `${FileSystem.documentDirectory}SQLite`;
const CHECKLIST_PHOTOS_DIRECTORY = `${FileSystem.documentDirectory}${CHECKLIST_PHOTOS_DIRECTORY_NAME}`;

interface ImportBackupResult {
  restoredDatabase: boolean;
  restoredPhotosCount: number;
}

const ensureDirectoryAsync = async (directoryPath: string) => {
  const info = await FileSystem.getInfoAsync(directoryPath);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(directoryPath, { intermediates: true });
  }
};

export const importBackupZipAsync = async (): Promise<ImportBackupResult> => {
  const picked = await DocumentPicker.getDocumentAsync({
    type: "application/zip",
    copyToCacheDirectory: true,
    multiple: false,
  });

  if (picked.canceled || picked.assets.length === 0) {
    throw new Error("Importacao cancelada.");
  }

  const zipUri = picked.assets[0].uri;
  const zipBase64 = await FileSystem.readAsStringAsync(zipUri, { encoding: FileSystem.EncodingType.Base64 });
  const zip = await JSZip.loadAsync(zipBase64, { base64: true });

  await ensureDirectoryAsync(SQLITE_DIRECTORY);
  await ensureDirectoryAsync(CHECKLIST_PHOTOS_DIRECTORY);

  let restoredDatabase = false;
  let restoredPhotosCount = 0;

  for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
      continue;
    }

    if (zipPath.toLowerCase() === `database/${CHECKLIST_DATABASE_FILE_NAME}`.toLowerCase()) {
      const databaseBase64 = await zipEntry.async("base64");
      const databaseOutputPath = `${SQLITE_DIRECTORY}/${CHECKLIST_DATABASE_FILE_NAME}`;
      await resetDatabaseConnectionAsync();
      await FileSystem.writeAsStringAsync(databaseOutputPath, databaseBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      restoredDatabase = true;
      continue;
    }

    if (zipPath.toLowerCase().startsWith("photos/")) {
      const photoBase64 = await zipEntry.async("base64");
      const fileName = zipPath.split("/").pop() ?? `photo_${Date.now()}.jpg`;
      const photoOutputPath = `${CHECKLIST_PHOTOS_DIRECTORY}/${fileName}`;
      await FileSystem.writeAsStringAsync(photoOutputPath, photoBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      restoredPhotosCount += 1;
    }
  }

  await initializeDatabaseAsync();
  return { restoredDatabase, restoredPhotosCount };
};

