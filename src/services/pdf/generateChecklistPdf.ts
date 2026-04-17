import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "react-native";
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

const logoSource = Image.resolveAssetSource(require("../../assets/img/logo.png"));

export const generateChecklistPdfAsync = async (checklist: ChecklistRecord): Promise<string> => {
  const photoSrcMap: Record<string, string> = {};
  const providerSettings = await settingsRepository.getProviderSettings();

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

  const html = buildChecklistHtml(checklist, photoSrcMap, logoSource?.uri ?? null, providerSettings);
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
