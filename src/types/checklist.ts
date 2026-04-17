export type ChecklistStatus = "rascunho" | "em_transito" | "concluido";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface CheckpointMetadata {
  signatureBase64: string | null;
  coordinates: GeoPoint | null;
  timestampIso: string | null;
}

export interface VehicleData {
  plate: string;
  brand: string;
  model: string;
  color: string;
  year: string;
  notes: string | null;
}

export interface CustomerData {
  name: string;
  documentId: string | null;
  phone: string | null;
}

export interface ChecklistRecord {
  id: string;
  status: ChecklistStatus;
  customer: CustomerData;
  vehicle: VehicleData;
  photoPaths: string[];
  pickup: CheckpointMetadata;
  delivery: CheckpointMetadata;
  createdAtIso: string;
  updatedAtIso: string;
}

export interface CreateChecklistInput {
  customer: CustomerData;
  vehicle: VehicleData;
}

export interface SavePickupInput {
  checklistId: string;
  signatureBase64: string | null;
  coordinates: GeoPoint | null;
  timestampIso: string;
  photoPaths: string[];
}

export interface SaveDeliveryInput {
  checklistId: string;
  signatureBase64: string | null;
  coordinates: GeoPoint | null;
  timestampIso: string;
  photoPaths: string[];
}
