import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrationsAsync } from "./schema";
import { CHECKLIST_DATABASE_FILE_NAME } from "../constants/storage";

let databasePromise: Promise<SQLiteDatabase> | null = null;

export const getDatabaseAsync = async (): Promise<SQLiteDatabase> => {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(CHECKLIST_DATABASE_FILE_NAME);
  }

  return databasePromise;
};

export const initializeDatabaseAsync = async (): Promise<void> => {
  const database = await getDatabaseAsync();

  await database.execAsync("PRAGMA journal_mode = WAL;");
  await database.execAsync("PRAGMA foreign_keys = ON;");
  await runMigrationsAsync(database);
};

export const resetDatabaseConnectionAsync = async (): Promise<void> => {
  if (!databasePromise) {
    return;
  }

  try {
    const database = await databasePromise;
    await database.closeAsync();
  } catch {
    // If the current platform does not support close, resetting the promise is enough for reopen.
  } finally {
    databasePromise = null;
  }
};
