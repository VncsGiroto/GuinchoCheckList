import { getDatabaseAsync } from "../client";
import { APP_SETTINGS_TABLE_NAME } from "../schema";
import type { ProviderSettings, UpdateProviderSettingsInput } from "../../types/settings";

interface ProviderSettingsRow {
  provider_name: string;
  provider_document_id: string | null;
  provider_phone: string | null;
  provider_email: string | null;
  provider_address: string | null;
  updated_at: string;
}

const toSettings = (row: ProviderSettingsRow): ProviderSettings => ({
  providerName: row.provider_name,
  providerDocumentId: row.provider_document_id,
  providerPhone: row.provider_phone,
  providerEmail: row.provider_email,
  providerAddress: row.provider_address,
  updatedAtIso: row.updated_at,
});

const normalizeOptional = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const settingsRepository = {
  async getProviderSettings(): Promise<ProviderSettings> {
    const database = await getDatabaseAsync();
    const row = await database.getFirstAsync<ProviderSettingsRow>(
      `SELECT provider_name, provider_document_id, provider_phone, provider_email, provider_address, updated_at
       FROM ${APP_SETTINGS_TABLE_NAME}
       WHERE id = 'default'
       LIMIT 1`,
    );

    if (!row) {
      throw new Error("Configuracoes da empresa nao encontradas.");
    }

    return toSettings(row);
  },

  async updateProviderSettings(input: UpdateProviderSettingsInput): Promise<void> {
    const providerName = input.providerName.trim();
    if (!providerName) {
      throw new Error("Nome da empresa e obrigatorio.");
    }

    const database = await getDatabaseAsync();
    await database.runAsync(
      `UPDATE ${APP_SETTINGS_TABLE_NAME}
       SET provider_name = ?, provider_document_id = ?, provider_phone = ?, provider_email = ?, provider_address = ?, updated_at = ?
       WHERE id = 'default'`,
      [
        providerName,
        normalizeOptional(input.providerDocumentId ?? ""),
        normalizeOptional(input.providerPhone ?? ""),
        normalizeOptional(input.providerEmail ?? ""),
        normalizeOptional(input.providerAddress ?? ""),
        new Date().toISOString(),
      ],
    );
  },

  async replaceProviderSettings(input: UpdateProviderSettingsInput): Promise<void> {
    const providerName = input.providerName.trim();
    if (!providerName) {
      throw new Error("Nome da empresa e obrigatorio.");
    }

    const database = await getDatabaseAsync();
    await database.runAsync(
      `INSERT INTO ${APP_SETTINGS_TABLE_NAME} (
         id,
         provider_name,
         provider_document_id,
         provider_phone,
         provider_email,
         provider_address,
         updated_at
       ) VALUES ('default', ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         provider_name = excluded.provider_name,
         provider_document_id = excluded.provider_document_id,
         provider_phone = excluded.provider_phone,
         provider_email = excluded.provider_email,
         provider_address = excluded.provider_address,
         updated_at = excluded.updated_at`,
      [
        providerName,
        normalizeOptional(input.providerDocumentId ?? ""),
        normalizeOptional(input.providerPhone ?? ""),
        normalizeOptional(input.providerEmail ?? ""),
        normalizeOptional(input.providerAddress ?? ""),
        new Date().toISOString(),
      ],
    );
  },
};
