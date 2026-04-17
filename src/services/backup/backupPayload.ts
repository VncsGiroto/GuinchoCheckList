import type { ChecklistRecord, ChecklistStatus } from "../../types/checklist";
import type { UpdateProviderSettingsInput } from "../../types/settings";

const CHECKLIST_STATUSES: ChecklistStatus[] = ["rascunho", "em_transito", "concluido"];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isStringOrNull = (value: unknown): value is string | null =>
  typeof value === "string" || value === null;

const isCoordinates = (value: unknown): boolean => {
  if (value === null) return true;
  if (!isObject(value)) return false;
  return typeof value.latitude === "number" && typeof value.longitude === "number";
};

const isCheckpoint = (value: unknown): boolean => {
  if (!isObject(value)) return false;

  return (
    isStringOrNull(value.signatureBase64) &&
    isCoordinates(value.coordinates) &&
    isStringOrNull(value.timestampIso)
  );
};

const isChecklistRecord = (value: unknown): value is ChecklistRecord => {
  if (!isObject(value)) return false;
  if (!CHECKLIST_STATUSES.includes(value.status as ChecklistStatus)) return false;
  if (!Array.isArray(value.photoPaths) || !value.photoPaths.every((path) => typeof path === "string")) return false;
  if (!isObject(value.customer) || !isObject(value.vehicle)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.createdAtIso === "string" &&
    typeof value.updatedAtIso === "string" &&
    typeof value.customer.name === "string" &&
    isStringOrNull(value.customer.documentId) &&
    isStringOrNull(value.customer.phone) &&
    typeof value.vehicle.plate === "string" &&
    typeof value.vehicle.brand === "string" &&
    typeof value.vehicle.model === "string" &&
    typeof value.vehicle.color === "string" &&
    typeof value.vehicle.year === "string" &&
    isStringOrNull(value.vehicle.notes) &&
    isCheckpoint(value.pickup) &&
    isCheckpoint(value.delivery)
  );
};

export const parseBackupChecklists = (jsonText: string): ChecklistRecord[] => {
  const parsed = JSON.parse(jsonText) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("Formato invalido: checklists.json nao contem lista.");
  }

  const records = parsed.filter(isChecklistRecord);
  if (records.length !== parsed.length) {
    throw new Error("Formato invalido: existe checklist com campos ausentes ou invalidos.");
  }

  return records;
};

const isProviderSettings = (value: unknown): value is UpdateProviderSettingsInput => {
  if (!isObject(value)) return false;
  if (typeof value.providerName !== "string" || value.providerName.trim().length === 0) return false;

  return (
    isStringOrNull(value.providerDocumentId) &&
    isStringOrNull(value.providerPhone) &&
    isStringOrNull(value.providerEmail) &&
    isStringOrNull(value.providerAddress)
  );
};

export const parseBackupProviderSettings = (jsonText: string): UpdateProviderSettingsInput => {
  const parsed = JSON.parse(jsonText) as unknown;
  if (!isProviderSettings(parsed)) {
    throw new Error("Formato invalido: provider-settings.json com campos ausentes.");
  }

  return parsed;
};
