import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ArrowLeft, Users, Save } from 'lucide-react';
import { ContactType } from '@/types/database';

const CONTACT_TYPES: ContactType[] = ['Member', 'Newsletter', 'Teacher', 'Buyer', 'Other'];

export default function CreateContact() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    voyado_id: '',
    contact_type: 'Other' as ContactType,
    is_teacher: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.voyado_id) {
      toast({ title: 'Fyll i alla obligatoriska fält', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        voyado_id: form.voyado_id,
        contact_type: form.contact_type,
        is_teacher: form.is_teacher,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skapa kontakt', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await logAction('contact', data.id, 'create', null, data);
    toast({ title: 'Kontakt skapad!' });
    navigate(`/contacts/${data.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <Link to="/contacts">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-contact/10 flex items-center justify-center">
            <Users className="h-6 w-6 text-contact" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Skapa ny kontakt</h1>
            <p className="text-muted-foreground">Lägg till en ny kontakt i systemet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kontaktinformation</CardTitle>
            <CardDescription>Fält markerade med * är obligatoriska</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Förnamn *</Label>
                  <Input
                    id="first_name"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Efternamn *</Label>
                  <Input
                    id="last_name"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voyado_id">Voyado ID *</Label>
                  <Input
                    id="voyado_id"
                    value={form.voyado_id}
                    onChange={(e) => setForm({ ...form, voyado_id: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_type">Kontakttyp</Label>
                  <Select
                    value={form.contact_type}
                    onValueChange={(v) => setForm({ ...form, contact_type: v as ContactType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONTACT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_teacher"
                  checked={form.is_teacher}
                  onCheckedChange={(checked) => setForm({ ...form, is_teacher: checked })}
                />
                <Label htmlFor="is_teacher">Är lärare</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Anteckningar</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Sparar...' : 'Skapa kontakt'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
