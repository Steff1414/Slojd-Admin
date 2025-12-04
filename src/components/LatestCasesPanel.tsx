import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/types/database';
import { Case, CaseStatus, CASE_STATUS_LABELS } from '@/types/cases';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { MessageSquarePlus, Ticket, Plus, ArrowRight } from 'lucide-react';
import { CreateCaseModal } from './CreateCaseModal';
import { CaseDetailModal } from './CaseDetailModal';

interface LatestCasesPanelProps {
  contact: Contact;
  customerId?: string | null;
  onUpdate?: () => void;
}

export function LatestCasesPanel({ contact, customerId, onUpdate }: LatestCasesPanelProps) {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    fetchCases();
  }, [contact.id]);

  const fetchCases = async () => {
    const { data } = await supabase
      .from('cases')
      .select('*')
      .eq('contact_id', contact.id)
      .order('updated_at', { ascending: false })
      .limit(5);
    
    setCases((data || []) as Case[]);
    setLoading(false);
  };

  const getStatusBadge = (status: CaseStatus) => {
    const variants: Record<CaseStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      OPEN: 'destructive',
      PENDING: 'secondary',
      RESOLVED: 'default',
      CLOSED: 'outline',
    };
    return <Badge variant={variants[status]} className="text-xs">{CASE_STATUS_LABELS[status]}</Badge>;
  };

  const openCases = cases.filter(c => c.status === 'OPEN' || c.status === 'PENDING');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" />
                Senaste ärenden
              </CardTitle>
              <CardDescription>
                {openCases.length > 0 ? (
                  <span className="text-destructive font-medium">{openCases.length} öppna ärenden</span>
                ) : (
                  'Inga öppna ärenden'
                )}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCreateModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Skapa ärende
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <MessageSquarePlus className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Inga ärenden</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{c.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      Uppdaterad {format(new Date(c.updated_at), 'd MMM HH:mm', { locale: sv })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {getStatusBadge(c.status)}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateCaseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        contact={contact}
        customerId={customerId}
        onSuccess={() => {
          fetchCases();
          onUpdate?.();
        }}
      />

      {selectedCase && (
        <CaseDetailModal
          open={!!selectedCase}
          onOpenChange={(open) => !open && setSelectedCase(null)}
          caseData={selectedCase}
          contact={contact}
          onUpdate={() => {
            fetchCases();
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
