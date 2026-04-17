import { Alert, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { StatusChip } from "../components/StatusChip";
import { APP_COLORS } from "../theme/colors";

export const HomeScreen = () => {
  const handleNewChecklistPress = () => {
    Alert.alert("Em breve", "Fluxo de criacao sera implementado na proxima etapa.");
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Girofrancis Checklist</Text>
        <Text style={styles.subtitle}>Auditoria de coleta e entrega com validade juridica.</Text>
        <View style={styles.statusRow}>
          <StatusChip label="Offline Ready" variant="success" />
          <StatusChip label="PDF Profissional" />
        </View>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.sectionTitle}>Comecar</Text>
        <Text style={styles.sectionDescription}>
          Registre a vistoria inicial, capture fotos e assine apenas quando necessario.
        </Text>
        <PrimaryButton label="Novo Checklist" onPress={handleNewChecklistPress} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
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
    opacity: 0.82,
  },
  statusRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mainCard: {
    flex: 1,
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  sectionDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: APP_COLORS.text,
    opacity: 0.82,
  },
});

