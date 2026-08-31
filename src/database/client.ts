import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import { runMigrationsAsync } from "./schema";
import { CHECKLIST_DATABASE_FILE_NAME } from "../constants/storage";
import * as FileSystem from "expo-file-system/legacy";

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

interface PragmaDatabaseListRow {
  seq: number;
  name: string;
  file: string;
}

export interface DatabaseFiles {
  main: string;
  wal: string;
  shm: string;
}

export const getDatabaseFilesAsync = async (): Promise<DatabaseFiles> => {
  const database = await getDatabaseAsync();

  try {
    const rows = await database.getAllAsync<PragmaDatabaseListRow>("PRAGMA database_list;");
    const mainRow = rows.find((row) => row.name === "main");

    if (mainRow?.file) {
      return {
        main: mainRow.file,
        wal: `${mainRow.file}-wal`,
        shm: `${mainRow.file}-shm`,
      };
    }
  } catch {
    // Fallback below if pragma isn't available for any reason.
  }

  const fallbackMain = `${FileSystem.documentDirectory}SQLite/${CHECKLIST_DATABASE_FILE_NAME}`;
  return {
    main: fallbackMain,
    wal: `${fallbackMain}-wal`,
    shm: `${fallbackMain}-shm`,
  };
};
