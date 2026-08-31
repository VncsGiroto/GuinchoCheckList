import { describe, expect, it } from "vitest";
import { parseBackupChecklists, parseBackupProviderSettings } from "./backupPayload";

const validPayload = JSON.stringify([
  {
    id: "cl_1",
    status: "em_transito",
    customer: {
      name: "Cliente",
      documentId: null,
      phone: "11999999999",
    },
    vehicle: {
      plate: "",
      brand: "Ford",
      model: "Ka",
      color: "Prata",
      year: "",
      notes: null,
    },
    photoPaths: ["file:///photo_1.jpg"],
    pickup: {
      signatureBase64: null,
      coordinates: { latitude: -23.0, longitude: -46.0 },
      timestampIso: "2026-04-17T10:00:00.000Z",
    },
    delivery: {
      signatureBase64: null,
      coordinates: null,
      timestampIso: null,
    },
    createdAtIso: "2026-04-17T09:00:00.000Z",
    updatedAtIso: "2026-04-17T10:00:00.000Z",
  },
]);

describe("parseBackupChecklists", () => {
  it("parses valid checklist payload", () => {
    const result = parseBackupChecklists(validPayload);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("cl_1");
    expect(result[0]?.status).toBe("em_transito");
  });

  it("throws when payload is not an array", () => {
    expect(() => parseBackupChecklists(JSON.stringify({ test: true }))).toThrow(
      "checklists.json nao contem lista",
    );
  });

  it("throws when one checklist is invalid", () => {
    const invalidPayload = JSON.stringify([{ id: "cl_1" }]);
    expect(() => parseBackupChecklists(invalidPayload)).toThrow(
      "existe checklist com campos ausentes ou invalidos",
    );
  });
});

describe("parseBackupProviderSettings", () => {
  it("parses valid provider settings payload", () => {
    const result = parseBackupProviderSettings(
      JSON.stringify({
        providerName: "Girofrancis Guinchos",
        providerDocumentId: "00.000.000/0001-00",
        providerPhone: null,
        providerEmail: null,
        providerAddress: "Rua Exemplo, 100",
      }),
    );

    expect(result.providerName).toBe("Girofrancis Guinchos");
    expect(result.providerAddress).toBe("Rua Exemplo, 100");
  });

  it("throws when provider name is missing", () => {
    expect(() =>
      parseBackupProviderSettings(
        JSON.stringify({
          providerDocumentId: "00.000.000/0001-00",
        }),
      ),
    ).toThrow("provider-settings.json");
  });
});
