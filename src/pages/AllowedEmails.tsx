import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Plus, ShieldCheck, Loader2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';

interface AllowedEmail {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
}

export default function AllowedEmails() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [emails, setEmails] = useState<AllowedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from('allowed_emails')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Kunde inte hämta godkända e-poster');
    else setEmails((data as AllowedEmail[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchEmails();
  }, [isAdmin]);

  if (roleLoading) return <AppLayout><div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></AppLayout>;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const handleAdd = async () => {
    if (!newEmail.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('allowed_emails').insert({
      email: newEmail.trim().toLowerCase(),
      added_by: user?.id,
      note: newNote.trim() || null,
    });
    if (error) {
      if (error.message.includes('duplicate')) toast.error('E-postadressen finns redan');
      else toast.error(error.message);
    } else {
      toast.success('E-post tillagd');
      setNewEmail('');
      setNewNote('');
      fetchEmails();
    }
    setAdding(false);
  };

  const handleDelete = async (id: string, email: string) => {
    if (email === user?.email) {
      toast.error('Du kan inte ta bort din egen e-post');
      return;
    }
    const { error } = await supabase.from('allowed_emails').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('E-post borttagen');
      fetchEmails();
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Godkända e-poster</h1>
            <p className="text-muted-foreground text-sm">Bara dessa e-postadresser kan logga in</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lägg till e-post</CardTitle>
            <CardDescription>Personen kan sedan logga in med Google eller e-post/lösenord</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="E-postadress"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Input
                placeholder="Anteckning (valfritt)"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Button onClick={handleAdd} disabled={adding}>
                {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : emails.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Inga godkända e-poster ännu</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>E-post</TableHead>
                    <TableHead>Anteckning</TableHead>
                    <TableHead>Tillagd</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emails.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.email}</TableCell>
                      <TableCell className="text-muted-foreground">{item.note || '–'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(item.created_at), 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id, item.email)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
