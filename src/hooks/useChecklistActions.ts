import { useState } from "react";
import { Alert } from "react-native";
import * as Sharing from "expo-sharing";
import { generateChecklistPdfAsync } from "../services/pdf/generateChecklistPdf";
import type { ChecklistRecord } from "../types/checklist";

export const useChecklistActions = (checklist: ChecklistRecord, onDeleteChecklist: () => Promise<void>) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDeletingChecklist, setIsDeletingChecklist] = useState(false);

  const handleGeneratePdfAsync = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfPath = await generateChecklistPdfAsync(checklist);
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        await Sharing.shareAsync(pdfPath);
      } else {
        Alert.alert("PDF gerado", `Arquivo salvo em: ${pdfPath}`);
      }
    } catch (error) {
      Alert.alert("Erro ao gerar PDF", (error as Error).message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDeleteChecklistAsync = async () => {
    setIsDeletingChecklist(true);
    try {
      await onDeleteChecklist();
    } catch (error) {
      Alert.alert("Erro ao excluir", (error as Error).message);
    } finally {
      setIsDeletingChecklist(false);
    }
  };

  const handleDeletePress = () => {
    Alert.alert("Excluir checklist", "Essa acao remove o checklist e as fotos associadas. Deseja continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Excluir", style: "destructive", onPress: () => void handleDeleteChecklistAsync() },
    ]);
  };

  return { isGeneratingPdf, isDeletingChecklist, handleGeneratePdfAsync, handleDeletePress };
};
