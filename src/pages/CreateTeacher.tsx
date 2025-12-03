import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ArrowLeft, GraduationCap, Save } from 'lucide-react';
import { Customer } from '@/types/database';

export default function CreateTeacher() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<Customer[]>([]);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    voyado_id: '',
    notes: '',
    school_id: '',
    role: '',
  });

  useEffect(() => {
    async function fetchSchools() {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('customer_category', 'Skola')
        .eq('is_active', true)
        .order('name');
      setSchools((data || []) as Customer[]);
    }
    fetchSchools();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email || !form.voyado_id) {
      toast({ title: 'Fyll i alla obligatoriska fält', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Create teacher contact
    const { data: contact, error } = await supabase
      .from('contacts')
      .insert({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone || null,
        voyado_id: form.voyado_id,
        contact_type: 'Lärare',
        is_teacher: true,
        notes: form.notes || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skapa lärare', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await logAction('contact', contact.id, 'create', null, { ...contact, is_teacher: true });

    // Create school assignment if selected
    if (form.school_id) {
      const { error: assignError } = await supabase
        .from('teacher_school_assignments')
        .insert({
          teacher_contact_id: contact.id,
          school_customer_id: form.school_id,
          role: form.role || null,
          is_active: true,
        });

      if (assignError) {
        toast({ title: 'Lärare skapad men kunde inte koppla till skola', variant: 'destructive' });
      }
    }

    toast({ title: 'Lärare skapad!' });
    navigate(`/contacts/${contact.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <Link to="/teachers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teacher/10 flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-teacher" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Registrera ny lärare</h1>
            <p className="text-muted-foreground">Lägg till en ny lärare och koppla till skola</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lärarinformation</CardTitle>
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
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-medium mb-4">Skolkoppling (valfritt)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="school_id">Skola</Label>
                    <Select
                      value={form.school_id}
                      onValueChange={(v) => setForm({ ...form, school_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Välj skola" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools.map((school) => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Roll vid skolan</Label>
                    <Input
                      id="role"
                      value={form.role}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      placeholder="t.ex. Slöjdlärare"
                    />
                  </div>
                </div>
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
                  {loading ? 'Sparar...' : 'Skapa lärare'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
