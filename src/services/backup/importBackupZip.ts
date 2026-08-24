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

const remapPhotoPath = (oldPath: string): string => {
  const fileName = oldPath.split("/").pop()?.trim() ?? "";
  if (!fileName) return oldPath;
  return `${CHECKLIST_PHOTOS_DIRECTORY}/${fileName}`;
};

const cleanPhotosDirectoryAsync = async (): Promise<void> => {
  await ensureDirectoryAsync(CHECKLIST_PHOTOS_DIRECTORY);
  const entries = await FileSystem.readDirectoryAsync(CHECKLIST_PHOTOS_DIRECTORY);
  for (const entry of entries) {
    await FileSystem.deleteAsync(`${CHECKLIST_PHOTOS_DIRECTORY}/${entry}`, { idempotent: true });
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

  const checklistsEntry = zip.file("checklists.json");
  const providerSettingsEntry = zip.file("provider-settings.json");

  const zipPhotoNames = new Set<string>();
  for (const zipPath of Object.keys(zip.files)) {
    if (zip.files[zipPath].dir) continue;
    if (zipPath.toLowerCase().startsWith("photos/")) {
      const fileName = zipPath.split("/").pop()?.trim() ?? "";
      if (fileName) zipPhotoNames.add(fileName);
    }
  }

  let parsedRecords: Awaited<ReturnType<typeof parseBackupChecklists>> | null = null;
  let parsedSettings: Awaited<ReturnType<typeof parseBackupProviderSettings>> | null = null;

  if (providerSettingsEntry) {
    const jsonText = await providerSettingsEntry.async("text");
    parsedSettings = parseBackupProviderSettings(jsonText);
  }

  if (checklistsEntry) {
    const jsonText = await checklistsEntry.async("text");
    parsedRecords = parseBackupChecklists(jsonText);
    const expectedNames = new Set<string>();
    for (const record of parsedRecords) {
      for (const photoPath of record.photoPaths) {
        const fileName = photoPath.split("/").pop()?.trim() ?? "";
        if (fileName) expectedNames.add(fileName);
      }
    }
    const missing = [...expectedNames].filter((name) => !zipPhotoNames.has(name));
    if (missing.length > 0) {
      throw new Error(`Backup inconsistente: ${missing.length} foto(s) referenciada(s) em checklists.json nao encontrada(s) em photos/ — ${missing.join(", ")}`);
    }
  } else if (zip.file(`database/${CHECKLIST_DATABASE_FILE_NAME}`)) {
    throw new Error("Backup legado detectado (somente .db). Exporte um novo backup nesta versao para restauracao segura.");
  }

  await initializeDatabaseAsync();

  if (parsedRecords) {
    const remapped = parsedRecords.map((record) => ({
      ...record,
      photoPaths: record.photoPaths.map(remapPhotoPath),
    }));
    const hasPhotosToRestore = zipPhotoNames.size > 0 || remapped.some((r) => r.photoPaths.length > 0);
    if (hasPhotosToRestore) {
      await cleanPhotosDirectoryAsync();
    }
    let restoredPhotosCount = 0;
    for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      if (zipPath.toLowerCase().startsWith("photos/")) {
        const photoBase64 = await zipEntry.async("base64");
        if (!photoBase64) continue;
        const fileName = zipPath.split("/").pop() ?? `photo_${Date.now()}.jpg`;
        const photoOutputPath = `${CHECKLIST_PHOTOS_DIRECTORY}/${fileName}`;
        await FileSystem.writeAsStringAsync(photoOutputPath, photoBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        restoredPhotosCount += 1;
      }
    }
    if (parsedSettings) {
      await settingsRepository.replaceProviderSettings(parsedSettings);
    }
    await checklistRepository.replaceAll(remapped);
    if (!remapped.length && restoredPhotosCount === 0 && !parsedSettings) {
      throw new Error("Backup invalido: nenhum dado de checklist ou foto foi encontrado.");
    }
    return { restoredDatabase: true, restoredPhotosCount };
  }

  await ensureDirectoryAsync(CHECKLIST_PHOTOS_DIRECTORY);
  let restoredPhotosCount = 0;
  for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    if (zipPath.toLowerCase().startsWith("photos/")) {
      const photoBase64 = await zipEntry.async("base64");
      if (!photoBase64) continue;
      const fileName = zipPath.split("/").pop() ?? `photo_${Date.now()}.jpg`;
      const photoOutputPath = `${CHECKLIST_PHOTOS_DIRECTORY}/${fileName}`;
      await FileSystem.writeAsStringAsync(photoOutputPath, photoBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      restoredPhotosCount += 1;
    }
  }

  if (parsedSettings) {
    await settingsRepository.replaceProviderSettings(parsedSettings);
  }

  if (restoredPhotosCount === 0 && !parsedSettings) {
    throw new Error("Backup invalido: nenhum dado de checklist ou foto foi encontrado.");
  }

  return { restoredDatabase: false, restoredPhotosCount };
};
