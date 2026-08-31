import type { SQLiteDatabase } from "expo-sqlite";

export const CHECKLIST_TABLE_NAME = "checklists";
export const APP_SETTINGS_TABLE_NAME = "app_settings";

export const createChecklistTableSql = `
CREATE TABLE IF NOT EXISTS ${CHECKLIST_TABLE_NAME} (
  id TEXT PRIMARY KEY NOT NULL,
  customer_name TEXT NOT NULL,
  customer_document_id TEXT,
  customer_phone TEXT,
  vehicle_plate TEXT NOT NULL,
  vehicle_brand TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  vehicle_color TEXT NOT NULL,
  vehicle_year TEXT NOT NULL,
  vehicle_notes TEXT,
  pickup_signature TEXT,
  delivery_signature TEXT,
  pickup_lat_long TEXT,
  delivery_lat_long TEXT,
  pickup_timestamp TEXT,
  delivery_timestamp TEXT,
  pickup_receiver_name TEXT,
  pickup_receiver_document_id TEXT,
  delivery_receiver_name TEXT,
  delivery_receiver_document_id TEXT,
  photos TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const createAppSettingsTableSql = `
CREATE TABLE IF NOT EXISTS ${APP_SETTINGS_TABLE_NAME} (
  id TEXT PRIMARY KEY NOT NULL,
  provider_name TEXT NOT NULL,
  provider_document_id TEXT,
  provider_phone TEXT,
  provider_email TEXT,
  provider_address TEXT,
  updated_at TEXT NOT NULL
);
`;

export const seedAppSettingsSql = `
INSERT OR IGNORE INTO ${APP_SETTINGS_TABLE_NAME} (
  id,
  provider_name,
  provider_document_id,
  provider_phone,
  provider_email,
  provider_address,
  updated_at
) VALUES (
  'default',
  'Girofrancis Guinchos',
  NULL,
  NULL,
  NULL,
  NULL,
  CURRENT_TIMESTAMP
);
`;

export const runMigrationsAsync = async (database: SQLiteDatabase): Promise<void> => {
  await database.execAsync(createChecklistTableSql);
  await database.execAsync(createAppSettingsTableSql);
  await database.execAsync(seedAppSettingsSql);
  const addColumns = [
    "ALTER TABLE checklists ADD COLUMN pickup_receiver_name TEXT",
    "ALTER TABLE checklists ADD COLUMN pickup_receiver_document_id TEXT",
    "ALTER TABLE checklists ADD COLUMN delivery_receiver_name TEXT",
    "ALTER TABLE checklists ADD COLUMN delivery_receiver_document_id TEXT",
  ];
  for (const sql of addColumns) {
    try {
      await database.execAsync(sql);
    } catch {}
  }
};
