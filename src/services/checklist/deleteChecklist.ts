import * as FileSystem from "expo-file-system/legacy";
import { checklistRepository } from "../../database/repositories/checklistRepository";

export const deleteChecklistAsync = async (checklistId: string): Promise<void> => {
  const checklist = await checklistRepository.findById(checklistId);

  if (!checklist) {
    throw new Error("Checklist nao encontrado.");
  }

  const uniquePaths = [...new Set(checklist.photoPaths)];
  for (const photoPath of uniquePaths) {
    try {
      const info = await FileSystem.getInfoAsync(photoPath);
      if (info.exists) {
        await FileSystem.deleteAsync(photoPath, { idempotent: true });
      }
    } catch {
      // Keep deletion resilient: checklist removal should proceed even if one photo fails.
    }
  }

  await checklistRepository.deleteById(checklistId);
};

