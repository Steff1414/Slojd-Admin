import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Customer, CustomerCategory, CustomerTypeGroup } from '@/types/database';
import { Pencil, Save, X } from 'lucide-react';

const CATEGORIES: CustomerCategory[] = ['Privat', 'Personal', 'Företag', 'ÅF', 'UF', 'Skola', 'Omsorg', 'Förening', 'Kommun och Region'];
const TYPE_GROUPS: CustomerTypeGroup[] = ['B2C', 'B2B', 'B2G'];

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Namn krävs').max(255, 'Namn får vara max 255 tecken'),
  customer_category: z.enum(['Privat', 'Personal', 'Företag', 'ÅF', 'UF', 'Skola', 'Omsorg', 'Förening', 'Kommun och Region']),
  customer_type_group: z.enum(['B2C', 'B2B', 'B2G']),
  is_active: z.boolean(),
  voyado_id: z.string().max(100, 'Voyado ID får vara max 100 tecken').optional().or(z.literal('')),
  norce_code: z.string().max(100, 'Norce Code får vara max 100 tecken').optional().or(z.literal('')),
  sitoo_customer_number: z.string().max(100, 'Sitoo nummer får vara max 100 tecken').optional().or(z.literal('')),
});

interface InlineEditCustomerProps {
  customer: Customer;
  onUpdate: () => void;
}

export function InlineEditCustomer({ customer, onUpdate }: InlineEditCustomerProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: customer.name,
    customer_category: customer.customer_category,
    customer_type_group: customer.customer_type_group,
    is_active: customer.is_active,
    voyado_id: customer.voyado_id || '',
    norce_code: customer.norce_code || '',
    sitoo_customer_number: customer.sitoo_customer_number || '',
  });

  const handleSave = async () => {
    setErrors({});
    
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({ title: 'Valideringsfel', description: 'Kontrollera de markerade fälten', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const beforeSnapshot = { ...customer };

    const { error } = await supabase
      .from('customers')
      .update({
        name: result.data.name,
        customer_category: result.data.customer_category,
        customer_type_group: result.data.customer_type_group,
        is_active: result.data.is_active,
        voyado_id: result.data.voyado_id || null,
        norce_code: result.data.norce_code || null,
        sitoo_customer_number: result.data.sitoo_customer_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customer.id);

    if (error) {
      toast({ title: 'Kunde inte spara ändringar', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await logAction('customer', customer.id, 'update', beforeSnapshot as any, {
      ...beforeSnapshot,
      ...result.data,
    } as any);

    toast({ title: 'Kunduppgifter uppdaterade' });
    setEditing(false);
    setSaving(false);
    onUpdate();
  };

  const handleCancel = () => {
    setForm({
      name: customer.name,
      customer_category: customer.customer_category,
      customer_type_group: customer.customer_type_group,
      is_active: customer.is_active,
      voyado_id: customer.voyado_id || '',
      norce_code: customer.norce_code || '',
      sitoo_customer_number: customer.sitoo_customer_number || '',
    });
    setErrors({});
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Grunduppgifter</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Redigera
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">BC Kundnummer</p>
              <p className="font-mono font-medium">{customer.bc_customer_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Voyado ID</p>
              <p className="font-mono text-sm">{customer.voyado_id || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Norce Code</p>
              <p className="font-mono text-sm">{customer.norce_code || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sitoo Kundnummer</p>
              <p className="font-mono text-sm">{customer.sitoo_customer_number || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg">Redigera kunduppgifter</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
            <X className="h-4 w-4 mr-1" />
            Avbryt
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Namn *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={errors.name ? 'border-destructive' : ''}
              maxLength={255}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label>BC Kundnummer (skrivskyddat)</Label>
            <Input value={customer.bc_customer_number} disabled className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select
              value={form.customer_category}
              onValueChange={(v) => setForm({ ...form, customer_category: v as CustomerCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="typeGroup">Kundtyp</Label>
            <Select
              value={form.customer_type_group}
              onValueChange={(v) => setForm({ ...form, customer_type_group: v as CustomerTypeGroup })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_GROUPS.map((tg) => (
                  <SelectItem key={tg} value={tg}>{tg}</SelectItem>
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
              className={errors.voyado_id ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.voyado_id && <p className="text-sm text-destructive">{errors.voyado_id}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="norce_code">Norce Code</Label>
            <Input
              id="norce_code"
              value={form.norce_code}
              onChange={(e) => setForm({ ...form, norce_code: e.target.value })}
              className={errors.norce_code ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.norce_code && <p className="text-sm text-destructive">{errors.norce_code}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="sitoo">Sitoo Kundnummer</Label>
            <Input
              id="sitoo"
              value={form.sitoo_customer_number}
              onChange={(e) => setForm({ ...form, sitoo_customer_number: e.target.value })}
              className={errors.sitoo_customer_number ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.sitoo_customer_number && <p className="text-sm text-destructive">{errors.sitoo_customer_number}</p>}
          </div>
          <div className="flex items-center gap-3 pt-6">
            <Switch
              id="is_active"
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
            <Label htmlFor="is_active">Aktiv kund</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
