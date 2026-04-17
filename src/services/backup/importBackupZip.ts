import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import JSZip from "jszip";
import { CHECKLIST_DATABASE_FILE_NAME, CHECKLIST_PHOTOS_DIRECTORY_NAME } from "../../constants/storage";
import { initializeDatabaseAsync } from "../../database/client";
import { checklistRepository } from "../../database/repositories/checklistRepository";
import { settingsRepository } from "../../database/repositories/settingsRepository";
import { parseBackupChecklists, parseBackupProviderSettings } from "./backupPayload";

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

  await ensureDirectoryAsync(CHECKLIST_PHOTOS_DIRECTORY);

  let restoredDatabase = false;
  let restoredPhotosCount = 0;

  const checklistsEntry = zip.file("checklists.json");
  const providerSettingsEntry = zip.file("provider-settings.json");

  await initializeDatabaseAsync();

  if (providerSettingsEntry) {
    const jsonText = await providerSettingsEntry.async("text");
    const settings = parseBackupProviderSettings(jsonText);
    await settingsRepository.replaceProviderSettings(settings);
  }

  if (checklistsEntry) {
    const jsonText = await checklistsEntry.async("text");
    const records = parseBackupChecklists(jsonText);
    await checklistRepository.replaceAll(records);
    restoredDatabase = true;
  } else if (zip.file(`database/${CHECKLIST_DATABASE_FILE_NAME}`)) {
    throw new Error(
      "Backup legado detectado (somente .db). Exporte um novo backup nesta versao para restauracao segura.",
    );
  }

  for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) {
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

  if (!restoredDatabase && restoredPhotosCount === 0) {
    throw new Error("Backup invalido: nenhum dado de checklist ou foto foi encontrado.");
  }

  return { restoredDatabase, restoredPhotosCount };
};
