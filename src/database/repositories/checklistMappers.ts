import type { ChecklistRecord, ChecklistStatus } from "../../types/checklist";
import { CHECKLIST_TABLE_NAME } from "../schema";

export interface ChecklistRow {
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
  pickup_receiver_name: string | null;
  pickup_receiver_document_id: string | null;
  delivery_receiver_name: string | null;
  delivery_receiver_document_id: string | null;
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

export const toRecord = (row: ChecklistRow): ChecklistRecord => {
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
      receiverName: row.pickup_receiver_name ?? null,
      receiverDocumentId: row.pickup_receiver_document_id ?? null,
    },
    delivery: {
      signatureBase64: row.delivery_signature,
      coordinates: parseCoordinates(row.delivery_lat_long),
      timestampIso: row.delivery_timestamp,
      receiverName: row.delivery_receiver_name ?? null,
      receiverDocumentId: row.delivery_receiver_document_id ?? null,
    },
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
};

const serializeCoordinates = (latitude: number, longitude: number): string => {
  return `${latitude},${longitude}`;
};

export const serializeCoordinatesNullable = (
  coordinates: { latitude: number; longitude: number } | null,
): string | null => {
  if (!coordinates) {
    return null;
  }

  return serializeCoordinates(coordinates.latitude, coordinates.longitude);
};

export const toChecklistInsertParams = (record: ChecklistRecord): Array<string | null> => {
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
    record.pickup.receiverName,
    record.pickup.receiverDocumentId,
    record.delivery.receiverName,
    record.delivery.receiverDocumentId,
    JSON.stringify(record.photoPaths),
    record.status,
    record.createdAtIso,
    record.updatedAtIso,
  ];
};

export const updatePhotoUnion = (currentPaths: string[], nextPaths: string[]): string[] => {
  const merged = new Set<string>([...currentPaths, ...nextPaths]);
  return [...merged];
};

// 3b — asserts segregados para remover duplicação das travas
export const assertPickupNotLocked = (checklist: ChecklistRecord): void => {
  if (
    checklist.pickup.signatureBase64 ||
    checklist.status === "em_transito" ||
    checklist.status === "concluido"
  ) {
    throw new Error("Pickup stage is locked and cannot be edited.");
  }
};

export const assertDeliveryNotLocked = (checklist: ChecklistRecord): void => {
  if (checklist.status === "concluido") {
    throw new Error("Delivery stage is locked and cannot be edited.");
  }
};

export const buildChecklistId = (): string => {
  return `cl_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

export const buildNowIso = (): string => new Date().toISOString();

// Re-export table name for convenience
export { CHECKLIST_TABLE_NAME };
