import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
// @ts-ignore - expo-asset is available transitively via expo
import { Asset } from "expo-asset";
import type { ChecklistRecord } from "../../types/checklist";
import { buildChecklistHtml } from "./buildChecklistHtml";
import { settingsRepository } from "../../database/repositories/settingsRepository";

const slugifyCustomerName = (customerName: string): string => {
  return customerName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "")
    .toUpperCase();
};

const buildPdfName = (checklist: ChecklistRecord): string => {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}_${slugifyCustomerName(checklist.customer.name)}.pdf`;
};

const getLogoDataUriAsync = async (): Promise<string | null> => {
  try {
    const asset = Asset.fromModule(require("../../assets/img/logo.png"));
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/png;base64,${base64}`;
  } catch {
    return null;
  }
};

export const generateChecklistPdfAsync = async (checklist: ChecklistRecord): Promise<string> => {
  const photoSrcMap: Record<string, string> = {};
  const providerSettings = await settingsRepository.getProviderSettings();
  const logoDataUri = await getLogoDataUriAsync();

  for (const photoPath of checklist.photoPaths) {
    try {
      const fileInfo = await FileSystem.getInfoAsync(photoPath);
      if (!fileInfo.exists) {
        continue;
      }

      const base64 = await FileSystem.readAsStringAsync(photoPath, {
        encoding: FileSystem.EncodingType.Base64,
      });
      photoSrcMap[photoPath] = `data:image/jpeg;base64,${base64}`;
    } catch {
      // Skip a single broken image but keep PDF generation available.
    }
  }

  const html = buildChecklistHtml(checklist, photoSrcMap, logoDataUri, providerSettings);
  const fileName = buildPdfName(checklist);
  const outputPath = `${FileSystem.documentDirectory}${fileName}`;

  try {
    const result = await Print.printToFileAsync({
      html,
      base64: false,
    });

    await FileSystem.copyAsync({ from: result.uri, to: outputPath });
    return outputPath;
  } catch (error) {
    throw new Error(`Failed to generate checklist PDF: ${(error as Error).message}`);
  }
};
