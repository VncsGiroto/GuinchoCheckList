import { describe, expect, it } from "vitest";
import {
  assertDeliveryNotLocked,
  assertPickupNotLocked,
  serializeCoordinatesNullable,
  toRecord,
  updatePhotoUnion,
  type ChecklistRow,
} from "./checklistMappers";
import type { ChecklistRecord } from "../../types/checklist";

const buildBaseRecord = (overrides: Partial<ChecklistRecord> = {}): ChecklistRecord => ({
  id: "cl_1",
  status: "rascunho",
  customer: { name: "Cliente", documentId: null, phone: null },
  vehicle: { plate: "ABC1234", brand: "VW", model: "Gol", color: "Prata", year: "2020", notes: null },
  photoPaths: [],
  pickup: { signatureBase64: null, coordinates: null, timestampIso: null, receiverName: null, receiverDocumentId: null },
  delivery: { signatureBase64: null, coordinates: null, timestampIso: null, receiverName: null, receiverDocumentId: null },
  createdAtIso: "2026-01-01T10:00:00.000Z",
  updatedAtIso: "2026-01-01T10:00:00.000Z",
  ...overrides,
});

describe("updatePhotoUnion", () => {
  it("merges without duplicates", () => {
    expect(updatePhotoUnion(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });

  it("returns copy when second is empty", () => {
    expect(updatePhotoUnion(["a"], [])).toEqual(["a"]);
  });

  it("returns second when first is empty", () => {
    expect(updatePhotoUnion([], ["x"])).toEqual(["x"]);
  });

  it("preserves order of first appearance", () => {
    expect(updatePhotoUnion(["b", "a"], ["a", "c"])).toEqual(["b", "a", "c"]);
  });
});

describe("assertPickupNotLocked", () => {
  it("allows rascunho without signature", () => {
    const record = buildBaseRecord({ status: "rascunho", pickup: { signatureBase64: null, coordinates: null, timestampIso: null, receiverName: null, receiverDocumentId: null } });
    expect(() => assertPickupNotLocked(record)).not.toThrow();
  });

  it("throws when pickup already has signature", () => {
    const record = buildBaseRecord({
      status: "rascunho",
      pickup: { signatureBase64: "data:image/png;base64,abc", coordinates: null, timestampIso: "2026-01-01T11:00:00.000Z", receiverName: null, receiverDocumentId: null },
    });
    expect(() => assertPickupNotLocked(record)).toThrow("Pickup stage is locked");
  });

  it("throws when status is em_transito", () => {
    const record = buildBaseRecord({ status: "em_transito" });
    expect(() => assertPickupNotLocked(record)).toThrow("Pickup stage is locked");
  });

  it("throws when status is concluido", () => {
    const record = buildBaseRecord({ status: "concluido" });
    expect(() => assertPickupNotLocked(record)).toThrow("Pickup stage is locked");
  });
});

describe("assertDeliveryNotLocked", () => {
  it("allows rascunho and em_transito", () => {
    expect(() => assertDeliveryNotLocked(buildBaseRecord({ status: "rascunho" }))).not.toThrow();
    expect(() => assertDeliveryNotLocked(buildBaseRecord({ status: "em_transito" }))).not.toThrow();
  });

  it("throws when status is concluido", () => {
    expect(() => assertDeliveryNotLocked(buildBaseRecord({ status: "concluido" }))).toThrow("Delivery stage is locked");
  });
});

describe("serializeCoordinatesNullable", () => {
  it("returns null for null", () => {
    expect(serializeCoordinatesNullable(null)).toBeNull();
  });

  it("serializes lat,long", () => {
    expect(serializeCoordinatesNullable({ latitude: -23.5, longitude: -46.6 })).toBe("-23.5,-46.6");
  });
});

describe("toRecord", () => {
  it("maps row to record with coordinates and photos", () => {
    const row: ChecklistRow = {
      id: "cl_1",
      customer_name: "Joao",
      customer_document_id: "123",
      customer_phone: null,
      vehicle_plate: "ABC1234",
      vehicle_brand: "Fiat",
      vehicle_model: "Uno",
      vehicle_color: "Branco",
      vehicle_year: "2019",
      vehicle_notes: null,
      pickup_signature: null,
      delivery_signature: null,
      pickup_lat_long: "-23.123456,-46.654321",
      delivery_lat_long: null,
      pickup_timestamp: "2026-01-01T11:00:00.000Z",
      delivery_timestamp: null,
      pickup_receiver_name: "Maria",
      pickup_receiver_document_id: null,
      delivery_receiver_name: null,
      delivery_receiver_document_id: null,
      photos: JSON.stringify(["file:///a.jpg", "file:///b.jpg"]),
      status: "em_transito",
      created_at: "2026-01-01T10:00:00.000Z",
      updated_at: "2026-01-01T11:00:00.000Z",
    };

    const record = toRecord(row);
    expect(record.id).toBe("cl_1");
    expect(record.customer.name).toBe("Joao");
    expect(record.pickup.coordinates).toEqual({ latitude: -23.123456, longitude: -46.654321 });
    expect(record.delivery.coordinates).toBeNull();
    expect(record.photoPaths).toEqual(["file:///a.jpg", "file:///b.jpg"]);
    expect(record.pickup.receiverName).toBe("Maria");
  });

  it("parses null coordinates as null", () => {
    const row: ChecklistRow = {
      id: "cl_2",
      customer_name: "Ana",
      customer_document_id: null,
      customer_phone: null,
      vehicle_plate: "XYZ9999",
      vehicle_brand: "Ford",
      vehicle_model: "Ka",
      vehicle_color: "Preto",
      vehicle_year: "2022",
      vehicle_notes: "obs",
      pickup_signature: null,
      delivery_signature: null,
      pickup_lat_long: null,
      delivery_lat_long: null,
      pickup_timestamp: null,
      delivery_timestamp: null,
      pickup_receiver_name: null,
      pickup_receiver_document_id: null,
      delivery_receiver_name: null,
      delivery_receiver_document_id: null,
      photos: "[]",
      status: "rascunho",
      created_at: "2026-01-01T10:00:00.000Z",
      updated_at: "2026-01-01T10:00:00.000Z",
    };
    expect(toRecord(row).pickup.coordinates).toBeNull();
  });
});
