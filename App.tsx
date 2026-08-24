import { StatusBar } from "expo-status-bar";
import { Alert, StyleSheet } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { initializeDatabaseAsync } from "./src/database/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { APP_COLORS } from "./src/theme/colors";
import { checklistRepository } from "./src/database/repositories/checklistRepository";
import type { ChecklistRecord, CreateChecklistInput, GeoPoint } from "./src/types/checklist";
import { ChecklistCreateScreen } from "./src/screens/ChecklistCreateScreen";
import { ChecklistDetailsScreen } from "./src/screens/ChecklistDetailsScreen";
import { exportAndShareBackupZipAsync } from "./src/services/backup/exportBackupZip";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { importBackupZipAsync } from "./src/services/backup/importBackupZip";
import { deleteChecklistAsync } from "./src/services/checklist/deleteChecklist";
import { SettingsScreen } from "./src/screens/SettingsScreen";

type AppView = "home" | "create" | "details" | "settings";

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>("home");
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [selectedChecklistId, setSelectedChecklistId] = useState<string | null>(null);

  const loadChecklistsAsync = useCallback(async () => {
    const list = await checklistRepository.list();
    setChecklists(list);
  }, []);

  useEffect(() => {
    const bootstrapAsync = async () => {
      await initializeDatabaseAsync();
      await loadChecklistsAsync();
    };

    void bootstrapAsync();
  }, [loadChecklistsAsync]);

  const selectedChecklist = useMemo(() => {
    if (!selectedChecklistId) {
      return null;
    }

    return checklists.find((item) => item.id === selectedChecklistId) ?? null;
  }, [checklists, selectedChecklistId]);

  const handleCreateChecklistAsync = useCallback(
    async (payload: CreateChecklistInput) => {
      const created = await checklistRepository.create(payload);
      await loadChecklistsAsync();
      setSelectedChecklistId(created.id);
      setCurrentView("details");
    },
    [loadChecklistsAsync],
  );

  const handleSavePickupAsync = useCallback(
    async (
      signatureBase64: string | null,
      coordinates: GeoPoint | null,
      timestampIso: string,
      photoPaths: string[],
      receiverName: string | null,
      receiverDocumentId: string | null,
    ) => {
      if (!selectedChecklistId) {
        return;
      }

      await checklistRepository.savePickup({
        checklistId: selectedChecklistId,
        signatureBase64,
        coordinates,
        timestampIso,
        photoPaths,
        receiverName,
        receiverDocumentId,
      });

      await loadChecklistsAsync();
    },
    [loadChecklistsAsync, selectedChecklistId],
  );

  const handleSaveDeliveryAsync = useCallback(
    async (
      signatureBase64: string | null,
      coordinates: GeoPoint | null,
      timestampIso: string,
      photoPaths: string[],
      receiverName: string | null,
      receiverDocumentId: string | null,
    ) => {
      if (!selectedChecklistId) {
        return;
      }

      await checklistRepository.saveDelivery({
        checklistId: selectedChecklistId,
        signatureBase64,
        coordinates,
        timestampIso,
        photoPaths,
        receiverName,
        receiverDocumentId,
      });

      await loadChecklistsAsync();
    },
    [loadChecklistsAsync, selectedChecklistId],
  );

  const handleExportBackupAsync = useCallback(async () => {
    try {
      await exportAndShareBackupZipAsync(checklists);
      Alert.alert("Backup", "Backup exportado com sucesso.");
    } catch (error) {
      Alert.alert("Erro no backup", (error as Error).message);
    }
  }, [checklists]);

  const handleImportBackupAsync = useCallback(async () => {
    try {
      const result = await importBackupZipAsync();
      setSelectedChecklistId(null);
      setCurrentView("home");
      await loadChecklistsAsync();
      Alert.alert(
        "Backup importado",
        `Banco: ${result.restoredDatabase ? "restaurado" : "nao encontrado"}\nFotos restauradas: ${result.restoredPhotosCount}`,
      );
    } catch (error) {
      Alert.alert("Erro ao importar backup", (error as Error).message);
    }
  }, [loadChecklistsAsync]);

  const handleDeleteChecklistAsync = useCallback(async () => {
    if (!selectedChecklistId) {
      throw new Error("Checklist invalido.");
    }

    await deleteChecklistAsync(selectedChecklistId);
    setSelectedChecklistId(null);
    setCurrentView("home");
    await loadChecklistsAsync();
    Alert.alert("Checklist excluido", "O checklist e as fotos associadas foram removidos.");
  }, [loadChecklistsAsync, selectedChecklistId]);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "left"]} style={styles.container}>
        <StatusBar style="dark" />
        {currentView === "home" ? (
          <HomeScreen
            checklists={checklists}
            onCreatePress={() => setCurrentView("create")}
            onSettingsPress={() => setCurrentView("settings")}
            onExportBackupPress={() => void handleExportBackupAsync()}
            onImportBackupPress={() => void handleImportBackupAsync()}
            onOpenChecklist={(checklistId) => {
              setSelectedChecklistId(checklistId);
              setCurrentView("details");
            }}
          />
        ) : null}

        {currentView === "create" ? (
          <ChecklistCreateScreen onBack={() => setCurrentView("home")} onSave={handleCreateChecklistAsync} />
        ) : null}

        {currentView === "details" && selectedChecklist ? (
          <ChecklistDetailsScreen
            checklist={selectedChecklist}
            onBack={() => setCurrentView("home")}
            onDeleteChecklist={handleDeleteChecklistAsync}
            onDeliverySave={handleSaveDeliveryAsync}
            onPickupSave={handleSavePickupAsync}
          />
        ) : null}

        {currentView === "settings" ? <SettingsScreen onBack={() => setCurrentView("home")} /> : null}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
});
