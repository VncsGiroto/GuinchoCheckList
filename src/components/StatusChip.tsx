import { StyleSheet, Text, View } from "react-native";
import { APP_COLORS } from "../theme/colors";

interface StatusChipProps {
  label: string;
  variant?: "default" | "success" | "danger";
}

export const StatusChip = ({ label, variant = "default" }: StatusChipProps) => {
  return (
    <View
      style={[
        styles.chip,
        variant === "success" ? styles.success : undefined,
        variant === "danger" ? styles.danger : undefined,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: "#EBEBEB",
    alignSelf: "flex-start",
  },
  success: {
    backgroundColor: APP_COLORS.successSoft,
  },
  danger: {
    backgroundColor: "#FCEBEA",
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: APP_COLORS.text,
  },
});
