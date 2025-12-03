import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DuplicateGroup {
  value: string;
  type: 'school_name' | 'customer_name' | 'contact_email' | 'teacher_email' | 'bc_number' | 'voyado_id' | 'norce_code' | 'sitoo_number';
  severity: 'error' | 'warning' | 'info';
  records: {
    id: string;
    entityType: 'Customer' | 'Contact' | 'Teacher';
    name: string;
    email?: string;
    bcNumber?: string;
    voyadoId?: string;
    norceCode?: string;
    sitooNumber?: string;
  }[];
}

export interface AnomalyItem {
  type: 'school_no_payer' | 'teacher_no_school';
  severity: 'warning' | 'info';
  records: {
    id: string;
    entityType: 'Customer' | 'Contact';
    name: string;
  }[];
}

export interface DataQualityReport {
  duplicates: DuplicateGroup[];
  anomalies: AnomalyItem[];
  summary: {
    totalDuplicateGroups: number;
    totalAnomalies: number;
    criticalIssues: number;
    warnings: number;
  };
  scannedAt: Date;
}

export function useDataQualityScan() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<DataQualityReport | null>(null);

  const runScan = async () => {
    setLoading(true);
    try {
      const duplicates: DuplicateGroup[] = [];
      const anomalies: AnomalyItem[] = [];

      // 1. Duplicate school names
      const { data: schools } = await supabase
        .from('customers')
        .select('id, name, bc_customer_number, voyado_id')
        .eq('customer_category', 'Skola');

      if (schools) {
        const schoolNameGroups = groupBy(schools, 'name');
        for (const [name, group] of Object.entries(schoolNameGroups)) {
          if (group.length > 1) {
            duplicates.push({
              value: name,
              type: 'school_name',
              severity: 'warning',
              records: group.map(s => ({
                id: s.id,
                entityType: 'Customer',
                name: s.name,
                bcNumber: s.bc_customer_number,
                voyadoId: s.voyado_id || undefined,
              })),
            });
          }
        }
      }

      // 2. Duplicate customer names (B2B/B2G)
      const { data: b2bCustomers } = await supabase
        .from('customers')
        .select('id, name, bc_customer_number, voyado_id, customer_type_group')
        .in('customer_type_group', ['B2B', 'B2G']);

      if (b2bCustomers) {
        const customerNameGroups = groupBy(b2bCustomers, 'name');
        for (const [name, group] of Object.entries(customerNameGroups)) {
          if (group.length > 1) {
            duplicates.push({
              value: name,
              type: 'customer_name',
              severity: 'warning',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Customer',
                name: c.name,
                bcNumber: c.bc_customer_number,
                voyadoId: c.voyado_id || undefined,
              })),
            });
          }
        }
      }

      // 3. Duplicate contact emails
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, voyado_id, is_teacher')
        .is('merged_into_id', null);

      if (contacts) {
        const nonTeachers = contacts.filter(c => !c.is_teacher);
        const teachers = contacts.filter(c => c.is_teacher);

        // Regular contacts
        const emailGroups = groupBy(nonTeachers, 'email');
        for (const [email, group] of Object.entries(emailGroups)) {
          if (group.length > 1) {
            duplicates.push({
              value: email,
              type: 'contact_email',
              severity: 'warning',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Contact',
                name: `${c.first_name} ${c.last_name}`,
                email: c.email,
                voyadoId: c.voyado_id,
              })),
            });
          }
        }

        // Teachers
        const teacherEmailGroups = groupBy(teachers, 'email');
        for (const [email, group] of Object.entries(teacherEmailGroups)) {
          if (group.length > 1) {
            duplicates.push({
              value: email,
              type: 'teacher_email',
              severity: 'warning',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Teacher',
                name: `${c.first_name} ${c.last_name}`,
                email: c.email,
                voyadoId: c.voyado_id,
              })),
            });
          }
        }
      }

      // 4. Duplicate key IDs (critical errors)
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('id, name, bc_customer_number, voyado_id, norce_code, sitoo_customer_number');

      if (allCustomers) {
        // BC numbers
        const bcGroups = groupBy(allCustomers, 'bc_customer_number');
        for (const [bc, group] of Object.entries(bcGroups)) {
          if (bc && group.length > 1) {
            duplicates.push({
              value: bc,
              type: 'bc_number',
              severity: 'error',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Customer',
                name: c.name,
                bcNumber: c.bc_customer_number,
              })),
            });
          }
        }

        // Norce codes
        const norceGroups = groupBy(allCustomers.filter(c => c.norce_code), 'norce_code');
        for (const [code, group] of Object.entries(norceGroups)) {
          if (code && group.length > 1) {
            duplicates.push({
              value: code,
              type: 'norce_code',
              severity: 'error',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Customer',
                name: c.name,
                norceCode: c.norce_code || undefined,
              })),
            });
          }
        }

        // Sitoo numbers
        const sitooGroups = groupBy(allCustomers.filter(c => c.sitoo_customer_number), 'sitoo_customer_number');
        for (const [num, group] of Object.entries(sitooGroups)) {
          if (num && group.length > 1) {
            duplicates.push({
              value: num,
              type: 'sitoo_number',
              severity: 'error',
              records: group.map(c => ({
                id: c.id,
                entityType: 'Customer',
                name: c.name,
                sitooNumber: c.sitoo_customer_number || undefined,
              })),
            });
          }
        }
      }

      // Voyado ID duplicates (contacts)
      if (contacts) {
        const voyadoGroups = groupBy(contacts, 'voyado_id');
        for (const [vid, group] of Object.entries(voyadoGroups)) {
          if (vid && group.length > 1) {
            duplicates.push({
              value: vid,
              type: 'voyado_id',
              severity: 'error',
              records: group.map(c => ({
                id: c.id,
                entityType: c.is_teacher ? 'Teacher' : 'Contact',
                name: `${c.first_name} ${c.last_name}`,
                voyadoId: c.voyado_id,
              })),
            });
          }
        }
      }

      // 5. Anomalies: Schools without payers
      const { data: schoolsNoPayer } = await supabase
        .from('customers')
        .select('id, name')
        .eq('customer_category', 'Skola')
        .is('payer_customer_id', null);

      if (schoolsNoPayer && schoolsNoPayer.length > 0) {
        anomalies.push({
          type: 'school_no_payer',
          severity: 'warning',
          records: schoolsNoPayer.map(s => ({
            id: s.id,
            entityType: 'Customer',
            name: s.name,
          })),
        });
      }

      // 6. Anomalies: Teachers without schools
      const { data: teacherContacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .eq('is_teacher', true)
        .is('merged_into_id', null);

      if (teacherContacts) {
        const { data: assignments } = await supabase
          .from('teacher_school_assignments')
          .select('teacher_contact_id')
          .eq('is_active', true);

        const assignedTeacherIds = new Set((assignments || []).map(a => a.teacher_contact_id));
        const teachersNoSchool = teacherContacts.filter(t => !assignedTeacherIds.has(t.id));

        if (teachersNoSchool.length > 0) {
          anomalies.push({
            type: 'teacher_no_school',
            severity: 'warning',
            records: teachersNoSchool.map(t => ({
              id: t.id,
              entityType: 'Contact',
              name: `${t.first_name} ${t.last_name}`,
            })),
          });
        }
      }

      const criticalIssues = duplicates.filter(d => d.severity === 'error').length;
      const warnings = duplicates.filter(d => d.severity === 'warning').length + anomalies.length;

      setReport({
        duplicates,
        anomalies,
        summary: {
          totalDuplicateGroups: duplicates.length,
          totalAnomalies: anomalies.reduce((acc, a) => acc + a.records.length, 0),
          criticalIssues,
          warnings,
        },
        scannedAt: new Date(),
      });
    } catch (error) {
      console.error('Data quality scan failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchDuplicates = async (query: string) => {
    if (!query.trim()) return [];

    const results: DuplicateGroup[] = [];
    const searchTerm = query.toLowerCase();

    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, bc_customer_number, voyado_id, norce_code, sitoo_customer_number')
      .or(`name.ilike.%${query}%,bc_customer_number.ilike.%${query}%,voyado_id.ilike.%${query}%`);

    if (customers) {
      const nameGroups = groupBy(customers, 'name');
      for (const [name, group] of Object.entries(nameGroups)) {
        if (name.toLowerCase().includes(searchTerm) && group.length > 1) {
          results.push({
            value: name,
            type: 'customer_name',
            severity: 'warning',
            records: group.map(c => ({
              id: c.id,
              entityType: 'Customer',
              name: c.name,
              bcNumber: c.bc_customer_number,
              voyadoId: c.voyado_id || undefined,
            })),
          });
        }
      }
    }

    // Search contacts
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, voyado_id, is_teacher')
      .is('merged_into_id', null)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`);

    if (contacts) {
      const emailGroups = groupBy(contacts, 'email');
      for (const [email, group] of Object.entries(emailGroups)) {
        if (email.toLowerCase().includes(searchTerm) && group.length > 1) {
          results.push({
            value: email,
            type: 'contact_email',
            severity: 'warning',
            records: group.map(c => ({
              id: c.id,
              entityType: c.is_teacher ? 'Teacher' : 'Contact',
              name: `${c.first_name} ${c.last_name}`,
              email: c.email,
              voyadoId: c.voyado_id,
            })),
          });
        }
      }
    }

    return results;
  };

  return { loading, report, runScan, searchDuplicates };
}

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const value = String(item[key] || '');
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}
