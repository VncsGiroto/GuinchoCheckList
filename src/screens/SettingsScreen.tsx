import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useCallback, useEffect, useState } from "react";
import { APP_COLORS } from "../theme/colors";
import { LabeledTextInput } from "../components/LabeledTextInput";
import { PrimaryButton } from "../components/PrimaryButton";
import { settingsRepository } from "../database/repositories/settingsRepository";

interface SettingsScreenProps {
  onBack: () => void;
}

export const SettingsScreen = ({ onBack }: SettingsScreenProps) => {
  const [providerName, setProviderName] = useState("");
  const [providerDocumentId, setProviderDocumentId] = useState("");
  const [providerPhone, setProviderPhone] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [providerAddress, setProviderAddress] = useState("");
  const [updatedAtLabel, setUpdatedAtLabel] = useState("-");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettingsAsync = useCallback(async () => {
    setIsLoading(true);
    try {
      const settings = await settingsRepository.getProviderSettings();
      setProviderName(settings.providerName);
      setProviderDocumentId(settings.providerDocumentId ?? "");
      setProviderPhone(settings.providerPhone ?? "");
      setProviderEmail(settings.providerEmail ?? "");
      setProviderAddress(settings.providerAddress ?? "");
      setUpdatedAtLabel(new Date(settings.updatedAtIso).toLocaleString("pt-BR"));
    } catch (error) {
      Alert.alert("Erro nas configuracoes", (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettingsAsync();
  }, [loadSettingsAsync]);

  const handleSaveAsync = async () => {
    setIsSaving(true);
    try {
      await settingsRepository.updateProviderSettings({
        providerName,
        providerDocumentId,
        providerPhone,
        providerEmail,
        providerAddress,
      });
      await loadSettingsAsync();
      Alert.alert("Configuracoes salvas", "Os dados da prestadora foram atualizados para o PDF.");
    } catch (error) {
      Alert.alert("Erro ao salvar", (error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PrimaryButton label="Voltar para inicio" onPress={onBack} />
      <View style={styles.card}>
        <Text style={styles.title}>Configuracoes da Prestadora</Text>
        <Text style={styles.subtitle}>Esses dados aparecem no cabecalho do PDF.</Text>
        <Text style={styles.meta}>Ultima atualizacao: {updatedAtLabel}</Text>
        <LabeledTextInput
          editable={!isLoading && !isSaving}
          label="Nome da empresa"
          onChangeText={setProviderName}
          placeholder="Ex.: Girofrancis Guinchos"
          value={providerName}
        />
        <LabeledTextInput
          editable={!isLoading && !isSaving}
          label="Documento (CNPJ/CPF)"
          onChangeText={setProviderDocumentId}
          placeholder="Opcional"
          value={providerDocumentId}
        />
        <LabeledTextInput
          editable={!isLoading && !isSaving}
          label="Telefone"
          onChangeText={setProviderPhone}
          placeholder="Opcional"
          value={providerPhone}
        />
        <LabeledTextInput
          editable={!isLoading && !isSaving}
          label="Email"
          onChangeText={setProviderEmail}
          placeholder="Opcional"
          value={providerEmail}
        />
        <LabeledTextInput
          editable={!isLoading && !isSaving}
          label="Endereco"
          onChangeText={setProviderAddress}
          placeholder="Opcional"
          value={providerAddress}
        />
        <PrimaryButton
          disabled={isLoading || isSaving}
          label={isSaving ? "Salvando..." : "Salvar configuracoes"}
          onPress={() => void handleSaveAsync()}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    paddingBottom: 28,
  },
  card: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: APP_COLORS.neutralBorder,
    padding: 12,
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: APP_COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: APP_COLORS.text,
    opacity: 0.85,
  },
  meta: {
    fontSize: 12,
    color: APP_COLORS.text,
    opacity: 0.7,
  },
});
