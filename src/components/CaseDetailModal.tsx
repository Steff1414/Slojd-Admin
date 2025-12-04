import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/lib/auth';
import { Contact, Order } from '@/types/database';
import { 
  Case, 
  CaseMessage, 
  CaseStatus,
  Shipment,
  CASE_STATUS_LABELS, 
  CASE_PRIORITY_LABELS, 
  CASE_CHANNEL_LABELS,
  SHIPMENT_STATUS_LABELS
} from '@/types/cases';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { 
  Send, 
  Loader2, 
  MessageSquare, 
  ArrowDownLeft, 
  ArrowUpRight, 
  StickyNote,
  ShoppingCart,
  Package,
  ExternalLink,
  User
} from 'lucide-react';

interface CaseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: Case;
  contact: Contact;
  onUpdate: () => void;
}

export function CaseDetailModal({ open, onOpenChange, caseData, contact, onUpdate }: CaseDetailModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<CaseMessage[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');
  const [status, setStatus] = useState<CaseStatus>(caseData.status);
  const [sending, setSending] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, caseData.id]);

  const fetchData = async () => {
    setLoading(true);

    // Fetch messages
    const { data: messagesData } = await supabase
      .from('case_messages')
      .select('*')
      .eq('case_id', caseData.id)
      .order('created_at', { ascending: true });
    
    setMessages((messagesData || []) as CaseMessage[]);

    // Fetch order if linked
    if (caseData.order_id) {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('id', caseData.order_id)
        .single();
      
      setOrder(orderData as Order | null);

      // Fetch shipment for order
      const { data: shipmentData } = await supabase
        .from('shipments')
        .select('*')
        .eq('order_id', caseData.order_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setShipment(shipmentData as Shipment | null);
    }

    setLoading(false);
  };

  const handleStatusChange = async (newStatus: CaseStatus) => {
    const before = { ...caseData, status };
    
    const { error } = await supabase
      .from('cases')
      .update({ 
        status: newStatus,
        closed_at: newStatus === 'CLOSED' ? new Date().toISOString() : null
      })
      .eq('id', caseData.id);

    if (error) {
      toast({ title: 'Kunde inte uppdatera status', variant: 'destructive' });
      return;
    }

    setStatus(newStatus);
    await logAction('case', caseData.id, 'update_status', before, { ...before, status: newStatus });
    onUpdate();
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setSending(true);

    // Create email message
    const { data: emailData, error: emailError } = await supabase
      .from('email_messages')
      .insert({
        contact_id: contact.id,
        to_email: contact.email,
        subject: `Re: ${caseData.subject}`,
        body: replyText.trim(),
        status: 'SENT',
        channel: 'EMAIL',
        category: 'OTHER',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (emailError) {
      toast({ title: 'Kunde inte skicka svar', description: emailError.message, variant: 'destructive' });
      setSending(false);
      return;
    }

    // Create case message linked to email
    const { error: msgError } = await supabase
      .from('case_messages')
      .insert({
        case_id: caseData.id,
        direction: 'OUTBOUND',
        message_type: 'EMAIL',
        email_message_id: emailData.id,
        body: replyText.trim(),
        author_user_id: user?.id || null,
      });

    if (msgError) {
      toast({ title: 'Kunde inte skapa meddelande', variant: 'destructive' });
      setSending(false);
      return;
    }

    // Update case status to PENDING if OPEN
    if (status === 'OPEN') {
      await handleStatusChange('PENDING');
    }

    await logAction('case', caseData.id, 'reply', null, { reply: replyText.trim() });

    toast({ title: 'Svar skickat', description: `E-post skickat till ${contact.email}` });
    setReplyText('');
    setSending(false);
    fetchData();
    onUpdate();
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    setAddingNote(true);

    const { error } = await supabase
      .from('case_messages')
      .insert({
        case_id: caseData.id,
        direction: 'INTERNAL_NOTE',
        message_type: 'NOTE',
        body: noteText.trim(),
        author_user_id: user?.id || null,
      });

    if (error) {
      toast({ title: 'Kunde inte lägga till anteckning', variant: 'destructive' });
      setAddingNote(false);
      return;
    }

    toast({ title: 'Anteckning tillagd' });
    setNoteText('');
    setAddingNote(false);
    fetchData();
  };

  const getStatusBadge = (s: CaseStatus) => {
    const variants: Record<CaseStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      OPEN: 'destructive',
      PENDING: 'secondary',
      RESOLVED: 'default',
      CLOSED: 'outline',
    };
    return <Badge variant={variants[s]}>{CASE_STATUS_LABELS[s]}</Badge>;
  };

  const getMessageIcon = (direction: CaseMessage['direction']) => {
    switch (direction) {
      case 'INBOUND':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      case 'OUTBOUND':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'INTERNAL_NOTE':
        return <StickyNote className="h-4 w-4 text-amber-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-xl">{caseData.subject}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {getStatusBadge(status)}
                {caseData.priority && (
                  <Badge variant="outline">{CASE_PRIORITY_LABELS[caseData.priority]}</Badge>
                )}
                <Badge variant="outline">{CASE_CHANNEL_LABELS[caseData.channel]}</Badge>
                <span className="text-sm text-muted-foreground">
                  Skapad {format(new Date(caseData.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                </span>
              </div>
            </div>
            <Select value={status} onValueChange={(v) => handleStatusChange(v as CaseStatus)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order and Shipment info */}
          {(order || shipment) && (
            <div className="p-4 bg-muted/30 rounded-lg space-y-3">
              {order && (
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Order #{order.order_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.total_amount.toFixed(2)} kr · {format(new Date(order.created_at!), 'd MMM yyyy', { locale: sv })}
                    </p>
                  </div>
                </div>
              )}
              {shipment && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{shipment.carrier} - {SHIPMENT_STATUS_LABELS[shipment.status]}</p>
                      <p className="text-sm text-muted-foreground">
                        Spårningsnummer: {shipment.tracking_number || shipment.shipment_number}
                      </p>
                    </div>
                  </div>
                  {shipment.tracking_url && (
                    <a href={shipment.tracking_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Spåra
                      </Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Message thread */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Konversation ({messages.length})
            </h3>
            
            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Inga meddelanden ännu</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`p-3 rounded-lg ${
                      msg.direction === 'INBOUND' 
                        ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900' 
                        : msg.direction === 'OUTBOUND'
                        ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                        : 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getMessageIcon(msg.direction)}
                      <span className="text-sm font-medium">
                        {msg.direction === 'INBOUND' ? `${contact.first_name} ${contact.last_name}` : 
                         msg.direction === 'OUTBOUND' ? 'Kundtjänst' : 'Intern anteckning'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.created_at), 'd MMM HH:mm', { locale: sv })}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Reply section */}
          <div className="space-y-3">
            <h3 className="font-medium">Svara via e-post</h3>
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Skriv svar till ${contact.email}...`}
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="gap-2">
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Skicka svar
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Internal note section */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <StickyNote className="h-4 w-4 text-amber-500" />
              Intern anteckning
            </h3>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Lägg till intern anteckning (syns ej för kund)..."
              rows={2}
            />
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleAddNote} disabled={addingNote || !noteText.trim()} className="gap-2">
                {addingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <StickyNote className="h-4 w-4" />
                )}
                Lägg till anteckning
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
