import { getDatabaseAsync, initializeDatabaseAsync, resetDatabaseConnectionAsync } from "./client";
import { isDatabaseNullPointerError } from "./databaseError";

export const executeWithDatabaseRecoveryAsync = async <T>(
  operation: () => Promise<T>,
  operationName: string,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    if (!isDatabaseNullPointerError(error)) {
      throw new Error(`${operationName}: ${(error as Error).message}`);
    }

    await resetDatabaseConnectionAsync();
    await initializeDatabaseAsync();

    try {
      return await operation();
    } catch (retryError) {
      throw new Error(`${operationName}: ${(retryError as Error).message}`);
    }
  }
};

// Helper for repositories that need direct database access inside recovery wrapper
export const getDatabaseForRecoveryAsync = getDatabaseAsync;
