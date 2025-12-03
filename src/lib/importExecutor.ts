import type { ParsedImportData, ImportSummary } from '@/types/import';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export async function executeImport(
  data: ParsedImportData,
  userId: string | null
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    customersCreated: 0,
    customersUpdated: 0,
    contactsCreated: 0,
    contactsUpdated: 0,
    payerLinksCreated: 0,
    payerLinksUpdated: 0,
    payerLinksDeleted: 0,
  };

  // Step 1: Process customers
  const bcToId = new Map<string, string>();
  
  // Fetch existing customers
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('id, bc_customer_number');
  
  existingCustomers?.forEach((c) => {
    bcToId.set(c.bc_customer_number, c.id);
  });

  for (const row of data.customers) {
    if (row.action === 'CREATE') {
      const bcNumber = row.bcCustomerNumber || `BC-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      const { data: created, error } = await supabase
        .from('customers')
        .insert({
          bc_customer_number: bcNumber,
          name: row.name,
          customer_category: row.customerCategory as any,
          customer_type_group: row.customerTypeGroup as any || 'B2C',
          voyado_id: row.voyadoId || null,
          norce_code: row.norceCode || null,
          sitoo_customer_number: row.sitooCustomerNumber || null,
          is_active: row.isActive,
        })
        .select()
        .single();

      if (created) {
        bcToId.set(bcNumber, created.id);
        summary.customersCreated++;
        
        await logAudit(userId, 'customer', created.id, 'create', null, created as unknown as Json);
      }
    } else if (row.action === 'UPDATE') {
      const existingId = bcToId.get(row.bcCustomerNumber);
      if (existingId) {
        const { data: before } = await supabase
          .from('customers')
          .select('*')
          .eq('id', existingId)
          .single();

        const { data: updated } = await supabase
          .from('customers')
          .update({
            name: row.name,
            customer_category: row.customerCategory as any,
            customer_type_group: row.customerTypeGroup as any || undefined,
            voyado_id: row.voyadoId || null,
            norce_code: row.norceCode || null,
            sitoo_customer_number: row.sitooCustomerNumber || null,
            is_active: row.isActive,
          })
          .eq('id', existingId)
          .select()
          .single();

        if (updated) {
          summary.customersUpdated++;
          await logAudit(userId, 'customer', existingId, 'update', before as unknown as Json, updated as unknown as Json);
        }
      }
    }
  }

  // Step 2: Process contacts
  const voyadoToId = new Map<string, string>();
  
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('id, voyado_id')
    .is('merged_into_id', null);
  
  existingContacts?.forEach((c) => {
    voyadoToId.set(c.voyado_id, c.id);
  });

  for (const row of data.contacts) {
    if (row.action === 'CREATE') {
      const { data: created, error } = await supabase
        .from('contacts')
        .insert({
          voyado_id: row.voyadoId,
          first_name: row.firstName,
          last_name: row.lastName,
          email: row.email,
          phone: row.phone || null,
          contact_type: row.contactType as any,
          is_teacher: row.isTeacher,
        })
        .select()
        .single();

      if (created) {
        voyadoToId.set(row.voyadoId, created.id);
        summary.contactsCreated++;
        
        await logAudit(userId, 'contact', created.id, 'create', null, created as unknown as Json);

        // Create customer links
        for (const bcNum of row.linkedBcCustomerNumbers) {
          const customerId = bcToId.get(bcNum);
          if (customerId) {
            const relationshipType = row.isTeacher ? 'TeacherAtSchool' : 'Other';
            
            await supabase.from('contact_customer_links').insert({
              contact_id: created.id,
              customer_id: customerId,
              relationship_type: relationshipType,
              is_primary: true,
            });

            // Also create teacher assignment if teacher
            if (row.isTeacher) {
              await supabase.from('teacher_school_assignments').insert({
                teacher_contact_id: created.id,
                school_customer_id: customerId,
                is_active: true,
              });
            }
          }
        }
      }
    } else if (row.action === 'UPDATE') {
      const existingId = voyadoToId.get(row.voyadoId);
      if (existingId) {
        const { data: before } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', existingId)
          .single();

        const { data: updated } = await supabase
          .from('contacts')
          .update({
            first_name: row.firstName,
            last_name: row.lastName,
            email: row.email,
            phone: row.phone || null,
            contact_type: row.contactType as any,
            is_teacher: row.isTeacher,
          })
          .eq('id', existingId)
          .select()
          .single();

        if (updated) {
          summary.contactsUpdated++;
          await logAudit(userId, 'contact', existingId, 'update', before as unknown as Json, updated as unknown as Json);
        }
      }
    }
  }

  // Step 3: Process payer relations
  for (const row of data.payers) {
    const customerId = bcToId.get(row.customerBcNumber);
    const payerId = bcToId.get(row.payerBcNumber);

    if (!customerId) continue;

    if (row.action === 'DELETE') {
      const { data: before } = await supabase
        .from('customers')
        .select('payer_customer_id')
        .eq('id', customerId)
        .single();

      if (before?.payer_customer_id) {
        await supabase
          .from('customers')
          .update({ payer_customer_id: null })
          .eq('id', customerId);

        summary.payerLinksDeleted++;
        await logAudit(userId, 'payer_relation', customerId, 'delete', { payer_id: before.payer_customer_id }, null);
      }
    } else if (payerId) {
      const { data: existing } = await supabase
        .from('customers')
        .select('payer_customer_id')
        .eq('id', customerId)
        .single();

      await supabase
        .from('customers')
        .update({ payer_customer_id: payerId })
        .eq('id', customerId);

      if (existing?.payer_customer_id) {
        summary.payerLinksUpdated++;
        await logAudit(userId, 'payer_relation', customerId, 'update', 
          { payer_id: existing.payer_customer_id }, 
          { payer_id: payerId });
      } else {
        summary.payerLinksCreated++;
        await logAudit(userId, 'payer_relation', customerId, 'create', null, { payer_id: payerId });
      }
    }
  }

  // Log import completion
  await logAudit(userId, 'import', 'batch', 'import_completed', null, summary as unknown as Json);

  return summary;
}

async function logAudit(
  actorId: string | null,
  entityType: string,
  entityId: string,
  action: string,
  before: Json | null,
  after: Json | null
) {
  await supabase.from('audit_logs').insert([{
    actor_id: actorId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    before_snapshot: before,
    after_snapshot: after,
  }]);
}
