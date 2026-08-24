import type { ChecklistRecord } from "../../types/checklist";
import type { ProviderSettings } from "../../types/settings";

const renderSignature = (signatureBase64: string | null): string => {
  if (!signatureBase64) {
    return "<p>Sem assinatura</p>";
  }

  return `<img src="${signatureBase64}" alt="Assinatura" style="height: 70px; width: auto;" />`;
};

const renderCoordinates = (latitude: number | undefined, longitude: number | undefined): string => {
  if (latitude === undefined || longitude === undefined) {
    return "Nao capturado";
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

const PHOTO_ORDER = ["frente", "traseira", "lado_esq", "lado_dir", "teto", "interior", "danos"] as const;

const extractPhotoLabel = (photoPath: string): string => {
  const fileName = photoPath.split("/").pop()?.toLowerCase() ?? "";

  const match = PHOTO_ORDER.find((item) => fileName.includes(`_${item}_`));
  if (!match) {
    return "registro";
  }

  if (match === "lado_esq") return "Lado Esq";
  if (match === "lado_dir") return "Lado Dir";
  return match.charAt(0).toUpperCase() + match.slice(1);
};

const resolvePhotoSrc = (photoPath: string, photoSrcMap: Record<string, string>): string => {
  return photoSrcMap[photoPath] ?? photoPath;
};

const isFilled = (value: string | null | undefined): boolean => value != null && String(value).trim() !== "";

const renderPhotosGrid = (photoPaths: string[], photoSrcMap: Record<string, string>): string => {
  if (photoPaths.length === 0) {
    return "<p>Sem fotos registradas.</p>";
  }

  return `
    <div class="photos-grid">
      ${photoPaths
        .map(
          (photoPath) => `
            <div class="photo-item">
              <img src="${resolvePhotoSrc(photoPath, photoSrcMap)}" alt="${extractPhotoLabel(photoPath)}" />
              <p>${extractPhotoLabel(photoPath)}</p>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
};

export const buildChecklistHtml = (
  checklist: ChecklistRecord,
  photoSrcMap: Record<string, string>,
  logoDataUri: string | null,
  providerSettings: ProviderSettings,
): string => {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #1A1A1A;
        margin: 20px;
      }
      h1, h2 {
        margin-bottom: 6px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .logo {
        width: 110px;
        height: 44px;
        object-fit: contain;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 12px;
      }
      .table td, .table th {
        border: 1px solid #DDDDDD;
        padding: 8px;
      }
      .signature-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .photos-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
      }
      .photo-item {
        border: 1px solid #DDDDDD;
        border-radius: 8px;
        padding: 6px;
      }
      .photo-item img {
        width: 100%;
        height: 120px;
        object-fit: cover;
      }
      .photo-item p {
        margin: 4px 0 0;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="header-left">
        ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo Girofrancis" />` : ""}
        <div>
        <h1>Girofrancis Checklist</h1>
        <p>Relatorio de Vistoria</p>
        </div>
      </div>
      <div>
        <p><strong>Prestador:</strong> ${providerSettings.providerName}</p>
        ${isFilled(providerSettings.providerDocumentId) ? `<p><strong>Documento:</strong> ${providerSettings.providerDocumentId}</p>` : ""}
        ${isFilled(providerSettings.providerPhone) ? `<p><strong>Telefone:</strong> ${providerSettings.providerPhone}</p>` : ""}
        ${isFilled(providerSettings.providerEmail) ? `<p><strong>Email:</strong> ${providerSettings.providerEmail}</p>` : ""}
        ${isFilled(providerSettings.providerAddress) ? `<p><strong>Endereco:</strong> ${providerSettings.providerAddress}</p>` : ""}
        <p><strong>ID:</strong> ${checklist.id}</p>
      </div>
    </div>

    <h2>Cliente</h2>
    <table class="table">
      <tr><th>Nome</th><td>${checklist.customer.name}</td></tr>
      ${isFilled(checklist.customer.documentId) ? `<tr><th>Documento</th><td>${checklist.customer.documentId}</td></tr>` : ""}
      ${isFilled(checklist.customer.phone) ? `<tr><th>Telefone</th><td>${checklist.customer.phone}</td></tr>` : ""}
    </table>

    <h2>Veiculo</h2>
    <table class="table">
      <tr><th>Placa</th><td>${checklist.vehicle.plate}</td></tr>
      <tr><th>Marca</th><td>${checklist.vehicle.brand}</td></tr>
      <tr><th>Modelo</th><td>${checklist.vehicle.model}</td></tr>
      ${isFilled(checklist.vehicle.color) ? `<tr><th>Cor</th><td>${checklist.vehicle.color}</td></tr>` : ""}
      ${isFilled(checklist.vehicle.year) ? `<tr><th>Ano</th><td>${checklist.vehicle.year}</td></tr>` : ""}
      ${isFilled(checklist.vehicle.notes) ? `<tr><th>Observacoes</th><td>${checklist.vehicle.notes}</td></tr>` : ""}
    </table>

    <h2>Fotos da Coleta</h2>
    ${renderPhotosGrid(
      checklist.photoPaths.filter((photoPath) => photoPath.includes("_pickup_")),
      photoSrcMap,
    )}

    <h2>Fotos da Entrega</h2>
    ${renderPhotosGrid(
      checklist.photoPaths.filter((photoPath) => photoPath.includes("_delivery_")),
      photoSrcMap,
    )}

    <h2>Assinaturas e Auditoria</h2>
    <div class="signature-container">
      <div>
        <h3>Coleta</h3>
        ${isFilled(checklist.pickup.receiverName) ? `<p><strong>Responsável - Nome:</strong> ${checklist.pickup.receiverName}</p>` : ""}
        ${isFilled(checklist.pickup.receiverDocumentId) ? `<p><strong>Documento (CPF/RG):</strong> ${checklist.pickup.receiverDocumentId}</p>` : ""}
        ${renderSignature(checklist.pickup.signatureBase64)}
        <p><strong>GPS:</strong> ${renderCoordinates(checklist.pickup.coordinates?.latitude, checklist.pickup.coordinates?.longitude)}</p>
        <p><strong>Horario:</strong> ${checklist.pickup.timestampIso ?? "Nao capturado"}</p>
      </div>
      <div>
        <h3>Entrega</h3>
        ${isFilled(checklist.delivery.receiverName) ? `<p><strong>Responsável - Nome:</strong> ${checklist.delivery.receiverName}</p>` : ""}
        ${isFilled(checklist.delivery.receiverDocumentId) ? `<p><strong>Documento (CPF/RG):</strong> ${checklist.delivery.receiverDocumentId}</p>` : ""}
        ${renderSignature(checklist.delivery.signatureBase64)}
        <p><strong>GPS:</strong> ${renderCoordinates(checklist.delivery.coordinates?.latitude, checklist.delivery.coordinates?.longitude)}</p>
        <p><strong>Horario:</strong> ${checklist.delivery.timestampIso ?? "Nao capturado"}</p>
      </div>
    </div>
  </body>
</html>
`;
};
