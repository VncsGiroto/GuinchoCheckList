import {
  getDatabaseAsync,
  initializeDatabaseAsync,
  resetDatabaseConnectionAsync,
} from "../client";
import { isDatabaseNullPointerError } from "../databaseError";
import { CHECKLIST_TABLE_NAME } from "../schema";
import type {
  ChecklistRecord,
  ChecklistStatus,
  CreateChecklistInput,
  SaveDeliveryInput,
  SavePickupInput,
} from "../../types/checklist";

interface ChecklistRow {
  id: string;
  customer_name: string;
  customer_document_id: string | null;
  customer_phone: string | null;
  vehicle_plate: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_year: string;
  vehicle_notes: string | null;
  pickup_signature: string | null;
  delivery_signature: string | null;
  pickup_lat_long: string | null;
  delivery_lat_long: string | null;
  pickup_timestamp: string | null;
  delivery_timestamp: string | null;
  photos: string;
  status: ChecklistStatus;
  created_at: string;
  updated_at: string;
}

const INSERT_CHECKLIST_SQL = `
  INSERT INTO ${CHECKLIST_TABLE_NAME} (
    id,
    customer_name,
    customer_document_id,
    customer_phone,
    vehicle_plate,
    vehicle_brand,
    vehicle_model,
    vehicle_color,
    vehicle_year,
    vehicle_notes,
    pickup_signature,
    delivery_signature,
    pickup_lat_long,
    delivery_lat_long,
    pickup_timestamp,
    delivery_timestamp,
    photos,
    status,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const parseCoordinates = (rawValue: string | null) => {
  if (!rawValue) {
    return null;
  }

  const [latitude, longitude] = rawValue.split(",");
  return { latitude: Number(latitude), longitude: Number(longitude) };
};

const toRecord = (row: ChecklistRow): ChecklistRecord => {
  return {
    id: row.id,
    status: row.status,
    customer: {
      name: row.customer_name,
      documentId: row.customer_document_id,
      phone: row.customer_phone,
    },
    vehicle: {
      plate: row.vehicle_plate,
      brand: row.vehicle_brand,
      model: row.vehicle_model,
      color: row.vehicle_color,
      year: row.vehicle_year,
      notes: row.vehicle_notes,
    },
    photoPaths: JSON.parse(row.photos) as string[],
    pickup: {
      signatureBase64: row.pickup_signature,
      coordinates: parseCoordinates(row.pickup_lat_long),
      timestampIso: row.pickup_timestamp,
    },
    delivery: {
      signatureBase64: row.delivery_signature,
      coordinates: parseCoordinates(row.delivery_lat_long),
      timestampIso: row.delivery_timestamp,
    },
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
};

const serializeCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude},${longitude}`;
};

const serializeCoordinatesNullable = (
  coordinates: { latitude: number; longitude: number } | null,
): string | null => {
  if (!coordinates) {
    return null;
  }

  return serializeCoordinates(coordinates.latitude, coordinates.longitude);
};

const buildChecklistId = (): string => {
  return `cl_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const buildNowIso = (): string => new Date().toISOString();

const updatePhotoUnion = (currentPaths: string[], nextPaths: string[]): string[] => {
  const merged = new Set<string>([...currentPaths, ...nextPaths]);
  return [...merged];
};

const toChecklistInsertParams = (record: ChecklistRecord): Array<string | null> => {
  return [
    record.id,
    record.customer.name,
    record.customer.documentId,
    record.customer.phone,
    record.vehicle.plate,
    record.vehicle.brand,
    record.vehicle.model,
    record.vehicle.color,
    record.vehicle.year,
    record.vehicle.notes,
    record.pickup.signatureBase64,
    record.delivery.signatureBase64,
    serializeCoordinatesNullable(record.pickup.coordinates),
    serializeCoordinatesNullable(record.delivery.coordinates),
    record.pickup.timestampIso,
    record.delivery.timestampIso,
    JSON.stringify(record.photoPaths),
    record.status,
    record.createdAtIso,
    record.updatedAtIso,
  ];
};

const executeWithDatabaseRecoveryAsync = async <T>(
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

export const checklistRepository = {
  async create(input: CreateChecklistInput): Promise<ChecklistRecord> {
    const checklistId = buildChecklistId();
    const nowIso = buildNowIso();

    return executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const draftRecord: ChecklistRecord = {
        id: checklistId,
        status: "rascunho",
        customer: {
          name: input.customer.name,
          documentId: input.customer.documentId,
          phone: input.customer.phone,
        },
        vehicle: {
          plate: input.vehicle.plate,
          brand: input.vehicle.brand,
          model: input.vehicle.model,
          color: input.vehicle.color,
          year: input.vehicle.year,
          notes: input.vehicle.notes,
        },
        photoPaths: [],
        pickup: { signatureBase64: null, coordinates: null, timestampIso: null },
        delivery: { signatureBase64: null, coordinates: null, timestampIso: null },
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };

      await database.runAsync(
        INSERT_CHECKLIST_SQL,
        toChecklistInsertParams(draftRecord),
      );

      const created = await this.findById(checklistId);
      if (!created) {
        throw new Error("Checklist was inserted but could not be read back.");
      }

      return created;
    }, "Failed to create checklist");
  },

  async findById(id: string): Promise<ChecklistRecord | null> {
    return executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const row = await database.getFirstAsync<ChecklistRow>(
        `SELECT * FROM ${CHECKLIST_TABLE_NAME} WHERE id = ? LIMIT 1`,
        [id],
      );

      return row ? toRecord(row) : null;
    }, "Failed to fetch checklist by id");
  },

  async list(): Promise<ChecklistRecord[]> {
    return executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const rows = await database.getAllAsync<ChecklistRow>(
        `SELECT * FROM ${CHECKLIST_TABLE_NAME} ORDER BY created_at DESC`,
      );

      return rows.map(toRecord);
    }, "Failed to list checklists");
  },

  async savePickup(input: SavePickupInput): Promise<void> {
    await executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const checklist = await this.findById(input.checklistId);

      if (!checklist) {
        throw new Error("Checklist does not exist.");
      }

      if (
        checklist.pickup.signatureBase64 ||
        checklist.status === "em_transito" ||
        checklist.status === "concluido"
      ) {
        throw new Error("Pickup stage is locked and cannot be edited.");
      }

      const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

      await database.runAsync(
        `
          UPDATE ${CHECKLIST_TABLE_NAME}
          SET
            pickup_signature = ?,
            pickup_lat_long = ?,
            pickup_timestamp = ?,
            photos = ?,
            status = ?,
            updated_at = ?
          WHERE id = ?
        `,
        [
          input.signatureBase64,
          serializeCoordinatesNullable(input.coordinates),
          input.timestampIso,
          JSON.stringify(nextPhotos),
          "em_transito",
          buildNowIso(),
          input.checklistId,
        ],
      );
    }, "Failed to save pickup stage");
  },

  async saveDelivery(input: SaveDeliveryInput): Promise<void> {
    await executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const checklist = await this.findById(input.checklistId);

      if (!checklist) {
        throw new Error("Checklist does not exist.");
      }

      if (checklist.status === "concluido") {
        throw new Error("Delivery stage is locked and cannot be edited.");
      }

      const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

      await database.runAsync(
        `
          UPDATE ${CHECKLIST_TABLE_NAME}
          SET
            delivery_signature = ?,
            delivery_lat_long = ?,
            delivery_timestamp = ?,
            photos = ?,
            status = ?,
            updated_at = ?
          WHERE id = ?
        `,
        [
          input.signatureBase64,
          serializeCoordinatesNullable(input.coordinates),
          input.timestampIso,
          JSON.stringify(nextPhotos),
          "concluido",
          buildNowIso(),
          input.checklistId,
        ],
      );
    }, "Failed to save delivery stage");
  },

  async deleteById(id: string): Promise<void> {
    await executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      await database.runAsync(`DELETE FROM ${CHECKLIST_TABLE_NAME} WHERE id = ?`, [id]);
    }, "Failed to delete checklist");
  },

  async replaceAll(records: ChecklistRecord[]): Promise<void> {
    await executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();

      await database.withTransactionAsync(async () => {
        await database.runAsync(`DELETE FROM ${CHECKLIST_TABLE_NAME}`);

        for (const record of records) {
          await database.runAsync(INSERT_CHECKLIST_SQL, toChecklistInsertParams(record));
        }
      });
    }, "Failed to replace checklist data");
  },
};
