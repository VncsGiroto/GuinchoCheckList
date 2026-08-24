import type { ChecklistRecord } from "../../types/checklist";
import type { ProviderSettings } from "../../types/settings";

const renderSignature = (signatureBase64: string | null): string => {
  if (!signatureBase64) {
    return '<p class="muted">Sem assinatura</p>';
  }
  return `<img src="${signatureBase64}" alt="Assinatura" class="signature-img" />`;
};

const renderCoordinates = (latitude: number | undefined, longitude: number | undefined): string => {
  if (latitude === undefined || longitude === undefined) {
    return "Nao capturado";
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

const formatTimestamp = (iso: string | null): string => {
  if (!iso) return "Nao capturado";
  try {
    return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return iso;
  }
};

const PHOTO_ORDER = ["frente", "traseira", "lado_esq", "lado_dir", "teto", "interior", "danos"] as const;

const extractPhotoLabel = (photoPath: string): string => {
  const fileName = photoPath.split("/").pop()?.toLowerCase() ?? "";
  const match = PHOTO_ORDER.find((item) => fileName.includes(`_${item}_`));
  if (!match) return "registro";
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
    return `<div class="empty-photos"><span class="empty-icon">⚠️</span><p>Nenhuma foto registrada nesta etapa.</p></div>`;
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
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; color: #1A1A1A; margin: 0; padding: 20px 24px; font-size: 18px; line-height: 1.6; background: #FFFFFF; }
      .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0F2A44; padding-bottom: 14px; margin-bottom: 18px; gap: 16px; }
      .header-left { display: flex; align-items: center; gap: 14px; }
      .logo { width: 160px; height: 60px; object-fit: contain; }
      .header-center { text-align: center; flex: 1; }
      .header-center h1 { font-size: 24px; font-weight: 800; color: #0F2A44; letter-spacing: 0.5px; margin-bottom: 3px; }
      .header-center p { font-size: 14px; color: #555; }
      .header-id { font-size: 13px; color: #555; text-align: right; white-space: nowrap; line-height: 1.4; }
      .header-id strong { color: #0F2A44; }
      .section { margin-bottom: 16px; break-inside: auto; }
      .section-title { font-size: 14px; font-weight: 800; color: #FFFFFF; background: #0F2A44; padding: 10px 12px; border-radius: 4px 4px 0 0; letter-spacing: 0.4px; text-transform: uppercase; break-after: avoid; page-break-after: avoid; }
      .keep-together { break-inside: avoid; page-break-inside: avoid; break-after: avoid; page-break-after: avoid; }
      .card { border: 1px solid #DDDDDD; border-top: none; border-radius: 0 0 6px 6px; overflow: hidden; }
      .dual-table { width: 100%; border-collapse: collapse; }
      .dual-table th { background: #F2F4F7; color: #0F2A44; font-size: 13px; text-transform: uppercase; letter-spacing: 0.3px; padding: 8px 10px; border: 1px solid #E0E4EA; text-align: left; width: 50%; }
      .dual-table td { padding: 0; vertical-align: top; border: 1px solid #E0E4EA; }
      .inner-table { width: 100%; border-collapse: collapse; }
      .inner-table td { padding: 8px 10px; border-bottom: 1px solid #EEF0F3; font-size: 16px; }
      .inner-table tr:last-child td { border-bottom: none; }
      .inner-table .label { color: #6B7280; font-size: 13px; font-weight: 700; width: 110px; white-space: nowrap; }
      .inner-table .value { color: #1A1A1A; font-weight: 600; }
      .vehicle-card { border: 1px solid #DDDDDD; border-top: none; border-radius: 0 0 6px 6px; padding: 12px 14px; background: #FAFBFC; break-inside: avoid; page-break-inside: avoid; }
      .vehicle-plate { display: inline-block; background: #0F2A44; color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: 1.4px; padding: 6px 16px; border-radius: 4px; margin-bottom: 10px; }
      .vehicle-grid { display: flex; flex-wrap: wrap; gap: 8px 20px; font-size: 16px; }
      .vehicle-grid span { white-space: nowrap; }
      .vehicle-grid strong { color: #6B7280; font-size: 13px; text-transform: uppercase; }
      .vehicle-notes { margin-top: 10px; padding: 9px 12px; background: #FFFFFF; border: 1px solid #E0E4EA; border-radius: 4px; font-size: 16px; }
      .vehicle-notes strong { color: #0F2A44; }
      .photos-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; break-inside: auto; }
      .photo-item { border: 1px solid #E0E4EA; border-radius: 6px; overflow: hidden; background: #FFFFFF; break-inside: avoid; page-break-inside: avoid; }
      .photo-item img { width: 100%; height: 130px; object-fit: cover; display: block; }
      .photo-item p { margin: 0; padding: 6px; font-size: 13px; font-weight: 700; text-align: center; background: #F2F4F7; color: #0F2A44; text-transform: uppercase; letter-spacing: 0.3px; }
      .empty-photos { display: flex; align-items: center; gap: 12px; background: #F2F4F7; border: 1px dashed #CBD5E1; border-radius: 6px; padding: 16px 18px; color: #64748B; font-size: 16px; break-inside: avoid; page-break-inside: avoid; }
      .empty-icon { font-size: 24px; }
      .audit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; break-inside: avoid; page-break-inside: avoid; }
      .audit-card { border: 1px solid #E0E4EA; border-radius: 6px; overflow: hidden; background: #FFFFFF; break-inside: avoid; page-break-inside: avoid; }
      .audit-card h3 { background: #F2F4F7; color: #0F2A44; font-size: 14px; font-weight: 800; padding: 9px 12px; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid #E0E4EA; }
      .audit-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; font-size: 16px; }
      .audit-body p { line-height: 1.6; }
      .audit-body strong { color: #0F2A44; }
      .signature-img { height: 84px; width: auto; max-width: 280px; object-fit: contain; border: 1px solid #EEF0F3; border-radius: 4px; background: #FFFFFF; padding: 2px; }
      .muted { color: #94A3B8; font-style: italic; font-size: 14px; }
      @page { margin: 12mm 10mm; size: A4; }
      @media print { body { padding: 10px; } .photos-grid { gap: 6px; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div class="header-left">
        ${logoDataUri ? `<img class="logo" src="${logoDataUri}" alt="Logo Girofrancis" />` : ""}
      </div>
      <div class="header-center">
        <h1>RELATÓRIO DE VISTORIA VEICULAR</h1>
        <p>Girofrancis Checklist</p>
      </div>
      <div class="header-id">
        <p><strong>ID do Serviço:</strong><br/>${checklist.id}</p>
      </div>
    </div>

    <div class="section">
      <div class="keep-together">
        <div class="section-title">Dados do Prestador e Cliente</div>
        <div class="card">
          <table class="dual-table">
            <tr><th>Dados do Prestador</th><th>Dados do Cliente</th></tr>
            <tr>
              <td>
                <table class="inner-table">
                  <tr><td class="label">Empresa</td><td class="value">${providerSettings.providerName}</td></tr>
                  <tr><td class="label">Documento</td><td class="value">${providerSettings.providerDocumentId ?? "-"}</td></tr>
                  ${isFilled(providerSettings.providerPhone) ? `<tr><td class="label">Telefone</td><td class="value">${providerSettings.providerPhone}</td></tr>` : ""}
                  ${isFilled(providerSettings.providerEmail) ? `<tr><td class="label">E-mail</td><td class="value">${providerSettings.providerEmail}</td></tr>` : ""}
                  ${isFilled(providerSettings.providerAddress) ? `<tr><td class="label">Endereço</td><td class="value">${providerSettings.providerAddress}</td></tr>` : ""}
                </table>
              </td>
              <td>
                <table class="inner-table">
                  <tr><td class="label">Nome</td><td class="value">${checklist.customer.name}</td></tr>
                  ${isFilled(checklist.customer.phone) ? `<tr><td class="label">Telefone</td><td class="value">${checklist.customer.phone}</td></tr>` : ""}
                  ${isFilled(checklist.customer.documentId) ? `<tr><td class="label">Documento</td><td class="value">${checklist.customer.documentId}</td></tr>` : ""}
                </table>
              </td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="keep-together">
        <div class="section-title">Identificação do Veículo</div>
        <div class="vehicle-card">
          <div class="vehicle-plate">${checklist.vehicle.plate || "—"}</div>
          <div class="vehicle-grid">
            <span><strong>Marca</strong> ${checklist.vehicle.brand}</span>
            <span><strong>Modelo</strong> ${checklist.vehicle.model}</span>
            ${isFilled(checklist.vehicle.color) ? `<span><strong>Cor</strong> ${checklist.vehicle.color}</span>` : ""}
            ${isFilled(checklist.vehicle.year) ? `<span><strong>Ano</strong> ${checklist.vehicle.year}</span>` : ""}
          </div>
          ${isFilled(checklist.vehicle.notes) ? `<div class="vehicle-notes"><strong>Observações:</strong> ${checklist.vehicle.notes}</div>` : ""}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Registro Fotográfico — Coleta</div>
      <div class="card" style="padding:10px; border-top:none; border-radius:0 0 6px 6px;">
        ${renderPhotosGrid(checklist.photoPaths.filter((p) => p.includes("_pickup_")), photoSrcMap)}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Registro Fotográfico — Entrega</div>
      <div class="card" style="padding:10px; border-top:none; border-radius:0 0 6px 6px;">
        ${renderPhotosGrid(checklist.photoPaths.filter((p) => p.includes("_delivery_")), photoSrcMap)}
      </div>
    </div>

    <div class="section">
      <div class="keep-together">
        <div class="section-title">Auditoria e Assinaturas</div>
        <div class="audit-grid">
        <div class="audit-card">
          <h3>Coleta</h3>
          <div class="audit-body">
            <p><strong>Data/Hora:</strong> ${formatTimestamp(checklist.pickup.timestampIso)}</p>
            <p><strong>Localização:</strong> ${renderCoordinates(checklist.pickup.coordinates?.latitude, checklist.pickup.coordinates?.longitude)}</p>
            ${isFilled(checklist.pickup.receiverName) ? `<p><strong>Responsável - Nome:</strong> ${checklist.pickup.receiverName}</p>` : ""}
            ${isFilled(checklist.pickup.receiverDocumentId) ? `<p><strong>Documento (CPF/RG):</strong> ${checklist.pickup.receiverDocumentId}</p>` : ""}
            <div style="margin-top:6px;">${renderSignature(checklist.pickup.signatureBase64)}</div>
          </div>
        </div>
        <div class="audit-card">
          <h3>Entrega</h3>
          <div class="audit-body">
            <p><strong>Data/Hora:</strong> ${formatTimestamp(checklist.delivery.timestampIso)}</p>
            <p><strong>Localização:</strong> ${renderCoordinates(checklist.delivery.coordinates?.latitude, checklist.delivery.coordinates?.longitude)}</p>
            ${isFilled(checklist.delivery.receiverName) ? `<p><strong>Responsável - Nome:</strong> ${checklist.delivery.receiverName}</p>` : ""}
            ${isFilled(checklist.delivery.receiverDocumentId) ? `<p><strong>Documento (CPF/RG):</strong> ${checklist.delivery.receiverDocumentId}</p>` : ""}
            <div style="margin-top:6px;">${renderSignature(checklist.delivery.signatureBase64)}</div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
};
