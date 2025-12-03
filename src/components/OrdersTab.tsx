import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ShoppingCart, User } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string | null;
  created_at: string;
  customer?: { name: string };
  buyer_contact?: { id: string; first_name: string; last_name: string } | null;
}

interface OrdersTabProps {
  customerId?: string;
  contactId?: string;
  accountId?: string;
  showBuyer?: boolean;
}

export function OrdersTab({ customerId, contactId, accountId, showBuyer = false }: OrdersTabProps) {
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
          buyer_contact:buyer_contact_id (id, first_name, last_name)
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
              {showBuyer && order.buyer_contact && (
                <Link 
                  to={`/contacts/${order.buyer_contact.id}`}
                  className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                >
                  <User className="h-3 w-3" />
                  Köpare: {order.buyer_contact.first_name} {order.buyer_contact.last_name}
                </Link>
              )}
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
