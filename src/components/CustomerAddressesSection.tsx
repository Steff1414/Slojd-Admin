import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { CustomerAddress, AddressType, CustomerTypeGroup } from '@/types/database';
import { MapPin, Plus, Pencil, Trash2, Check, Loader2 } from 'lucide-react';

interface CustomerAddressesSectionProps {
  customerId: string;
  customerTypeGroup: CustomerTypeGroup;
  onUpdate?: () => void;
}

const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  BILLING: 'Fakturaadress',
  DELIVERY: 'Leveransadress',
  ALTERNATIVE_DELIVERY: 'Alternativ leveransadress',
};

export function CustomerAddressesSection({ customerId, customerTypeGroup, onUpdate }: CustomerAddressesSectionProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    address_type: 'DELIVERY' as AddressType,
    label: '',
    name: '',
    street: '',
    postal_code: '',
    city: '',
    region: '',
    country: 'Sverige',
    is_approved_delivery_address: false,
    is_default_for_type: false,
  });

  useEffect(() => {
    fetchAddresses();
  }, [customerId]);

  const fetchAddresses = async () => {
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('customer_id', customerId)
      .order('address_type', { ascending: true });
    
    setAddresses((data || []) as CustomerAddress[]);
    setLoading(false);
  };

  const isB2C = customerTypeGroup === 'B2C';
  const canAddMore = !isB2C || addresses.filter(a => a.address_type === 'ALTERNATIVE_DELIVERY').length === 0;

  const openAddModal = () => {
    setEditing(null);
    setForm({
      address_type: isB2C ? 'ALTERNATIVE_DELIVERY' : 'DELIVERY',
      label: '',
      name: '',
      street: '',
      postal_code: '',
      city: '',
      region: '',
      country: 'Sverige',
      is_approved_delivery_address: false,
      is_default_for_type: false,
    });
    setModalOpen(true);
  };

  const openEditModal = (address: CustomerAddress) => {
    setEditing(address);
    setForm({
      address_type: address.address_type,
      label: address.label || '',
      name: address.name || '',
      street: address.street,
      postal_code: address.postal_code,
      city: address.city,
      region: address.region || '',
      country: address.country,
      is_approved_delivery_address: address.is_approved_delivery_address,
      is_default_for_type: address.is_default_for_type,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.street.trim() || !form.postal_code.trim() || !form.city.trim()) {
      toast({ title: 'Fyll i obligatoriska fält', variant: 'destructive' });
      return;
    }

    // B2C validation
    if (isB2C && form.address_type === 'ALTERNATIVE_DELIVERY' && !editing) {
      const existing = addresses.filter(a => a.address_type === 'ALTERNATIVE_DELIVERY');
      if (existing.length >= 1) {
        toast({ title: 'Max en alternativ leveransadress för privatkunder', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);

    if (editing) {
      const { error } = await supabase
        .from('customer_addresses')
        .update({
          ...form,
          label: form.label || null,
          name: form.name || null,
          region: form.region || null,
        })
        .eq('id', editing.id);

      if (error) {
        toast({ title: 'Kunde inte uppdatera adress', description: error.message, variant: 'destructive' });
      } else {
        await logAction('customer_address', editing.id, 'update', editing as any, form as any);
        toast({ title: 'Adress uppdaterad' });
      }
    } else {
      const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
          customer_id: customerId,
          ...form,
          label: form.label || null,
          name: form.name || null,
          region: form.region || null,
        })
        .select()
        .single();

      if (error) {
        toast({ title: 'Kunde inte lägga till adress', description: error.message, variant: 'destructive' });
      } else {
        await logAction('customer_address', data.id, 'create', null, data);
        toast({ title: 'Adress tillagd' });
      }
    }

    setSaving(false);
    setModalOpen(false);
    fetchAddresses();
    onUpdate?.();
  };

  const handleDelete = async (address: CustomerAddress) => {
    if (!confirm('Är du säker på att du vill ta bort denna adress?')) return;

    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', address.id);

    if (error) {
      toast({ title: 'Kunde inte ta bort adress', description: error.message, variant: 'destructive' });
    } else {
      await logAction('customer_address', address.id, 'delete', address as any, null);
      toast({ title: 'Adress borttagen' });
      fetchAddresses();
      onUpdate?.();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Leveransadresser
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                {isB2C ? 'Adresser' : 'Leveransadresser'}
              </CardTitle>
              <CardDescription>
                {isB2C 
                  ? 'Primäradress och alternativ leveransadress'
                  : `${addresses.length} ${addresses.length === 1 ? 'adress' : 'adresser'} registrerade`
                }
              </CardDescription>
            </div>
            {canAddMore && (
              <Button variant="outline" size="sm" onClick={openAddModal} className="gap-2">
                <Plus className="h-4 w-4" />
                Lägg till
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {addresses.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga adresser registrerade</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div key={address.id} className="flex items-start justify-between p-3 bg-muted/30 rounded-lg border border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {ADDRESS_TYPE_LABELS[address.address_type]}
                      </Badge>
                      {address.is_default_for_type && (
                        <Badge variant="default" className="text-xs gap-1">
                          <Check className="h-3 w-3" />
                          Standard
                        </Badge>
                      )}
                      {address.is_approved_delivery_address && (
                        <Badge variant="secondary" className="text-xs">Godkänd</Badge>
                      )}
                    </div>
                    {address.label && <p className="text-sm font-medium">{address.label}</p>}
                    {address.name && <p className="text-sm text-muted-foreground">{address.name}</p>}
                    <p className="text-sm">{address.street}</p>
                    <p className="text-sm">{address.postal_code} {address.city}</p>
                    {address.region && <p className="text-sm text-muted-foreground">{address.region}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(address)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(address)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Redigera adress' : 'Lägg till adress'}</DialogTitle>
            <DialogDescription>
              {isB2C ? 'Hantera leveransadresser för privatkund' : 'Hantera leveransadresser för kunden'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!isB2C && (
              <div className="space-y-2">
                <Label>Adresstyp</Label>
                <Select value={form.address_type} onValueChange={(v) => setForm({ ...form, address_type: v as AddressType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BILLING">Fakturaadress</SelectItem>
                    <SelectItem value="DELIVERY">Leveransadress</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Etikett</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  placeholder="t.ex. Huvudkontor"
                />
              </div>
              <div className="space-y-2">
                <Label>Mottagare/Avdelning</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="t.ex. Inköpsavdelningen"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gatuadress *</Label>
              <Input
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Storgatan 1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Postnummer *</Label>
                <Input
                  value={form.postal_code}
                  onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="123 45"
                />
              </div>
              <div className="space-y-2">
                <Label>Ort *</Label>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Stockholm"
                />
              </div>
            </div>

            {!isB2C && (
              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.is_approved_delivery_address}
                    onCheckedChange={(c) => setForm({ ...form, is_approved_delivery_address: c })}
                  />
                  <span className="text-sm">Godkänd leveransadress</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={form.is_default_for_type}
                    onCheckedChange={(c) => setForm({ ...form, is_default_for_type: c })}
                  />
                  <span className="text-sm">Standardadress</span>
                </label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editing ? 'Spara' : 'Lägg till'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
