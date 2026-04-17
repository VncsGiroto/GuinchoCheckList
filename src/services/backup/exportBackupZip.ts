import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import type { ChecklistRecord } from "../../types/checklist";
import { CHECKLIST_DATABASE_FILE_NAME } from "../../constants/storage";
import { getDatabaseFilesAsync } from "../../database/client";

export const exportBackupZipAsync = async (checklists: ChecklistRecord[]): Promise<string> => {
  const zip = new JSZip();
  const dbFiles = await getDatabaseFilesAsync();

  const dbFileEntries: Array<{ path: string; zipName: string }> = [
    { path: dbFiles.main, zipName: CHECKLIST_DATABASE_FILE_NAME },
    { path: dbFiles.wal, zipName: `${CHECKLIST_DATABASE_FILE_NAME}-wal` },
    { path: dbFiles.shm, zipName: `${CHECKLIST_DATABASE_FILE_NAME}-shm` },
  ];

  for (const fileEntry of dbFileEntries) {
    const info = await FileSystem.getInfoAsync(fileEntry.path);
    if (!info.exists) {
      continue;
    }

    const base64 = await FileSystem.readAsStringAsync(fileEntry.path, { encoding: FileSystem.EncodingType.Base64 });
    zip.file(`database/${fileEntry.zipName}`, base64, { base64: true });
  }

  const uniquePhotoPaths = new Set<string>();
  checklists.forEach((checklist) => {
    checklist.photoPaths.forEach((photoPath) => uniquePhotoPaths.add(photoPath));
  });

  for (const photoPath of uniquePhotoPaths) {
    const photoInfo = await FileSystem.getInfoAsync(photoPath);
    if (!photoInfo.exists) {
      continue;
    }

    const photoBase64 = await FileSystem.readAsStringAsync(photoPath, { encoding: FileSystem.EncodingType.Base64 });
    const fileName = photoPath.split("/").pop() ?? `photo_${Date.now()}.jpg`;
    zip.file(`photos/${fileName}`, photoBase64, { base64: true });
  }

  zip.file(
    "manifest.json",
    JSON.stringify(
      {
        exportedAtIso: new Date().toISOString(),
        checklistCount: checklists.length,
        formatVersion: 2,
      },
      null,
      2,
    ),
  );
  zip.file("checklists.json", JSON.stringify(checklists, null, 2));

  const zipBase64 = await zip.generateAsync({ type: "base64" });
  const outputPath = `${FileSystem.documentDirectory}girofrancis_backup_${Date.now()}.zip`;
  await FileSystem.writeAsStringAsync(outputPath, zipBase64, { encoding: FileSystem.EncodingType.Base64 });
  return outputPath;
};

export const exportAndShareBackupZipAsync = async (checklists: ChecklistRecord[]): Promise<void> => {
  const backupPath = await exportBackupZipAsync(checklists);
  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(backupPath);
  }
};
