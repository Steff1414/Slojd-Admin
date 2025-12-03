import type {
  ParsedImportData,
  ValidationResult,
  SheetValidationResult,
  ValidationIssue,
  ImportCustomerRow,
  ImportContactRow,
  ImportPayerRow,
} from '@/types/import';
import { supabase } from '@/integrations/supabase/client';

const VALID_CATEGORIES = ['Privat', 'Personal', 'Företag', 'ÅF', 'UF', 'Skola', 'Omsorg', 'Förening'];
const VALID_TYPE_GROUPS = ['B2C', 'B2B', 'B2G'];
const VALID_CONTACT_TYPES = ['Member', 'Newsletter', 'Teacher', 'Buyer', 'Other'];
const VALID_ACTIONS = ['CREATE', 'UPDATE', 'DELETE'];

interface ExistingData {
  customersByBc: Map<string, { id: string; name: string; category: string }>;
  contactsByVoyado: Map<string, { id: string; name: string }>;
}

export async function validateImport(data: ParsedImportData): Promise<ValidationResult> {
  // Fetch existing data for validation
  const existingData = await fetchExistingData();
  
  // Build set of BC numbers being created in this import
  const newBcNumbers = new Set<string>();
  data.customers.forEach((c) => {
    if (c.action === 'CREATE' && c.bcCustomerNumber) {
      newBcNumbers.add(c.bcCustomerNumber);
    }
  });
  
  const customersResult = validateCustomers(data.customers, existingData, newBcNumbers);
  const contactsResult = validateContacts(data.contacts, existingData, newBcNumbers);
  const payersResult = validatePayers(data.payers, existingData, newBcNumbers);
  
  const hasErrors = 
    customersResult.rowsWithErrors > 0 ||
    contactsResult.rowsWithErrors > 0 ||
    payersResult.rowsWithErrors > 0;
  
  return {
    customers: customersResult,
    contacts: contactsResult,
    payers: payersResult,
    canImport: !hasErrors,
  };
}

async function fetchExistingData(): Promise<ExistingData> {
  const [customersRes, contactsRes] = await Promise.all([
    supabase.from('customers').select('id, bc_customer_number, name, customer_category'),
    supabase.from('contacts').select('id, voyado_id, first_name, last_name').is('merged_into_id', null),
  ]);
  
  const customersByBc = new Map<string, { id: string; name: string; category: string }>();
  customersRes.data?.forEach((c) => {
    customersByBc.set(c.bc_customer_number, { id: c.id, name: c.name, category: c.customer_category });
  });
  
  const contactsByVoyado = new Map<string, { id: string; name: string }>();
  contactsRes.data?.forEach((c) => {
    contactsByVoyado.set(c.voyado_id, { id: c.id, name: `${c.first_name} ${c.last_name}` });
  });
  
  return { customersByBc, contactsByVoyado };
}

function validateCustomers(
  customers: ImportCustomerRow[],
  existing: ExistingData,
  newBcNumbers: Set<string>
): SheetValidationResult {
  const issues: ValidationIssue[] = [];
  const seenBcNumbers = new Set<string>();
  let rowsValid = 0;
  let rowsWithWarnings = 0;
  let rowsWithErrors = 0;
  
  for (const row of customers) {
    const rowIssues: ValidationIssue[] = [];
    
    // Action validation
    if (!VALID_ACTIONS.includes(row.action)) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'Action',
        entityKey: row.bcCustomerNumber || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: `Ogiltig Action: "${row.action}". Tillåtna värden: CREATE, UPDATE`,
      });
    }
    
    // Name validation
    if (!row.name) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'Name',
        entityKey: row.bcCustomerNumber || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: 'Namn krävs',
      });
    }
    
    // Category validation
    if (!VALID_CATEGORIES.includes(row.customerCategory)) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'CustomerCategory',
        entityKey: row.bcCustomerNumber || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: `Ogiltig kategori: "${row.customerCategory}"`,
      });
    }
    
    // Type group validation
    if (row.customerTypeGroup && !VALID_TYPE_GROUPS.includes(row.customerTypeGroup)) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'CustomerTypeGroup',
        entityKey: row.bcCustomerNumber || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: `Ogiltig typgrupp: "${row.customerTypeGroup}"`,
      });
    }
    
    // Category/TypeGroup consistency warning
    if (row.customerCategory === 'Skola' && row.customerTypeGroup === 'B2C') {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'CustomerTypeGroup',
        entityKey: row.bcCustomerNumber || `Row ${row.rowNumber}`,
        severity: 'WARNING',
        message: 'Skola med B2C är ovanligt - kontrollera att detta stämmer',
      });
    }
    
    // BC number validation for CREATE
    if (row.action === 'CREATE') {
      if (row.bcCustomerNumber) {
        if (existing.customersByBc.has(row.bcCustomerNumber)) {
          rowIssues.push({
            rowNumber: row.rowNumber,
            field: 'bcCustomerNumber',
            entityKey: row.bcCustomerNumber,
            severity: 'ERROR',
            message: `BC-nummer "${row.bcCustomerNumber}" finns redan i databasen`,
          });
        }
        if (seenBcNumbers.has(row.bcCustomerNumber)) {
          rowIssues.push({
            rowNumber: row.rowNumber,
            field: 'bcCustomerNumber',
            entityKey: row.bcCustomerNumber,
            severity: 'ERROR',
            message: `BC-nummer "${row.bcCustomerNumber}" är duplicerat i importfilen`,
          });
        }
        seenBcNumbers.add(row.bcCustomerNumber);
      }
    }
    
    // BC number validation for UPDATE
    if (row.action === 'UPDATE') {
      if (!row.bcCustomerNumber) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'bcCustomerNumber',
          entityKey: `Row ${row.rowNumber}`,
          severity: 'ERROR',
          message: 'BC-nummer krävs för UPDATE',
        });
      } else if (!existing.customersByBc.has(row.bcCustomerNumber)) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'bcCustomerNumber',
          entityKey: row.bcCustomerNumber,
          severity: 'ERROR',
          message: `Kund med BC-nummer "${row.bcCustomerNumber}" finns inte`,
        });
      }
    }
    
    // Tally results
    const hasErrors = rowIssues.some((i) => i.severity === 'ERROR');
    const hasWarnings = rowIssues.some((i) => i.severity === 'WARNING');
    
    if (hasErrors) rowsWithErrors++;
    else if (hasWarnings) rowsWithWarnings++;
    else rowsValid++;
    
    issues.push(...rowIssues);
  }
  
  return {
    rowsRead: customers.length,
    rowsValid,
    rowsWithWarnings,
    rowsWithErrors,
    issues,
  };
}

function validateContacts(
  contacts: ImportContactRow[],
  existing: ExistingData,
  newBcNumbers: Set<string>
): SheetValidationResult {
  const issues: ValidationIssue[] = [];
  const seenVoyadoIds = new Set<string>();
  const emailCounts = new Map<string, number>();
  let rowsValid = 0;
  let rowsWithWarnings = 0;
  let rowsWithErrors = 0;
  
  // Count email occurrences
  contacts.forEach((c) => {
    if (c.email) {
      emailCounts.set(c.email, (emailCounts.get(c.email) || 0) + 1);
    }
  });
  
  for (const row of contacts) {
    const rowIssues: ValidationIssue[] = [];
    
    // VoyadoId validation
    if (!row.voyadoId) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'VoyadoId',
        entityKey: `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: 'VoyadoId krävs',
      });
    }
    
    // Name validation
    if (!row.firstName || !row.lastName) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'FirstName/LastName',
        entityKey: row.voyadoId || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: 'Förnamn och efternamn krävs',
      });
    }
    
    // Email validation
    if (!row.email) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'Email',
        entityKey: row.voyadoId || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: 'E-post krävs',
      });
    }
    
    // Contact type validation
    if (!VALID_CONTACT_TYPES.includes(row.contactType)) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'ContactType',
        entityKey: row.voyadoId || `Row ${row.rowNumber}`,
        severity: 'ERROR',
        message: `Ogiltig kontakttyp: "${row.contactType}"`,
      });
    }
    
    // CREATE validation
    if (row.action === 'CREATE' && row.voyadoId) {
      if (existing.contactsByVoyado.has(row.voyadoId)) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'VoyadoId',
          entityKey: row.voyadoId,
          severity: 'ERROR',
          message: `VoyadoId "${row.voyadoId}" finns redan i databasen`,
        });
      }
      if (seenVoyadoIds.has(row.voyadoId)) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'VoyadoId',
          entityKey: row.voyadoId,
          severity: 'ERROR',
          message: `VoyadoId "${row.voyadoId}" är duplicerat i importfilen`,
        });
      }
      seenVoyadoIds.add(row.voyadoId);
    }
    
    // UPDATE validation
    if (row.action === 'UPDATE' && row.voyadoId) {
      if (!existing.contactsByVoyado.has(row.voyadoId)) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'VoyadoId',
          entityKey: row.voyadoId,
          severity: 'ERROR',
          message: `Kontakt med VoyadoId "${row.voyadoId}" finns inte`,
        });
      }
    }
    
    // Linked customer validation
    for (const bcNum of row.linkedBcCustomerNumbers) {
      const existsInDb = existing.customersByBc.has(bcNum);
      const existsInImport = newBcNumbers.has(bcNum);
      
      if (!existsInDb && !existsInImport) {
        rowIssues.push({
          rowNumber: row.rowNumber,
          field: 'LinkedBcCustomerNumber',
          entityKey: row.voyadoId || `Row ${row.rowNumber}`,
          severity: 'ERROR',
          message: `Länkad kund "${bcNum}" finns inte i databasen eller importfilen`,
        });
      }
      
      // Teacher linking to non-school warning
      if (row.isTeacher && existsInDb) {
        const customer = existing.customersByBc.get(bcNum);
        if (customer && customer.category !== 'Skola') {
          rowIssues.push({
            rowNumber: row.rowNumber,
            field: 'LinkedBcCustomerNumber',
            entityKey: row.voyadoId || `Row ${row.rowNumber}`,
            severity: 'WARNING',
            message: `Lärare länkad till icke-skola: "${bcNum}" (${customer.category})`,
          });
        }
      }
    }
    
    // Email reuse warning
    if (row.email && (emailCounts.get(row.email) || 0) > 5) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'Email',
        entityKey: row.voyadoId || `Row ${row.rowNumber}`,
        severity: 'WARNING',
        message: `E-post "${row.email}" används av fler än 5 kontakter i importfilen`,
      });
    }
    
    // Tally results
    const hasErrors = rowIssues.some((i) => i.severity === 'ERROR');
    const hasWarnings = rowIssues.some((i) => i.severity === 'WARNING');
    
    if (hasErrors) rowsWithErrors++;
    else if (hasWarnings) rowsWithWarnings++;
    else rowsValid++;
    
    issues.push(...rowIssues);
  }
  
  return {
    rowsRead: contacts.length,
    rowsValid,
    rowsWithWarnings,
    rowsWithErrors,
    issues,
  };
}

function validatePayers(
  payers: ImportPayerRow[],
  existing: ExistingData,
  newBcNumbers: Set<string>
): SheetValidationResult {
  const issues: ValidationIssue[] = [];
  let rowsValid = 0;
  let rowsWithWarnings = 0;
  let rowsWithErrors = 0;
  
  // Build payer graph to detect cycles
  const payerGraph = new Map<string, string>();
  
  for (const row of payers) {
    const rowIssues: ValidationIssue[] = [];
    
    // Action validation
    if (!['CREATE', 'UPDATE', 'DELETE'].includes(row.action)) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'Action',
        entityKey: `${row.customerBcNumber}->${row.payerBcNumber}`,
        severity: 'ERROR',
        message: `Ogiltig Action: "${row.action}"`,
      });
    }
    
    // Customer existence
    const customerExists = existing.customersByBc.has(row.customerBcNumber) || newBcNumbers.has(row.customerBcNumber);
    if (!customerExists) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'CustomerBcNumber',
        entityKey: `${row.customerBcNumber}->${row.payerBcNumber}`,
        severity: 'ERROR',
        message: `Kund "${row.customerBcNumber}" finns inte`,
      });
    }
    
    // Payer existence
    const payerExists = existing.customersByBc.has(row.payerBcNumber) || newBcNumbers.has(row.payerBcNumber);
    if (!payerExists) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'PayerBcNumber',
        entityKey: `${row.customerBcNumber}->${row.payerBcNumber}`,
        severity: 'ERROR',
        message: `Betalare "${row.payerBcNumber}" finns inte`,
      });
    }
    
    // Self-reference
    if (row.customerBcNumber === row.payerBcNumber) {
      rowIssues.push({
        rowNumber: row.rowNumber,
        field: 'PayerBcNumber',
        entityKey: `${row.customerBcNumber}->${row.payerBcNumber}`,
        severity: 'ERROR',
        message: 'Kund kan inte vara sin egen betalare',
      });
    }
    
    // Track for cycle detection
    if (row.action !== 'DELETE') {
      payerGraph.set(row.customerBcNumber, row.payerBcNumber);
    }
    
    // Tally results
    const hasErrors = rowIssues.some((i) => i.severity === 'ERROR');
    const hasWarnings = rowIssues.some((i) => i.severity === 'WARNING');
    
    if (hasErrors) rowsWithErrors++;
    else if (hasWarnings) rowsWithWarnings++;
    else rowsValid++;
    
    issues.push(...rowIssues);
  }
  
  // Cycle detection
  for (const [customer, payer] of payerGraph) {
    const visited = new Set<string>();
    let current = payer;
    
    while (current && !visited.has(current)) {
      visited.add(current);
      current = payerGraph.get(current) || '';
    }
    
    if (current && visited.has(current)) {
      issues.push({
        rowNumber: 0,
        field: 'PayerBcNumber',
        entityKey: customer,
        severity: 'ERROR',
        message: `Cirkulär betalarkedja upptäckt för kund "${customer}"`,
      });
      rowsWithErrors++;
    }
  }
  
  return {
    rowsRead: payers.length,
    rowsValid,
    rowsWithWarnings,
    rowsWithErrors,
    issues,
  };
}
