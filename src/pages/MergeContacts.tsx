import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useUserRole } from '@/hooks/useUserRole';
import { Search, Merge, ShieldAlert, Users, AlertTriangle } from 'lucide-react';
import { Contact } from '@/types/database';

export default function MergeContacts() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [searchEmail, setSearchEmail] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [merging, setMerging] = useState(false);
  const [winnerFields, setWinnerFields] = useState({
    name: '',
    phone: '',
    contact_type: '',
  });

  const searchContacts = async () => {
    if (!searchEmail) return;
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .ilike('email', `%${searchEmail}%`)
      .is('merged_into_id', null)
      .order('last_name');
    setContacts((data || []) as Contact[]);
    setSelectedIds([]);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectedContacts = contacts.filter((c) => selectedIds.includes(c.id));

  const handleMerge = async () => {
    if (selectedIds.length < 2) {
      toast({ title: 'Välj minst 2 kontakter att slå samman', variant: 'destructive' });
      return;
    }

    if (!winnerFields.name) {
      toast({ title: 'Välj vilken kontakt som ska behållas', variant: 'destructive' });
      return;
    }

    setMerging(true);
    const winnerId = winnerFields.name;
    const loserIds = selectedIds.filter((id) => id !== winnerId);
    const winner = selectedContacts.find((c) => c.id === winnerId);

    try {
      // Update winner with chosen fields
      const phoneWinner = selectedContacts.find((c) => c.id === winnerFields.phone);
      const typeWinner = selectedContacts.find((c) => c.id === winnerFields.contact_type);

      await supabase
        .from('contacts')
        .update({
          phone: phoneWinner?.phone || winner?.phone,
          contact_type: typeWinner?.contact_type || winner?.contact_type,
        })
        .eq('id', winnerId);

      // Move all contact_customer_links
      await supabase
        .from('contact_customer_links')
        .update({ contact_id: winnerId })
        .in('contact_id', loserIds);

      // Move all teacher_school_assignments
      await supabase
        .from('teacher_school_assignments')
        .update({ teacher_contact_id: winnerId })
        .in('teacher_contact_id', loserIds);

      // Update profiles
      await supabase
        .from('profiles')
        .update({ contact_id: winnerId })
        .in('contact_id', loserIds);

      // Mark losers as merged
      for (const loserId of loserIds) {
        const loser = selectedContacts.find((c) => c.id === loserId);
        await supabase
          .from('contacts')
          .update({ merged_into_id: winnerId })
          .eq('id', loserId);

        await logAction('contact_merge', loserId, 'merge', loser as unknown as null, { merged_into: winnerId });
      }

      await logAction('contact_merge', winnerId, 'merge_winner', null, { absorbed_contacts: loserIds });

      toast({ title: 'Kontakter sammanslagna!' });
      setContacts([]);
      setSelectedIds([]);
      setWinnerFields({ name: '', phone: '', contact_type: '' });
    } catch (error) {
      console.error('Merge error:', error);
      toast({ title: 'Kunde inte slå samman kontakter', variant: 'destructive' });
    }
    setMerging(false);
  };

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
          <p className="text-muted-foreground">Endast administratörer kan slå samman kontakter</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
            <Merge className="h-6 w-6 text-warning" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Slå samman kontakter</h1>
            <p className="text-muted-foreground">Hantera dubbletter genom att slå samman kontakter</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sök dubbletter</CardTitle>
            <CardDescription>Sök på e-post för att hitta dubbletter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Sök på e-postadress..."
                  className="pl-9"
                  onKeyDown={(e) => e.key === 'Enter' && searchContacts()}
                />
              </div>
              <Button onClick={searchContacts}>
                <Search className="h-4 w-4 mr-2" />
                Sök
              </Button>
            </div>
          </CardContent>
        </Card>

        {contacts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sökresultat ({contacts.length})</CardTitle>
              <CardDescription>Markera de kontakter du vill slå samman</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border ${
                    selectedIds.includes(contact.id) ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <Checkbox
                    checked={selectedIds.includes(contact.id)}
                    onCheckedChange={() => toggleSelection(contact.id)}
                  />
                  <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-contact" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                    <div className="flex gap-2 mt-1">
                      {contact.phone && <Badge variant="outline">{contact.phone}</Badge>}
                      <Badge variant="secondary">{contact.contact_type}</Badge>
                      {contact.is_teacher && <Badge variant="teacher">Lärare</Badge>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{contact.voyado_id}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {selectedIds.length >= 2 && (
          <Card className="border-warning/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Konfigurera sammanslagning
              </CardTitle>
              <CardDescription>Välj vilka värden som ska behållas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Vilken kontakts namn ska behållas? (Denna blir "vinnaren")</Label>
                <RadioGroup value={winnerFields.name} onValueChange={(v) => setWinnerFields({ ...winnerFields, name: v })}>
                  {selectedContacts.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={c.id} id={`name-${c.id}`} />
                      <Label htmlFor={`name-${c.id}`}>{c.first_name} {c.last_name}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Vilken telefonnummer ska behållas?</Label>
                <RadioGroup value={winnerFields.phone} onValueChange={(v) => setWinnerFields({ ...winnerFields, phone: v })}>
                  {selectedContacts.filter(c => c.phone).map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={c.id} id={`phone-${c.id}`} />
                      <Label htmlFor={`phone-${c.id}`}>{c.phone}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Vilken kontakttyp ska behållas?</Label>
                <RadioGroup value={winnerFields.contact_type} onValueChange={(v) => setWinnerFields({ ...winnerFields, contact_type: v })}>
                  {selectedContacts.map((c) => (
                    <div key={c.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={c.id} id={`type-${c.id}`} />
                      <Label htmlFor={`type-${c.id}`}>{c.contact_type} ({c.first_name})</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button onClick={handleMerge} disabled={merging || !winnerFields.name} className="w-full">
                <Merge className="h-4 w-4 mr-2" />
                {merging ? 'Slår samman...' : `Slå samman ${selectedIds.length} kontakter`}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
