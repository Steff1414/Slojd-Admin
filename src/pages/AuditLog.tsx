import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { History, Search, Eye, ShieldAlert } from 'lucide-react';

interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  before_snapshot: Record<string, unknown> | null;
  after_snapshot: Record<string, unknown> | null;
  created_at: string;
}

const ENTITY_TYPES = ['customer', 'contact', 'account', 'agreement', 'teacher_school_assignment', 'contact_customer_link', 'password_change', 'contact_merge'];

export default function AuditLog() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  useEffect(() => {
    if (!isAdmin && !roleLoading) return;
    
    async function fetchLogs() {
      setLoading(true);
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59');
      }

      const { data } = await query;
      setLogs((data || []) as AuditLogEntry[]);
      setLoading(false);
    }

    fetchLogs();
  }, [isAdmin, roleLoading, entityFilter, dateFrom, dateTo]);

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse h-64 bg-muted rounded-xl" />
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Du har inte behörighet att se ändringsloggen</p>
        </div>
      </AppLayout>
    );
  }

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create': return <Badge variant="success">Skapad</Badge>;
      case 'update': return <Badge variant="secondary">Uppdaterad</Badge>;
      case 'delete': return <Badge variant="destructive">Borttagen</Badge>;
      case 'merge': return <Badge variant="outline">Sammanslagen</Badge>;
      default: return <Badge>{action}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <History className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Ändringslogg</h1>
            <p className="text-muted-foreground">Spårning av alla ändringar i systemet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Alla entiteter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla entiteter</SelectItem>
                  {ENTITY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Från datum"
                className="w-40"
              />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Till datum"
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Laddar...</div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Inga loggposter hittades</div>
            ) : (
              <div className="divide-y divide-border">
                {logs.map((log) => (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getActionBadge(log.action)}
                        <Badge variant="outline">{log.entity_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        ID: {log.entity_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      {format(new Date(log.created_at), 'PPp', { locale: sv })}
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Loggdetaljer</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Tidpunkt</p>
                  <p className="font-medium">{format(new Date(selectedLog.created_at), 'PPpp', { locale: sv })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Åtgärd</p>
                  <div>{getActionBadge(selectedLog.action)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Entitetstyp</p>
                  <p className="font-medium">{selectedLog.entity_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Entitets-ID</p>
                  <p className="font-mono text-xs">{selectedLog.entity_id}</p>
                </div>
              </div>

              {selectedLog.before_snapshot && (
                <div>
                  <p className="text-sm font-medium mb-2">Före</p>
                  <ScrollArea className="h-32 rounded-md border p-3 bg-muted/50">
                    <pre className="text-xs">{JSON.stringify(selectedLog.before_snapshot, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}

              {selectedLog.after_snapshot && (
                <div>
                  <p className="text-sm font-medium mb-2">Efter</p>
                  <ScrollArea className="h-32 rounded-md border p-3 bg-muted/50">
                    <pre className="text-xs">{JSON.stringify(selectedLog.after_snapshot, null, 2)}</pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
