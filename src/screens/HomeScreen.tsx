import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import type { ChecklistRecord } from "../types/checklist";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusChip } from "../components/StatusChip";
import { APP_COLORS } from "../theme/colors";

interface HomeScreenProps {
  checklists: ChecklistRecord[];
  onCreatePress: () => void;
  onExportBackupPress: () => void;
  onOpenChecklist: (checklistId: string) => void;
}

const translateStatus = (status: ChecklistRecord["status"]): string => {
  if (status === "rascunho") return "Rascunho";
  if (status === "em_transito") return "Em transito";
  return "Concluido";
};

export const HomeScreen = ({ checklists, onCreatePress, onExportBackupPress, onOpenChecklist }: HomeScreenProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Girofrancis Checklist</Text>
        <Text style={styles.subtitle}>Checklist de coleta e entrega com rastreabilidade offline.</Text>
        <View style={styles.statusRow}>
          <StatusChip label="Offline Ready" variant="success" />
          <StatusChip label="PDF Juridico" />
        </View>
      </View>

      <PrimaryButton label="Novo Checklist" onPress={onCreatePress} />
      <PrimaryButton label="Exportar Backup (.zip)" onPress={onExportBackupPress} />

      <Text style={styles.listTitle}>Checklists</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={checklists}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum checklist criado ainda.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => onOpenChecklist(item.id)} style={styles.item}>
            <View style={styles.itemTopRow}>
              <Text style={styles.itemTitle}>{item.customer.name}</Text>
              <StatusChip
                label={translateStatus(item.status)}
                variant={item.status === "concluido" ? "success" : "default"}
              />
            </View>
            <Text style={styles.itemSubtitle}>
              {item.vehicle.plate} • {item.vehicle.brand} {item.vehicle.model}
            </Text>
            <Text style={styles.itemDate}>{new Date(item.createdAtIso).toLocaleString("pt-BR")}</Text>
          </Pressable>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  headerCard: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: APP_COLORS.text,
    opacity: 0.8,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: APP_COLORS.text,
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 36,
    gap: 10,
  },
  item: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    padding: 14,
    gap: 6,
  },
  itemTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: APP_COLORS.text,
    flex: 1,
  },
  itemSubtitle: {
    fontSize: 14,
    color: APP_COLORS.text,
    opacity: 0.85,
  },
  itemDate: {
    fontSize: 12,
    color: APP_COLORS.text,
    opacity: 0.65,
  },
  empty: {
    paddingVertical: 16,
    color: APP_COLORS.text,
    opacity: 0.7,
  },
});
