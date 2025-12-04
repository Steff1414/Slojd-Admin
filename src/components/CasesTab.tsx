import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Contact } from '@/types/database';
import { 
  Case, 
  CaseMessage, 
  CaseStatus, 
  CASE_STATUS_LABELS, 
  CASE_PRIORITY_LABELS, 
  CASE_CHANNEL_LABELS 
} from '@/types/cases';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { Ticket, Plus, ArrowRight, MessageSquare } from 'lucide-react';
import { CreateCaseModal } from './CreateCaseModal';
import { CaseDetailModal } from './CaseDetailModal';

interface CasesTabProps {
  contact: Contact;
  onUpdate?: () => void;
}

interface CaseWithStats extends Case {
  messageCount: number;
  lastOutboundDate: string | null;
}

export function CasesTab({ contact, onUpdate }: CasesTabProps) {
  const [cases, setCases] = useState<CaseWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    fetchCases();
  }, [contact.id]);

  const fetchCases = async () => {
    setLoading(true);

    // Fetch cases
    const { data: casesData } = await supabase
      .from('cases')
      .select('*')
      .eq('contact_id', contact.id)
      .order('created_at', { ascending: false });
    
    if (!casesData || casesData.length === 0) {
      setCases([]);
      setLoading(false);
      return;
    }

    // Fetch message stats for each case
    const caseIds = casesData.map(c => c.id);
    const { data: messagesData } = await supabase
      .from('case_messages')
      .select('case_id, direction, created_at')
      .in('case_id', caseIds)
      .order('created_at', { ascending: false });

    // Process stats
    const casesWithStats: CaseWithStats[] = casesData.map((c) => {
      const caseMessages = (messagesData || []).filter(m => m.case_id === c.id);
      const outboundMessages = caseMessages.filter(m => m.direction === 'OUTBOUND');
      
      return {
        ...c,
        messageCount: caseMessages.length,
        lastOutboundDate: outboundMessages.length > 0 ? outboundMessages[0].created_at : null,
      } as CaseWithStats;
    });

    setCases(casesWithStats);
    setLoading(false);
  };

  const getStatusBadge = (status: CaseStatus) => {
    const variants: Record<CaseStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      OPEN: 'destructive',
      PENDING: 'secondary',
      RESOLVED: 'default',
      CLOSED: 'outline',
    };
    return <Badge variant={variants[status]}>{CASE_STATUS_LABELS[status]}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Ärenden ({cases.length})
              </CardTitle>
              <CardDescription>Alla ärenden för denna kontakt</CardDescription>
            </div>
            <Button onClick={() => setCreateModalOpen(true)} className="gap-2">
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
            <div className="text-center py-12 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Inga ärenden</p>
              <Button 
                variant="outline" 
                className="mt-4 gap-2"
                onClick={() => setCreateModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Skapa första ärendet
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ämne</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Kanal</TableHead>
                  <TableHead>Meddelanden</TableHead>
                  <TableHead>Skapat</TableHead>
                  <TableHead>Senaste svar</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow 
                    key={c.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedCase(c)}
                  >
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {c.subject}
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>{CASE_CHANNEL_LABELS[c.channel]}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        {c.messageCount}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(c.created_at), 'd MMM yyyy', { locale: sv })}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {c.lastOutboundDate 
                        ? format(new Date(c.lastOutboundDate), 'd MMM HH:mm', { locale: sv })
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateCaseModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        contact={contact}
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
