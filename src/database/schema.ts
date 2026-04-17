import type { SQLiteDatabase } from "expo-sqlite";

export const CHECKLIST_TABLE_NAME = "checklists";

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
  photos TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'rascunho',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const runMigrationsAsync = async (database: SQLiteDatabase): Promise<void> => {
  await database.execAsync(createChecklistTableSql);
};

