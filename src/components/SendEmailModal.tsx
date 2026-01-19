import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Contact, EmailTemplate, Order } from '@/types/database';
import { Send, Eye, Loader2 } from 'lucide-react';

interface SendEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: Contact;
  orders: Order[];
  onSuccess: () => void;
}

export function SendEmailModal({ open, onOpenChange, contact, orders, onSuccess }: SendEmailModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    setTemplates((data || []) as EmailTemplate[]);
  };

  const resolvePlaceholders = (text: string, order?: Order) => {
    let resolved = text
      .replace(/\{\{firstName\}\}/g, contact.first_name)
      .replace(/\{\{lastName\}\}/g, contact.last_name)
      .replace(/\{\{email\}\}/g, contact.email);

    if (order) {
      resolved = resolved
        .replace(/\{\{orderNumber\}\}/g, order.order_number)
        .replace(/\{\{orderTotal\}\}/g, order.total_amount.toFixed(2))
        .replace(/\{\{basketLink\}\}/g, `https://example.com/cart/${order.id}`);
    } else {
      resolved = resolved
        .replace(/\{\{orderNumber\}\}/g, '[Ordernummer]')
        .replace(/\{\{orderTotal\}\}/g, '[Summa]')
        .replace(/\{\{basketLink\}\}/g, '[Varukorglänk]');
    }

    return resolved;
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      const order = orders.find(o => o.id === selectedOrderId);
      setSubject(resolvePlaceholders(template.subject_template, order));
      setBody(resolvePlaceholders(template.body_template, order));
    }
  };

  const handleOrderChange = (orderId: string) => {
    setSelectedOrderId(orderId);
    const template = templates.find(t => t.id === selectedTemplateId);
    const order = orders.find(o => o.id === orderId);
    if (template) {
      setSubject(resolvePlaceholders(template.subject_template, order));
      setBody(resolvePlaceholders(template.body_template, order));
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      toast({ title: 'Fyll i ämne och innehåll', variant: 'destructive' });
      return;
    }

    setSending(true);
    const template = templates.find(t => t.id === selectedTemplateId);

    const { data, error } = await supabase
      .from('email_messages')
      .insert({
        contact_id: contact.id,
        template_id: selectedTemplateId || null,
        type_key: template?.template_key || 'MANUAL',
        to_email: contact.email,
        subject: subject.trim(),
        body: body.trim(),
        status: 'SENT',
        related_order_id: selectedOrderId || null,
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skicka e-post', description: error.message, variant: 'destructive' });
      setSending(false);
      return;
    }

    await logAction('email_message', data.id, 'create', null, data);

    toast({ title: 'E-post skickat', description: `Meddelande skickat till ${contact.email}` });
    setSending(false);
    onOpenChange(false);
    resetForm();
    onSuccess();
  };

  const resetForm = () => {
    setSelectedTemplateId('');
    setSelectedOrderId('');
    setSubject('');
    setBody('');
    setShowPreview(false);
  };

  const isOrderRelatedTemplate = (templateKey?: string) => {
    if (!templateKey) return false;
    return ['ORDER_RECEIVED', 'ORDER_CONFIRMED', 'ORDER_DELIVERED', 'PURCHASE_THANK_YOU', 'RECEIPT'].includes(templateKey);
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Skicka e-post till {contact.first_name} {contact.last_name}</DialogTitle>
          <DialogDescription>
            Välj en mall eller skriv ett manuellt meddelande
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>E-postmall</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Välj mall..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate?.description && (
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            )}
          </div>

          {/* Order Selection (if relevant) */}
          {selectedTemplate && isOrderRelatedTemplate(selectedTemplate.template_key) && (
            <div className="space-y-2">
              <Label>Relaterad order</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.length === 0 ? (
                    <SelectItem value="_none" disabled>Inga ordrar hittades</SelectItem>
                  ) : (
                    orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        #{order.order_number} - {order.total_amount.toFixed(2)} kr
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Ämne</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Skriv ämne..."
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">Innehåll</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="gap-1"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Redigera' : 'Förhandsgranska'}
              </Button>
            </div>
            {showPreview ? (
              <div 
                className="min-h-[200px] p-4 border rounded-lg bg-muted/30 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body) }}
              />
            ) : (
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Skriv meddelande (HTML stöds)..."
                rows={10}
                className="font-mono text-sm"
              />
            )}
          </div>

          {/* Recipient info */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Meddelandet skickas till: <strong>{contact.email}</strong>
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Avbryt
          </Button>
          <Button onClick={handleSend} disabled={sending || !subject.trim() || !body.trim()} className="gap-2">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Skickar...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Skicka
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
