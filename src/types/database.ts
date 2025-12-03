export type CustomerCategory = 'Privat' | 'Personal' | 'Företag' | 'ÅF' | 'UF' | 'Skola' | 'Omsorg' | 'Förening' | 'Kommun och Region';
export type CustomerTypeGroup = 'B2C' | 'B2B' | 'B2G';
export type ContactType = 'Privatperson' | 'Medlem' | 'Nyhetsbrev' | 'Lärare' | 'Köpare' | 'Övrig';
export type RelationshipType = 'TeacherAtSchool' | 'BuyerAtCompany' | 'PrimaryContact' | 'Employee' | 'Other';

export interface Customer {
  id: string;
  bc_customer_number: string;
  name: string;
  customer_category: CustomerCategory;
  customer_type_group: CustomerTypeGroup;
  voyado_id: string | null;
  norce_code: string | null;
  sitoo_customer_number: string | null;
  is_active: boolean;
  payer_customer_id: string | null;
  created_at: string;
  updated_at: string;
  payer?: Customer | null;
}

export interface Contact {
  id: string;
  voyado_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  contact_type: ContactType;
  is_teacher: boolean;
  notes: string | null;
  wants_sms: boolean;
  wants_newsletter: boolean;
  wants_personalized_offers: boolean;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  name: string;
  customer_id: string;
  agreement_id: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  agreement?: Agreement | null;
}

export interface ContactCustomerLink {
  id: string;
  contact_id: string;
  customer_id: string;
  relationship_type: RelationshipType;
  is_primary: boolean;
  wants_sms?: boolean;
  wants_newsletter?: boolean;
  wants_personalized_offers?: boolean;
  created_at: string;
  contact?: Contact;
  customer?: Customer;
}

export interface TeacherSchoolAssignment {
  id: string;
  teacher_contact_id: string;
  school_customer_id: string;
  role: string | null;
  is_active: boolean;
  created_at: string;
  teacher?: Contact;
  school?: Customer;
}

export interface Profile {
  id: string;
  user_id: string;
  contact_id: string | null;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Phase 4 Types
export type EmailStatus = 'QUEUED' | 'SENT' | 'FAILED';
export type TrackingConsent = 'GRANTED' | 'DENIED' | 'UNKNOWN';
export type WebEventType = 'PAGE_VIEW' | 'PRODUCT_VIEW' | 'CATEGORY_VIEW' | 'ADD_TO_CART' | 'CHECKOUT_START';

export interface EmailTemplate {
  id: string;
  template_key: string;
  name: string;
  subject_template: string;
  body_template: string;
  description: string | null;
  is_active: boolean;
  category?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailMessage {
  id: string;
  contact_id: string;
  template_id: string | null;
  type_key: string | null;
  to_email: string;
  subject: string;
  body: string;
  status: EmailStatus;
  channel?: string | null;
  category?: string | null;
  related_order_id: string | null;
  related_basket_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  template?: EmailTemplate;
  order?: Order;
}

export interface WebSession {
  id: string;
  contact_id: string;
  session_token: string;
  started_at: string;
  ended_at: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  events?: WebEvent[];
}

export interface WebEvent {
  id: string;
  session_id: string;
  event_type: WebEventType;
  url: string;
  product_id: string | null;
  product_name: string | null;
  category_name: string | null;
  occurred_at: string;
  visit_index: number | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  category_name: string;
  main_category: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  buyer_contact_id: string | null;
  account_id: string | null;
  total_amount: number;
  status: string;
  created_at: string;
  customer?: Customer;
  items?: OrderItem[];
}

export interface CategoryAffinity {
  mainCategory: string;
  totalSpend: number;
  totalQuantity: number;
  categories: {
    name: string;
    spend: number;
    quantity: number;
  }[];
}

// Phase 4B Types
export type AddressType = 'BILLING' | 'DELIVERY' | 'ALTERNATIVE_DELIVERY';
export type EmailChannel = 'EMAIL' | 'SMS' | 'NEWSLETTER' | 'SYSTEM';
export type EmailCategory = 'WELCOME' | 'ORDER_CONFIRMATION' | 'ORDER_RECEIVED' | 'ORDER_DELIVERED' | 'PURCHASE_THANK_YOU' | 'RECEIPT' | 'ABANDONED_CART_REMINDER' | 'NEWSLETTER' | 'OTHER';

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_type: AddressType;
  label: string | null;
  name: string | null;
  street: string;
  postal_code: string;
  city: string;
  region: string | null;
  country: string;
  is_approved_delivery_address: boolean;
  is_default_for_type: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactWithLatestEmail extends Contact {
  latest_email_category?: EmailCategory | null;
  latest_email_channel?: EmailChannel | null;
  latest_email_at?: string | null;
}
