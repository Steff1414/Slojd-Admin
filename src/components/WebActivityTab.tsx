import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Contact, WebSession, WebEvent, TrackingConsent } from '@/types/database';
import { Globe, Eye, ShoppingCart, Tag, ChevronDown, ChevronRight, Clock, Monitor, Shield, ShieldOff } from 'lucide-react';
import { format, subDays, isAfter } from 'date-fns';
import { sv } from 'date-fns/locale';

interface WebActivityTabProps {
  contact: Contact;
  onUpdate: () => void;
}

export function WebActivityTab({ contact, onUpdate }: WebActivityTabProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [sessions, setSessions] = useState<WebSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [consent, setConsent] = useState<TrackingConsent>((contact as any).web_tracking_consent || 'UNKNOWN');
  const [updatingConsent, setUpdatingConsent] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, [contact.id]);

  const fetchSessions = async () => {
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
    
    const { data: sessionsData } = await supabase
      .from('web_sessions')
      .select('*')
      .eq('contact_id', contact.id)
      .gte('started_at', thirtyDaysAgo)
      .order('started_at', { ascending: false })
      .limit(10);

    if (sessionsData) {
      // Fetch events for each session
      const sessionsWithEvents = await Promise.all(
        sessionsData.map(async (session) => {
          const { data: eventsData } = await supabase
            .from('web_events')
            .select('*')
            .eq('session_id', session.id)
            .order('occurred_at', { ascending: true });
          
          return {
            ...session,
            events: eventsData || [],
          };
        })
      );
      
      setSessions(sessionsWithEvents as WebSession[]);
    }
    
    setLoading(false);
  };

  const handleConsentChange = async (granted: boolean) => {
    setUpdatingConsent(true);
    const newConsent: TrackingConsent = granted ? 'GRANTED' : 'DENIED';
    const beforeSnapshot = { web_tracking_consent: consent };

    const { error } = await supabase
      .from('contacts')
      .update({
        web_tracking_consent: newConsent,
        consent_updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id);

    if (error) {
      toast({ title: 'Kunde inte uppdatera samtycke', description: error.message, variant: 'destructive' });
    } else {
      setConsent(newConsent);
      await logAction('contact', contact.id, 'consent_update', beforeSnapshot, { web_tracking_consent: newConsent });
      toast({ title: 'Samtycke uppdaterat' });
      onUpdate();
    }
    
    setUpdatingConsent(false);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'PAGE_VIEW':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'PRODUCT_VIEW':
        return <Tag className="h-4 w-4 text-purple-500" />;
      case 'CATEGORY_VIEW':
        return <Globe className="h-4 w-4 text-green-500" />;
      case 'ADD_TO_CART':
        return <ShoppingCart className="h-4 w-4 text-orange-500" />;
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventTypeName = (eventType: string) => {
    switch (eventType) {
      case 'PAGE_VIEW': return 'Sidvisning';
      case 'PRODUCT_VIEW': return 'Produktvisning';
      case 'CATEGORY_VIEW': return 'Kategorivy';
      case 'ADD_TO_CART': return 'Lagt i varukorg';
      case 'CHECKOUT_START': return 'Påbörjad checkout';
      default: return eventType;
    }
  };

  const getSessionDuration = (session: WebSession) => {
    if (!session.ended_at) return 'Pågående';
    const start = new Date(session.started_at);
    const end = new Date(session.ended_at);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return '< 1 min';
    if (diffMins < 60) return `${diffMins} min`;
    return `${Math.round(diffMins / 60)} h ${diffMins % 60} min`;
  };

  const consentGranted = consent === 'GRANTED';

  return (
    <div className="space-y-6">
      {/* Consent Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {consentGranted ? (
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <ShieldOff className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-base">Spårningssamtycke</CardTitle>
                <CardDescription>
                  {consentGranted 
                    ? 'Webbaktivitet spåras för denna kontakt' 
                    : 'Webbaktivitet spåras inte'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={consentGranted ? 'default' : 'secondary'}>
                {consent === 'GRANTED' ? 'Aktivt' : consent === 'DENIED' ? 'Avslaget' : 'Okänt'}
              </Badge>
              <div className="flex items-center gap-2">
                <Switch
                  id="consent"
                  checked={consentGranted}
                  onCheckedChange={handleConsentChange}
                  disabled={updatingConsent}
                />
                <Label htmlFor="consent" className="text-sm">
                  {consentGranted ? 'På' : 'Av'}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-5 w-5 text-primary" />
            Senaste sessioner (30 dagar)
          </CardTitle>
          <CardDescription>
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessioner'} registrerade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !consentGranted ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldOff className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Spårning är inte aktiverat för denna kontakt</p>
              <p className="text-sm mt-2">Aktivera samtycke ovan för att börja samla in webbaktivitet</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Ingen webbaktivitet registrerad</p>
              <p className="text-sm mt-2">Aktivitet visas här när kontakten besöker webbplatsen</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <Collapsible
                  key={session.id}
                  open={expandedSession === session.id}
                  onOpenChange={(open) => setExpandedSession(open ? session.id : null)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-border">
                      <div className="flex items-center gap-3">
                        {expandedSession === session.id ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {format(new Date(session.started_at), 'd MMM yyyy HH:mm', { locale: sv })}
                            </span>
                            {!session.ended_at && (
                              <Badge variant="default" className="text-xs">Pågående</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.events?.length || 0} händelser • {getSessionDuration(session)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Monitor className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">
                          {session.user_agent?.split(' ')[0] || 'Okänd enhet'}
                        </span>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-7 mt-2 space-y-1">
                      {session.events && session.events.length > 0 ? (
                        session.events.map((event, idx) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 text-sm bg-muted/30 rounded"
                          >
                            <span className="text-xs text-muted-foreground w-12">
                              {format(new Date(event.occurred_at), 'HH:mm:ss')}
                            </span>
                            {getEventIcon(event.event_type)}
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{getEventTypeName(event.event_type)}</span>
                              {event.product_name && (
                                <span className="text-muted-foreground ml-2">
                                  {event.product_name}
                                </span>
                              )}
                              {event.category_name && !event.product_name && (
                                <span className="text-muted-foreground ml-2">
                                  {event.category_name}
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {event.url}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground p-2">Inga händelser registrerade</p>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
