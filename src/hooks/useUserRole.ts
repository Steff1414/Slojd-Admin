import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

export function useUserRole() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRole() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!data);
      setLoading(false);
    }

    checkRole();
  }, [user]);

  return { isAdmin, loading };
}
