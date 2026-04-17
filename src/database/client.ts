import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrationsAsync } from "./schema";

const DATABASE_NAME = "girofrancis.db";

let databasePromise: Promise<SQLiteDatabase> | null = null;

export const getDatabaseAsync = async (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME);
  }

  return databasePromise;
};

export const initializeDatabaseAsync = async (): Promise<void> => {
  const database = await getDatabaseAsync();

  await database.execAsync("PRAGMA journal_mode = WAL;");
  await database.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrationsAsync(database);
};

