import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitMerge, ExternalLink, Users } from 'lucide-react';
import { Contact } from '@/types/database';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface MergeHistoryProps {
  contactId: string;
}

interface MergedContact extends Contact {
  merge_date?: string;
  merged_by?: string;
}

interface AuditLog {
  id: string;
  action: string;
  entity_id: string;
  created_at: string;
  actor_id: string | null;
  before_snapshot: any;
  after_snapshot: any;
}

export function MergeHistory({ contactId }: MergeHistoryProps) {
  const [mergedInto, setMergedInto] = useState<Contact | null>(null);
  const [absorbedContacts, setAbsorbedContacts] = useState<MergedContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMergeHistory();
  }, [contactId]);

  const fetchMergeHistory = async () => {
    setLoading(true);
    try {
      // Check if this contact was merged into another
      const { data: currentContact } = await supabase
        .from('contacts')
        .select('merged_into_id')
        .eq('id', contactId)
        .single();

      if (currentContact?.merged_into_id) {
        const { data: targetContact } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', currentContact.merged_into_id)
          .single();
        setMergedInto(targetContact as Contact | null);
      }

      // Find contacts that were merged into this one
      const { data: mergedContacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('merged_into_id', contactId);

      if (mergedContacts && mergedContacts.length > 0) {
        // Get merge audit logs for dates
        const { data: auditLogs } = await supabase
          .from('audit_logs')
          .select('*')
          .eq('action', 'merge')
          .in('entity_id', mergedContacts.map(c => c.id));

        const enrichedContacts = (mergedContacts as Contact[]).map(contact => {
          const log = auditLogs?.find((l: AuditLog) => l.entity_id === contact.id);
          return {
            ...contact,
            merge_date: log?.created_at,
            merged_by: log?.actor_id,
          };
        });

        setAbsorbedContacts(enrichedContacts);
      }
    } catch (error) {
      console.error('Error fetching merge history:', error);
    }
    setLoading(false);
  };

  if (loading) {
    return null;
  }

  // Show banner if this contact was merged away
  if (mergedInto) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <GitMerge className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-warning">Denna kontakt har slagits samman</p>
              <p className="text-sm text-muted-foreground">
                All information har flyttats till:
              </p>
            </div>
            <Link
              to={`/contacts/${mergedInto.id}`}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <Users className="h-4 w-4" />
              <span className="font-medium">{mergedInto.first_name} {mergedInto.last_name}</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show merge history if contacts were absorbed
  if (absorbedContacts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <GitMerge className="h-5 w-5 text-info" />
          Sammanslagningshistorik ({absorbedContacts.length})
        </CardTitle>
        <CardDescription>Kontakter som slagits samman till denna</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {absorbedContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground line-through">
                    {contact.first_name} {contact.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{contact.email}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {contact.voyado_id}
                </Badge>
                {contact.merge_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(contact.merge_date), 'PPP', { locale: sv })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
