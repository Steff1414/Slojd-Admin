import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/lib/auth';
import { Contact, Order } from '@/types/database';
import { CaseChannel, CasePriority, CASE_CHANNEL_LABELS, CASE_PRIORITY_LABELS } from '@/types/cases';
import { Loader2, Plus } from 'lucide-react';

interface CreateCaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  customerId?: string | null;
  orderId?: string | null;
  initialDescription?: string;
  onSuccess: () => void;
}

export function CreateCaseModal({ 
  open, 
  onOpenChange, 
  contact, 
  customerId,
  orderId: initialOrderId,
  initialDescription = '',
  onSuccess 
}: CreateCaseModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { user } = useAuth();
  
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState(initialDescription);
  const [channel, setChannel] = useState<CaseChannel>('EMAIL');
  const [priority, setPriority] = useState<CasePriority>('NORMAL');
  const [orderId, setOrderId] = useState<string>(initialOrderId || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchOrders();
      setDescription(initialDescription);
      if (initialOrderId) setOrderId(initialOrderId);
    }
  }, [open, contact.id, initialDescription, initialOrderId]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_contact_id', contact.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    setOrders((data || []) as Order[]);
  };

  const handleCreate = async () => {
    if (!subject.trim()) {
      toast({ title: 'Ange ett ämne', variant: 'destructive' });
      return;
    }

    setSaving(true);

    const { data, error } = await supabase
      .from('cases')
      .insert({
        contact_id: contact.id,
        customer_id: customerId || null,
        order_id: orderId || null,
        subject: subject.trim(),
        description: description.trim() || null,
        channel,
        priority,
        status: 'OPEN',
        created_by_user_id: user?.id || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skapa ärende', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // If there's a description, create the initial message
    if (description.trim()) {
      await supabase.from('case_messages').insert({
        case_id: data.id,
        direction: 'INBOUND',
        message_type: channel === 'EMAIL' ? 'EMAIL' : 'OTHER',
        body: description.trim(),
      });
    }

    await logAction('case', data.id, 'create', null, data);

    toast({ title: 'Ärende skapat', description: `Ärende "${subject}" har skapats` });
    setSaving(false);
    onOpenChange(false);
    resetForm();
    onSuccess();
  };

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setChannel('EMAIL');
    setPriority('NORMAL');
    setOrderId('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Skapa ärende</DialogTitle>
          <DialogDescription>
            Skapa ett nytt ärende för {contact.first_name} {contact.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Ämne *</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Beskriv ärendet kortfattat..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beskrivning</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaljer om kundens problem..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Kanal</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as CaseChannel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CASE_CHANNEL_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prioritet</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as CasePriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CASE_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {orders.length > 0 && (
            <div className="space-y-2">
              <Label>Relaterad order (valfritt)</Label>
              <Select value={orderId || "_none"} onValueChange={(v) => setOrderId(v === "_none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj order..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Ingen order</SelectItem>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      #{order.order_number} - {order.total_amount.toFixed(2)} kr
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Avbryt
          </Button>
          <Button onClick={handleCreate} disabled={saving || !subject.trim()} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Skapar...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Skapa ärende
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
