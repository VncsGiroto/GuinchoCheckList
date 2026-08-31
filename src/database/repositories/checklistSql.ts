import { CHECKLIST_TABLE_NAME } from "../schema";

export const INSERT_CHECKLIST_SQL = `
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
    pickup_signature,
    delivery_signature,
    pickup_lat_long,
    delivery_lat_long,
    pickup_timestamp,
    delivery_timestamp,
    pickup_receiver_name,
    pickup_receiver_document_id,
    delivery_receiver_name,
    delivery_receiver_document_id,
    photos,
    status,
    created_at,
    updated_at
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export const UPDATE_PICKUP_SQL = `
  UPDATE ${CHECKLIST_TABLE_NAME}
  SET
    pickup_signature = ?,
    pickup_lat_long = ?,
    pickup_timestamp = ?,
    pickup_receiver_name = ?,
    pickup_receiver_document_id = ?,
    photos = ?,
    status = ?,
    updated_at = ?
  WHERE id = ?
`;

export const UPDATE_DELIVERY_SQL = `
  UPDATE ${CHECKLIST_TABLE_NAME}
  SET
    delivery_signature = ?,
    delivery_lat_long = ?,
    delivery_timestamp = ?,
    delivery_receiver_name = ?,
    delivery_receiver_document_id = ?,
    photos = ?,
    status = ?,
    updated_at = ?
  WHERE id = ?
`;
