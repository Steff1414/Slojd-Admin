import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ShoppingCart } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string | null;
  created_at: string;
  customer?: { name: string };
  buyer_contact?: { first_name: string; last_name: string };
}

interface OrdersTabProps {
  customerId?: string;
  contactId?: string;
  accountId?: string;
}

export function OrdersTab({ customerId, contactId, accountId }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:customer_id (name),
          buyer_contact:buyer_contact_id (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }
      if (contactId) {
        query = query.eq('buyer_contact_id', contactId);
      }
      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data } = await query.limit(20);
      setOrders((data || []) as Order[]);
      setLoading(false);
    }

    fetchOrders();
  }, [customerId, contactId, accountId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Inga ordrar hittades</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-4 rounded-lg border bg-card"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium font-mono">{order.order_number}</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(order.created_at), 'PPP', { locale: sv })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
            <Badge variant={order.status === 'completed' ? 'success' : 'secondary'}>
              {order.status === 'completed' ? 'Slutförd' : 'Pågående'}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}
