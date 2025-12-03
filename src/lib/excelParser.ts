import * as XLSX from 'xlsx';
import type { ImportCustomerRow, ImportContactRow, ImportPayerRow, ImportAction, ParsedImportData } from '@/types/import';

function parseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === '1' || lower === 'yes' || lower === 'ja';
  }
  return false;
}

function parseAction(value: unknown): ImportAction {
  const str = String(value || '').toUpperCase().trim();
  if (str === 'CREATE' || str === 'UPDATE' || str === 'DELETE') return str;
  return 'CREATE';
}

function normalizeCategory(value: string): string {
  const categories: Record<string, string> = {
    'privat': 'Privat',
    'personal': 'Personal',
    'företag': 'Företag',
    'foretag': 'Företag',
    'åf': 'ÅF',
    'af': 'ÅF',
    'uf': 'UF',
    'skola': 'Skola',
    'omsorg': 'Omsorg',
    'förening': 'Förening',
    'forening': 'Förening',
  };
  return categories[value.toLowerCase().trim()] || value;
}

function normalizeTypeGroup(value: string): string {
  const upper = value.toUpperCase().trim();
  if (['B2C', 'B2B', 'B2G'].includes(upper)) return upper;
  return value;
}

function normalizeContactType(value: string): string {
  const types: Record<string, string> = {
    'member': 'Member',
    'newsletter': 'Newsletter',
    'teacher': 'Teacher',
    'buyer': 'Buyer',
    'other': 'Other',
  };
  return types[value.toLowerCase().trim()] || value;
}

export function parseExcelFile(file: File): Promise<ParsedImportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const customers = parseCustomersSheet(workbook);
        const contacts = parseContactsSheet(workbook);
        const payers = parsePayersSheet(workbook);
        
        resolve({ customers, contacts, payers });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function parseCustomersSheet(workbook: XLSX.WorkBook): ImportCustomerRow[] {
  const sheet = workbook.Sheets['Customers'];
  if (!sheet) return [];
  
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    action: parseAction(row['Action']),
    bcCustomerNumber: String(row['bcCustomerNumber'] || '').trim(),
    name: String(row['Name'] || '').trim(),
    customerCategory: normalizeCategory(String(row['CustomerCategory'] || '')),
    customerTypeGroup: normalizeTypeGroup(String(row['CustomerTypeGroup'] || '')),
    voyadoId: String(row['VoyadoId'] || '').trim(),
    norceCode: String(row['NorceCode'] || '').trim(),
    sitooCustomerNumber: String(row['SitooCustomerNumber'] || '').trim(),
    isActive: parseBoolean(row['IsActive']),
    isMunicipalityPayer: parseBoolean(row['IsMunicipalityPayer']),
  }));
}

function parseContactsSheet(workbook: XLSX.WorkBook): ImportContactRow[] {
  const sheet = workbook.Sheets['Contacts'];
  if (!sheet) return [];
  
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  return rows.map((row, index) => {
    const linkedRaw = String(row['LinkedBcCustomerNumber'] || '').trim();
    const linkedBcCustomerNumbers = linkedRaw
      ? linkedRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    
    return {
      rowNumber: index + 2,
      action: parseAction(row['Action']),
      voyadoId: String(row['VoyadoId'] || '').trim(),
      firstName: String(row['FirstName'] || '').trim(),
      lastName: String(row['LastName'] || '').trim(),
      email: String(row['Email'] || '').trim(),
      phone: String(row['Phone'] || '').trim(),
      contactType: normalizeContactType(String(row['ContactType'] || 'Other')),
      isTeacher: parseBoolean(row['IsTeacher']),
      linkedBcCustomerNumbers,
    };
  });
}

function parsePayersSheet(workbook: XLSX.WorkBook): ImportPayerRow[] {
  const sheet = workbook.Sheets['Payers'];
  if (!sheet) return [];
  
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  
  return rows.map((row, index) => ({
    rowNumber: index + 2,
    action: parseAction(row['Action']),
    customerBcNumber: String(row['CustomerBcNumber'] || '').trim(),
    payerBcNumber: String(row['PayerBcNumber'] || '').trim(),
  }));
}
