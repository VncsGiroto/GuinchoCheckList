export interface ProviderSettings {
  providerName: string;
  providerDocumentId: string | null;
  providerPhone: string | null;
  providerEmail: string | null;
  providerAddress: string | null;
  updatedAtIso: string;
}

export interface UpdateProviderSettingsInput {
  providerName: string;
  providerDocumentId: string | null;
  providerPhone: string | null;
  providerEmail: string | null;
  providerAddress: string | null;
}
