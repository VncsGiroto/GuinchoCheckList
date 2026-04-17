import { getDatabaseAsync } from "../client";
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

export const checklistRepository = {
  async create(input: CreateChecklistInput): Promise<ChecklistRecord> {
    const database = await getDatabaseAsync();
    const checklistId = buildChecklistId();
    const nowIso = buildNowIso();

    try {
      await database.runAsync(
        `
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
            photos,
            status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          checklistId,
          input.customer.name,
          input.customer.documentId,
          input.customer.phone,
          input.vehicle.plate,
          input.vehicle.brand,
          input.vehicle.model,
          input.vehicle.color,
          input.vehicle.year,
          input.vehicle.notes,
          JSON.stringify([]),
          "rascunho",
          nowIso,
          nowIso,
        ],
      );

      const created = await this.findById(checklistId);
      if (!created) {
        throw new Error("Checklist was inserted but could not be read back.");
      }

      return created;
    } catch (error) {
      throw new Error(`Failed to create checklist: ${(error as Error).message}`);
    }
  },

  async findById(id: string): Promise<ChecklistRecord | null> {
    const database = await getDatabaseAsync();

    try {
      const row = await database.getFirstAsync<ChecklistRow>(
        `SELECT * FROM ${CHECKLIST_TABLE_NAME} WHERE id = ? LIMIT 1`,
        [id],
      );

      return row ? toRecord(row) : null;
    } catch (error) {
      throw new Error(`Failed to fetch checklist by id: ${(error as Error).message}`);
    }
  },

  async list(): Promise<ChecklistRecord[]> {
    const database = await getDatabaseAsync();

    try {
      const rows = await database.getAllAsync<ChecklistRow>(
        `SELECT * FROM ${CHECKLIST_TABLE_NAME} ORDER BY created_at DESC`,
      );

      return rows.map(toRecord);
    } catch (error) {
      throw new Error(`Failed to list checklists: ${(error as Error).message}`);
    }
  },

  async savePickup(input: SavePickupInput): Promise<void> {
    const database = await getDatabaseAsync();
    const checklist = await this.findById(input.checklistId);

    if (!checklist) {
      throw new Error("Checklist does not exist.");
    }

    if (checklist.pickup.signatureBase64 || checklist.status === "em_transito" || checklist.status === "concluido") {
      throw new Error("Pickup stage is locked and cannot be edited.");
    }

    const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

    try {
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
    } catch (error) {
      throw new Error(`Failed to save pickup stage: ${(error as Error).message}`);
    }
  },

  async saveDelivery(input: SaveDeliveryInput): Promise<void> {
    const database = await getDatabaseAsync();
    const checklist = await this.findById(input.checklistId);

    if (!checklist) {
      throw new Error("Checklist does not exist.");
    }

    if (checklist.status === "concluido") {
      throw new Error("Delivery stage is locked and cannot be edited.");
    }

    const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

    try {
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
    } catch (error) {
      throw new Error(`Failed to save delivery stage: ${(error as Error).message}`);
    }
  },
};
