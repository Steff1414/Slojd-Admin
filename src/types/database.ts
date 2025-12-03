export type CustomerCategory = 'Privat' | 'Personal' | 'Företag' | 'ÅF' | 'UF' | 'Skola' | 'Omsorg' | 'Förening' | 'Kommun och Region';
export type CustomerTypeGroup = 'B2C' | 'B2B' | 'B2G';
export type ContactType = 'Member' | 'Newsletter' | 'Teacher' | 'Buyer' | 'Other';
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
