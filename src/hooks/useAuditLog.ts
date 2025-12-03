import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import type { Json } from '@/integrations/supabase/types';

export function useAuditLog() {
  const { user } = useAuth();

  const logAction = async (
    entityType: string,
    entityId: string,
    action: string,
    beforeSnapshot?: Json | null,
    afterSnapshot?: Json | null
  ) => {
    try {
      await supabase.from('audit_logs').insert([{
        actor_id: user?.id || null,
        entity_type: entityType,
        entity_id: entityId,
        action,
        before_snapshot: beforeSnapshot || null,
        after_snapshot: afterSnapshot || null,
      }]);
    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  };

  return { logAction };
}
