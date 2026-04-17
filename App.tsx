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

type AppView = "home" | "create" | "details";

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
      await loadChecklistsAsync();
      setCurrentView("home");
      Alert.alert(
        "Backup importado",
        `Banco: ${result.restoredDatabase ? "restaurado" : "nao encontrado"}\nFotos restauradas: ${result.restoredPhotosCount}`,
      );
    } catch (error) {
      Alert.alert("Erro ao importar backup", (error as Error).message);
    }
  }, [loadChecklistsAsync]);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={["top", "right", "left"]} style={styles.container}>
        <StatusBar style="dark" />
        {currentView === "home" ? (
          <HomeScreen
            checklists={checklists}
            onCreatePress={() => setCurrentView("create")}
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
            onDeliverySave={handleSaveDeliveryAsync}
            onPickupSave={handleSavePickupAsync}
          />
        ) : null}
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
