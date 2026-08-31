import { useEffect, useMemo, useState } from "react";
import type { ChecklistRecord } from "../types/checklist";

export const useChecklistStageState = (checklist: ChecklistRecord) => {
  const [pickupSignature, setPickupSignature] = useState<string | null>(checklist.pickup.signatureBase64);
  const [deliverySignature, setDeliverySignature] = useState<string | null>(checklist.delivery.signatureBase64);
  const [pickupReceiverName, setPickupReceiverName] = useState(checklist.pickup.receiverName ?? "");
  const [pickupReceiverDocumentId, setPickupReceiverDocumentId] = useState(checklist.pickup.receiverDocumentId ?? "");
  const [deliveryReceiverName, setDeliveryReceiverName] = useState(checklist.delivery.receiverName ?? "");
  const [deliveryReceiverDocumentId, setDeliveryReceiverDocumentId] = useState(checklist.delivery.receiverDocumentId ?? "");

  useEffect(() => {
    setPickupSignature(checklist.pickup.signatureBase64);
    setDeliverySignature(checklist.delivery.signatureBase64);
    setPickupReceiverName(checklist.pickup.receiverName ?? "");
    setPickupReceiverDocumentId(checklist.pickup.receiverDocumentId ?? "");
    setDeliveryReceiverName(checklist.delivery.receiverName ?? "");
    setDeliveryReceiverDocumentId(checklist.delivery.receiverDocumentId ?? "");
  }, [
    checklist.id,
    checklist.pickup.signatureBase64,
    checklist.pickup.receiverName,
    checklist.pickup.receiverDocumentId,
    checklist.delivery.signatureBase64,
    checklist.delivery.receiverName,
    checklist.delivery.receiverDocumentId,
  ]);

  const isPickupLocked = useMemo(() => {
    return checklist.status !== "rascunho" || Boolean(checklist.pickup.signatureBase64);
  }, [checklist.pickup.signatureBase64, checklist.status]);

  const isDeliveryLocked = checklist.status === "concluido";

  return {
    pickupSignature,
    setPickupSignature,
    deliverySignature,
    setDeliverySignature,
    pickupReceiverName,
    setPickupReceiverName,
    pickupReceiverDocumentId,
    setPickupReceiverDocumentId,
    deliveryReceiverName,
    setDeliveryReceiverName,
    deliveryReceiverDocumentId,
    setDeliveryReceiverDocumentId,
    isPickupLocked,
    isDeliveryLocked,
  };
};
