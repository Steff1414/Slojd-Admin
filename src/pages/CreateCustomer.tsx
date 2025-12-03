import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ArrowLeft, Building2, Save } from 'lucide-react';
import { CustomerCategory, CustomerTypeGroup } from '@/types/database';

const CATEGORIES: CustomerCategory[] = ['Privat', 'Personal', 'Företag', 'ÅF', 'UF', 'Skola', 'Omsorg', 'Förening'];
const TYPE_GROUPS: CustomerTypeGroup[] = ['B2C', 'B2B', 'B2G'];

export default function CreateCustomer() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    bc_customer_number: '',
    customer_category: '' as CustomerCategory | '',
    customer_type_group: '' as CustomerTypeGroup | '',
    voyado_id: '',
    norce_code: '',
    sitoo_customer_number: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bc_customer_number || !form.customer_category || !form.customer_type_group) {
      toast({ title: 'Fyll i alla obligatoriska fält', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: form.name,
        bc_customer_number: form.bc_customer_number,
        customer_category: form.customer_category as CustomerCategory,
        customer_type_group: form.customer_type_group as CustomerTypeGroup,
        voyado_id: form.voyado_id || null,
        norce_code: form.norce_code || null,
        sitoo_customer_number: form.sitoo_customer_number || null,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Kunde inte skapa kund', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    await logAction('customer', data.id, 'create', null, data);
    toast({ title: 'Kund skapad!' });
    navigate(`/customers/${data.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <Link to="/customers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-customer/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-customer" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Skapa ny kund</h1>
            <p className="text-muted-foreground">Lägg till en ny kund i systemet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kundinformation</CardTitle>
            <CardDescription>Fält markerade med * är obligatoriska</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Namn *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Företagsnamn eller personnamn"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bc_customer_number">BC Kundnummer *</Label>
                  <Input
                    id="bc_customer_number"
                    value={form.bc_customer_number}
                    onChange={(e) => setForm({ ...form, bc_customer_number: e.target.value })}
                    placeholder="BC-12345"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_category">Kategori *</Label>
                  <Select
                    value={form.customer_category}
                    onValueChange={(v) => setForm({ ...form, customer_category: v as CustomerCategory })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_type_group">Typgrupp *</Label>
                  <Select
                    value={form.customer_type_group}
                    onValueChange={(v) => setForm({ ...form, customer_type_group: v as CustomerTypeGroup })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Välj typgrupp" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_GROUPS.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="voyado_id">Voyado ID</Label>
                  <Input
                    id="voyado_id"
                    value={form.voyado_id}
                    onChange={(e) => setForm({ ...form, voyado_id: e.target.value })}
                    placeholder="Valfritt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="norce_code">Norce Code</Label>
                  <Input
                    id="norce_code"
                    value={form.norce_code}
                    onChange={(e) => setForm({ ...form, norce_code: e.target.value })}
                    placeholder="Valfritt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sitoo_customer_number">Sitoo Kundnummer</Label>
                  <Input
                    id="sitoo_customer_number"
                    value={form.sitoo_customer_number}
                    onChange={(e) => setForm({ ...form, sitoo_customer_number: e.target.value })}
                    placeholder="Valfritt"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={loading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? 'Sparar...' : 'Skapa kund'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
