import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contact, Order } from '@/types/database';
import { Shipment, ShipmentStatus, SHIPMENT_STATUS_LABELS } from '@/types/cases';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Package, ExternalLink, Truck, Check, AlertTriangle } from 'lucide-react';

interface LatestShipmentPanelProps {
  contact: Contact;
}

interface ShipmentWithOrder extends Shipment {
  order: Order;
}

export function LatestShipmentPanel({ contact }: LatestShipmentPanelProps) {
  const [shipments, setShipments] = useState<ShipmentWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShipments();
  }, [contact.id]);

  const fetchShipments = async () => {
    // Get orders for this contact
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_contact_id', contact.id);
    
    if (!orders || orders.length === 0) {
      setLoading(false);
      return;
    }

    const orderIds = orders.map(o => o.id);

    // Get shipments for those orders
    const { data: shipmentsData } = await supabase
      .from('shipments')
      .select(`
        *,
        order:order_id (*)
      `)
      .in('order_id', orderIds)
      .order('created_at', { ascending: false })
      .limit(3);
    
    setShipments((shipmentsData || []) as ShipmentWithOrder[]);
    setLoading(false);
  };

  const getStatusIcon = (status: ShipmentStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'IN_TRANSIT':
        return <Truck className="h-4 w-4 text-blue-500" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    const variants: Record<ShipmentStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      DELIVERED: 'default',
      IN_TRANSIT: 'secondary',
      CREATED: 'outline',
      FAILED: 'destructive',
    };
    return <Badge variant={variants[status]} className="text-xs">{SHIPMENT_STATUS_LABELS[status]}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Senaste leveranser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (shipments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Senaste leveranser
          </CardTitle>
          <CardDescription>Ingen leveranshistorik</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Inga leveranser registrerade för denna kontakt
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          Senaste leveranser
        </CardTitle>
        <CardDescription>Spåra paket och leveransstatus</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="p-3 rounded-lg border border-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(shipment.status)}
                  <span className="font-medium">{shipment.carrier}</span>
                  {getStatusBadge(shipment.status)}
                </div>
                {shipment.tracking_url && (
                  <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="gap-2 h-8">
                      <ExternalLink className="h-3 w-3" />
                      Spåra
                    </Button>
                  </a>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Order #{shipment.order?.order_number}</p>
                <p>Spårningsnummer: {shipment.tracking_number || shipment.shipment_number}</p>
                {shipment.shipped_at && (
                  <p>Skickad: {format(new Date(shipment.shipped_at), 'd MMM yyyy', { locale: sv })}</p>
                )}
                {shipment.delivered_at && (
                  <p>Levererad: {format(new Date(shipment.delivered_at), 'd MMM yyyy', { locale: sv })}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
