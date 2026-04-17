import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { LabeledTextInput } from "../components/LabeledTextInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { APP_COLORS } from "../theme/colors";
import { useState } from "react";
import type { CreateChecklistInput } from "../types/checklist";

interface ChecklistCreateScreenProps {
  onBack: () => void;
  onSave: (payload: CreateChecklistInput) => Promise<void>;
}

export const ChecklistCreateScreen = ({ onBack, onSave }: ChecklistCreateScreenProps) => {
  const [customerName, setCustomerName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [phone, setPhone] = useState("");
  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAsync = async () => {
    if (!customerName.trim() || !brand.trim() || !model.trim() || !color.trim()) {
      Alert.alert("Campos obrigatorios", "Preencha cliente, marca, modelo e cor.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        customer: {
          name: customerName.trim(),
          documentId: documentId.trim() || null,
          phone: phone.trim() || null,
        },
        vehicle: {
          plate: plate.trim().toUpperCase(),
          brand: brand.trim(),
          model: model.trim(),
          color: color.trim(),
          year: year.trim(),
          notes: notes.trim() || null,
        },
      });
    } catch (error) {
      Alert.alert("Erro", (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Novo Checklist</Text>
      <Text style={styles.subtitle}>Cadastre os dados iniciais da coleta.</Text>

      <View style={styles.card}>
        <LabeledTextInput label="Nome do cliente*" onChangeText={setCustomerName} value={customerName} />
        <LabeledTextInput label="Documento" onChangeText={setDocumentId} value={documentId} />
        <LabeledTextInput label="Telefone" onChangeText={setPhone} value={phone} />
      </View>

      <View style={styles.card}>
        <LabeledTextInput label="Placa" onChangeText={setPlate} value={plate} />
        <LabeledTextInput label="Marca*" onChangeText={setBrand} value={brand} />
        <LabeledTextInput label="Modelo*" onChangeText={setModel} value={model} />
        <LabeledTextInput label="Cor*" onChangeText={setColor} value={color} />
        <LabeledTextInput label="Ano" onChangeText={setYear} value={year} />
        <LabeledTextInput label="Observacoes" multiline onChangeText={setNotes} value={notes} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton label="Voltar" onPress={onBack} />
        <PrimaryButton disabled={isSaving} label={isSaving ? "Salvando..." : "Criar Checklist"} onPress={handleSaveAsync} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 34,
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
  card: {
    backgroundColor: APP_COLORS.card,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  actions: {
    gap: 10,
  },
});
