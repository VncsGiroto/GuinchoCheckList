import { getDatabaseAsync } from "../client";
import { executeWithDatabaseRecoveryAsync } from "../databaseRecovery";
import { CHECKLIST_TABLE_NAME } from "../schema";
import type { ChecklistRecord, CreateChecklistInput, SaveDeliveryInput, SavePickupInput } from "../../types/checklist";
import {
  assertDeliveryNotLocked,
  assertPickupNotLocked,
  buildChecklistId,
  buildNowIso,
  serializeCoordinatesNullable,
  toChecklistInsertParams,
  toRecord,
  updatePhotoUnion,
  type ChecklistRow,
} from "./checklistMappers";
import { INSERT_CHECKLIST_SQL, UPDATE_DELIVERY_SQL, UPDATE_PICKUP_SQL } from "./checklistSql";

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
        pickup: { signatureBase64: null, coordinates: null, timestampIso: null, receiverName: null, receiverDocumentId: null },
        delivery: { signatureBase64: null, coordinates: null, timestampIso: null, receiverName: null, receiverDocumentId: null },
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };

      await database.runAsync(INSERT_CHECKLIST_SQL, toChecklistInsertParams(draftRecord));

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

      assertPickupNotLocked(checklist);

      const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

      await database.runAsync(UPDATE_PICKUP_SQL, [
        input.signatureBase64,
        serializeCoordinatesNullable(input.coordinates),
        input.timestampIso,
        input.receiverName,
        input.receiverDocumentId,
        JSON.stringify(nextPhotos),
        "em_transito",
        buildNowIso(),
        input.checklistId,
      ]);
    }, "Failed to save pickup stage");
  },

  async saveDelivery(input: SaveDeliveryInput): Promise<void> {
    await executeWithDatabaseRecoveryAsync(async () => {
      const database = await getDatabaseAsync();
      const checklist = await this.findById(input.checklistId);

      if (!checklist) {
        throw new Error("Checklist does not exist.");
      }

      assertDeliveryNotLocked(checklist);

      const nextPhotos = updatePhotoUnion(checklist.photoPaths, input.photoPaths);

      await database.runAsync(UPDATE_DELIVERY_SQL, [
        input.signatureBase64,
        serializeCoordinatesNullable(input.coordinates),
        input.timestampIso,
        input.receiverName,
        input.receiverDocumentId,
        JSON.stringify(nextPhotos),
        "concluido",
        buildNowIso(),
        input.checklistId,
      ]);
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
