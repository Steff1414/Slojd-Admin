import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Contact, EmailMessage, Order } from '@/types/database';
import { Mail, Send, ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { SendEmailModal } from './SendEmailModal';

interface CommunicationTabProps {
  contact: Contact;
  onUpdate: () => void;
}

export function CommunicationTab({ contact, onUpdate }: CommunicationTabProps) {
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  useEffect(() => {
    fetchEmails();
    fetchOrders();
  }, [contact.id]);

  const fetchEmails = async () => {
    const { data } = await supabase
      .from('email_messages')
      .select(`
        *,
        template:template_id (name, template_key)
      `)
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false });
    
    setEmails((data || []) as unknown as EmailMessage[]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('buyer_contact_id', contact.id)
      .order('created_at', { ascending: false });
    
    setOrders((data || []) as Order[]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle2 className="h-3 w-3" />Skickat</Badge>;
      case 'QUEUED':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />I kö</Badge>;
      case 'FAILED':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Misslyckades</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeName = (email: EmailMessage) => {
    if ((email as any).template?.name) {
      return (email as any).template.name;
    }
    return email.type_key || 'Manuell';
  };

  return (
    <div className="space-y-6">
      {/* Header with Send button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            E-postkommunikation
          </h2>
          <p className="text-sm text-muted-foreground">
            {emails.length} {emails.length === 1 ? 'meddelande' : 'meddelanden'} skickade
          </p>
        </div>
        <Button onClick={() => setSendModalOpen(true)} className="gap-2">
          <Send className="h-4 w-4" />
          Skicka e-post
        </Button>
      </div>

      {/* Email History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skickade meddelanden</CardTitle>
          <CardDescription>Historik över all e-postkommunikation med denna kontakt</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Inga meddelanden skickade ännu</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={() => setSendModalOpen(true)}
              >
                <Send className="h-4 w-4" />
                Skicka första meddelandet
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => (
                <Collapsible
                  key={email.id}
                  open={expandedEmail === email.id}
                  onOpenChange={(open) => setExpandedEmail(open ? email.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {expandedEmail === email.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium truncate">{email.subject}</span>
                            {email.related_order_id && (
                              <Badge variant="outline" className="gap-1 text-xs">
                                <ShoppingCart className="h-3 w-3" />
                                Order
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{getTypeName(email)}</span>
                            <span>•</span>
                            <span>
                              {email.sent_at 
                                ? format(new Date(email.sent_at), 'd MMM yyyy HH:mm', { locale: sv })
                                : format(new Date(email.created_at), 'd MMM yyyy HH:mm', { locale: sv })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {getStatusBadge(email.status)}
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-7 mt-2 p-4 bg-muted/30 rounded-lg border border-border space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Till</p>
                        <p className="text-sm">{email.to_email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Ämne</p>
                        <p className="text-sm font-medium">{email.subject}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Innehåll</p>
                        <div 
                          className="text-sm bg-background p-3 rounded border prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body) }}
                        />
                      </div>
                      {email.error_message && (
                        <div className="p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-medium text-destructive">Felmeddelande</p>
                          <p className="text-sm text-destructive/80">{email.error_message}</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Email Modal */}
      <SendEmailModal
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        contact={contact}
        orders={orders}
        onSuccess={() => {
          fetchEmails();
          onUpdate();
        }}
      />
    </div>
  );
}
