import { StyleSheet, Text, TextInput, View } from "react-native";
import { APP_COLORS } from "../theme/colors";

interface LabeledTextInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  editable?: boolean;
}

export const LabeledTextInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  editable = true,
}: LabeledTextInputProps) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        editable={editable}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8A8A8A"
        style={[
          styles.input,
          multiline ? styles.multiline : undefined,
          !editable ? styles.readOnly : undefined,
        ]}
        value={value}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: APP_COLORS.text,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    borderRadius: 12,
    backgroundColor: APP_COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: APP_COLORS.text,
    fontSize: 15,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  readOnly: {
    backgroundColor: "#EFEFEF",
  },
});
