export type ImportAction = 'CREATE' | 'UPDATE' | 'DELETE';
export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export interface ImportCustomerRow {
  rowNumber: number;
  action: ImportAction;
  bcCustomerNumber: string;
  name: string;
  customerCategory: string;
  customerTypeGroup: string;
  voyadoId: string;
  norceCode: string;
  sitooCustomerNumber: string;
  isActive: boolean;
  isMunicipalityPayer: boolean;
}

export interface ImportContactRow {
  rowNumber: number;
  action: ImportAction;
  voyadoId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  contactType: string;
  isTeacher: boolean;
  linkedBcCustomerNumbers: string[];
}

export interface ImportPayerRow {
  rowNumber: number;
  action: ImportAction;
  customerBcNumber: string;
  payerBcNumber: string;
}

export interface ValidationIssue {
  rowNumber: number;
  field?: string;
  entityKey: string;
  severity: ValidationSeverity;
  message: string;
}

export interface SheetValidationResult {
  rowsRead: number;
  rowsValid: number;
  rowsWithWarnings: number;
  rowsWithErrors: number;
  issues: ValidationIssue[];
}

export interface ValidationResult {
  customers: SheetValidationResult;
  contacts: SheetValidationResult;
  payers: SheetValidationResult;
  canImport: boolean;
}

export interface ImportSummary {
  customersCreated: number;
  customersUpdated: number;
  contactsCreated: number;
  contactsUpdated: number;
  payerLinksCreated: number;
  payerLinksUpdated: number;
  payerLinksDeleted: number;
}

export interface ParsedImportData {
  customers: ImportCustomerRow[];
  contacts: ImportContactRow[];
  payers: ImportPayerRow[];
}
