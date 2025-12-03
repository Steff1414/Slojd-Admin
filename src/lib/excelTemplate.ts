import * as XLSX from 'xlsx';

const CUSTOMER_HEADERS = [
  'Action',
  'bcCustomerNumber',
  'Name',
  'CustomerCategory',
  'CustomerTypeGroup',
  'VoyadoId',
  'NorceCode',
  'SitooCustomerNumber',
  'IsActive',
  'IsMunicipalityPayer',
];

const CONTACT_HEADERS = [
  'Action',
  'VoyadoId',
  'FirstName',
  'LastName',
  'Email',
  'Phone',
  'ContactType',
  'IsTeacher',
  'LinkedBcCustomerNumber',
];

const PAYER_HEADERS = [
  'Action',
  'CustomerBcNumber',
  'PayerBcNumber',
];

const CUSTOMER_EXAMPLE = {
  Action: 'CREATE',
  bcCustomerNumber: 'BC-10001',
  Name: 'Exempelskolan AB',
  CustomerCategory: 'Skola',
  CustomerTypeGroup: 'B2G',
  VoyadoId: '',
  NorceCode: '',
  SitooCustomerNumber: '',
  IsActive: 'TRUE',
  IsMunicipalityPayer: 'FALSE',
};

const CONTACT_EXAMPLE = {
  Action: 'CREATE',
  VoyadoId: 'VOY-12345',
  FirstName: 'Anna',
  LastName: 'Andersson',
  Email: 'anna@example.com',
  Phone: '+46701234567',
  ContactType: 'Teacher',
  IsTeacher: 'TRUE',
  LinkedBcCustomerNumber: 'BC-10001',
};

const PAYER_EXAMPLE = {
  Action: 'CREATE',
  CustomerBcNumber: 'BC-10001',
  PayerBcNumber: 'BC-20001',
};

export function generateImportTemplate(): Blob {
  const workbook = XLSX.utils.book_new();

  // Customers sheet
  const customersData = [CUSTOMER_HEADERS, Object.values(CUSTOMER_EXAMPLE)];
  const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
  customersSheet['!cols'] = CUSTOMER_HEADERS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, customersSheet, 'Customers');

  // Contacts sheet
  const contactsData = [CONTACT_HEADERS, Object.values(CONTACT_EXAMPLE)];
  const contactsSheet = XLSX.utils.aoa_to_sheet(contactsData);
  contactsSheet['!cols'] = CONTACT_HEADERS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, contactsSheet, 'Contacts');

  // Payers sheet
  const payersData = [PAYER_HEADERS, Object.values(PAYER_EXAMPLE)];
  const payersSheet = XLSX.utils.aoa_to_sheet(payersData);
  payersSheet['!cols'] = PAYER_HEADERS.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(workbook, payersSheet, 'Payers');

  // Generate buffer and convert to Blob
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function downloadTemplate() {
  const blob = generateImportTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'import_template.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
