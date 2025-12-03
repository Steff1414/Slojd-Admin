import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { ShoppingCart, User, ChevronDown, ChevronUp, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  category_name: string;
  main_category: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

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
  const [orderItems, setOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
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

  const fetchOrderItems = async (orderId: string) => {
    if (orderItems[orderId]) return;
    
    setLoadingItems(prev => new Set(prev).add(orderId));
    
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
      .order('main_category');
    
    setOrderItems(prev => ({ ...prev, [orderId]: (data || []) as OrderItem[] }));
    setLoadingItems(prev => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
  };

  const toggleOrder = async (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      await fetchOrderItems(orderId);
    }
    setExpandedOrders(newExpanded);
  };

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
      {orders.map((order) => {
        const isExpanded = expandedOrders.has(order.id);
        const isLoadingItems = loadingItems.has(order.id);
        const items = orderItems[order.id] || [];
        
        return (
          <div
            key={order.id}
            className="rounded-lg border bg-card overflow-hidden"
          >
            {/* Order Header - Clickable */}
            <button
              onClick={() => toggleOrder(order.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
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
                    <span className="text-sm text-primary flex items-center gap-1 mt-1">
                      <User className="h-3 w-3" />
                      Köpare: {order.buyer_contact.first_name} {order.buyer_contact.last_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.total_amount)}</p>
                  <Badge variant={order.status === 'completed' ? 'success' : 'secondary'}>
                    {order.status === 'completed' ? 'Slutförd' : 'Pågående'}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </div>
              </div>
            </button>
            
            {/* Order Items - Expandable */}
            {isExpanded && (
              <div className="border-t bg-muted/30 p-4">
                {isLoadingItems ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Inga orderrader</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg bg-background",
                          item.product_id === 'FRAKT-001' && "bg-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded flex items-center justify-center",
                            item.product_id === 'FRAKT-001' 
                              ? "bg-muted-foreground/10" 
                              : "bg-primary/10"
                          )}>
                            {item.product_id === 'FRAKT-001' ? (
                              <Truck className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Package className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.product_id !== 'FRAKT-001' && (
                                <>
                                  {item.main_category} • {item.category_name} • 
                                </>
                              )}
                              {' '}{item.quantity} st × {formatCurrency(item.unit_price)}
                            </p>
                          </div>
                        </div>
                        <p className="font-medium">{formatCurrency(item.line_total)}</p>
                      </div>
                    ))}
                    
                    {/* Total */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t">
                      <p className="font-medium text-muted-foreground">Totalt</p>
                      <p className="font-bold text-lg">{formatCurrency(order.total_amount)}</p>
                    </div>
                  </div>
                )}
                
                {/* Link to buyer if showing on customer view */}
                {showBuyer && order.buyer_contact && (
                  <Link 
                    to={`/contacts/${order.buyer_contact.id}`}
                    className="inline-flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <User className="h-4 w-4" />
                    Visa köpare: {order.buyer_contact.first_name} {order.buyer_contact.last_name}
                  </Link>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
