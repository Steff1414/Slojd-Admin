// Case management types

export type CaseStatus = 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';
export type CasePriority = 'LOW' | 'NORMAL' | 'HIGH';
export type CaseChannel = 'EMAIL' | 'PHONE' | 'CHAT' | 'OTHER';
export type CaseMessageDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL_NOTE';
export type CaseMessageType = 'EMAIL' | 'PHONE_CALL' | 'NOTE' | 'OTHER';
export type ShipmentStatus = 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED';

export interface Case {
  id: string;
  contact_id: string;
  customer_id: string | null;
  order_id: string | null;
  subject: string;
  description: string | null;
  status: CaseStatus;
  priority: CasePriority | null;
  channel: CaseChannel;
  created_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface CaseMessage {
  id: string;
  case_id: string;
  direction: CaseMessageDirection;
  message_type: CaseMessageType;
  email_message_id: string | null;
  body: string;
  author_user_id: string | null;
  created_at: string;
}

export interface Shipment {
  id: string;
  order_id: string;
  shipment_number: string;
  carrier: string;
  tracking_number: string | null;
  tracking_url: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  OPEN: 'Öppet',
  PENDING: 'Väntar på svar',
  RESOLVED: 'Löst',
  CLOSED: 'Stängt',
};

export const CASE_PRIORITY_LABELS: Record<CasePriority, string> = {
  LOW: 'Låg',
  NORMAL: 'Normal',
  HIGH: 'Hög',
};

export const CASE_CHANNEL_LABELS: Record<CaseChannel, string> = {
  EMAIL: 'E-post',
  PHONE: 'Telefon',
  CHAT: 'Chatt',
  OTHER: 'Annat',
};

export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  CREATED: 'Skapad',
  IN_TRANSIT: 'På väg',
  DELIVERED: 'Levererad',
  FAILED: 'Misslyckades',
};
