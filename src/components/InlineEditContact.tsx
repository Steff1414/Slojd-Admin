import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Contact, ContactType } from '@/types/database';
import { Pencil, Save, X, Mail, Phone, Bell } from 'lucide-react';

const CONTACT_TYPES: ContactType[] = ['Privatperson', 'Medlem', 'Nyhetsbrev', 'Lärare', 'Köpare', 'Övrig'];

const contactSchema = z.object({
  first_name: z.string().trim().min(1, 'Förnamn krävs').max(100, 'Förnamn får vara max 100 tecken'),
  last_name: z.string().trim().min(1, 'Efternamn krävs').max(100, 'Efternamn får vara max 100 tecken'),
  email: z.string().trim().min(1, 'E-post krävs').email('Ogiltig e-postadress').max(255, 'E-post får vara max 255 tecken'),
  phone: z.string().max(50, 'Telefonnummer får vara max 50 tecken').optional().or(z.literal('')),
  contact_type: z.enum(['Privatperson', 'Medlem', 'Nyhetsbrev', 'Lärare', 'Köpare', 'Övrig']),
  is_teacher: z.boolean(),
  wants_sms: z.boolean(),
  wants_newsletter: z.boolean(),
  wants_personalized_offers: z.boolean(),
  notes: z.string().max(2000, 'Anteckningar får vara max 2000 tecken').optional().or(z.literal('')),
});

interface InlineEditContactProps {
  contact: Contact;
  onUpdate: () => void;
  roleCount?: number; // Number of customer links - hide preferences if > 1
}

export function InlineEditContact({ contact, onUpdate, roleCount = 0 }: InlineEditContactProps) {
  const showPreferences = roleCount <= 1;
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone || '',
    contact_type: contact.contact_type,
    is_teacher: contact.is_teacher,
    wants_sms: contact.wants_sms ?? false,
    wants_newsletter: contact.wants_newsletter ?? false,
    wants_personalized_offers: contact.wants_personalized_offers ?? false,
    notes: contact.notes || '',
  });

  const handleSave = async () => {
    setErrors({});
    
    const result = contactSchema.safeParse(form);
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
    const beforeSnapshot = { ...contact };

    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        email: result.data.email,
        phone: result.data.phone || null,
        contact_type: result.data.contact_type,
        is_teacher: result.data.is_teacher,
        wants_sms: result.data.wants_sms,
        wants_newsletter: result.data.wants_newsletter,
        wants_personalized_offers: result.data.wants_personalized_offers,
        notes: result.data.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contact.id);

    if (error) {
      toast({ title: 'Kunde inte spara ändringar', description: error.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await logAction('contact', contact.id, 'update', beforeSnapshot as any, {
      ...beforeSnapshot,
      ...result.data,
    } as any);

    toast({ title: 'Kontaktuppgifter uppdaterade' });
    setEditing(false);
    setSaving(false);
    onUpdate();
  };

  const handleCancel = () => {
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      contact_type: contact.contact_type,
      is_teacher: contact.is_teacher,
      wants_sms: contact.wants_sms ?? false,
      wants_newsletter: contact.wants_newsletter ?? false,
      wants_personalized_offers: contact.wants_personalized_offers ?? false,
      notes: contact.notes || '',
    });
    setErrors({});
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Kontaktuppgifter</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Redigera
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Mail className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-post</p>
              <a href={`mailto:${contact.email}`} className="font-medium text-primary hover:underline">
                {contact.email}
              </a>
            </div>
          </div>
          {contact.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Phone className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefon</p>
                <a href={`tel:${contact.phone}`} className="font-medium text-primary hover:underline">
                  {contact.phone}
                </a>
              </div>
            </div>
          )}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Voyado ID</p>
            <p className="font-mono text-sm">{contact.voyado_id}</p>
          </div>
          {/* Kommunikationspreferenser - only show if 0-1 roles */}
          {showPreferences && (
            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Kommunikationspreferenser</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Checkbox checked={contact.wants_sms ?? false} disabled />
                  <span className={contact.wants_sms ? '' : 'text-muted-foreground'}>
                    Vill få SMS med erbjudanden
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={contact.wants_newsletter ?? false} disabled />
                  <span className={contact.wants_newsletter ? '' : 'text-muted-foreground'}>
                    Vill få e-post med nyhetsbrev
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={contact.wants_personalized_offers ?? false} disabled />
                  <span className={contact.wants_personalized_offers ? '' : 'text-muted-foreground'}>
                    Vill få personaliserade erbjudanden baserat på köphistorik
                  </span>
                </div>
              </div>
            </div>
          )}
          {contact.notes && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Anteckningar</p>
              <p className="text-sm">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-display text-lg">Redigera kontakt</CardTitle>
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
            <Label htmlFor="first_name">Förnamn *</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className={errors.first_name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Efternamn *</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={errors.last_name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-post *</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={errors.email ? 'border-destructive' : ''}
              maxLength={255}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={errors.phone ? 'border-destructive' : ''}
              maxLength={50}
            />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
          </div>
          <div className="space-y-2">
            <Label>Voyado ID (skrivskyddat)</Label>
            <Input value={contact.voyado_id} disabled className="bg-muted" />
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
                {CONTACT_TYPES.map((ct) => (
                  <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch
            id="is_teacher"
            checked={form.is_teacher}
            onCheckedChange={(checked) => setForm({ ...form, is_teacher: checked })}
          />
          <Label htmlFor="is_teacher">Är lärare</Label>
        </div>
        
        {/* Kommunikationspreferenser - only show if 0-1 roles */}
        {showPreferences && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <Label className="font-medium">Kommunikationspreferenser</Label>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={form.wants_sms}
                  onCheckedChange={(checked) => setForm({ ...form, wants_sms: checked as boolean })}
                />
                <span className="text-sm">Vill få SMS med erbjudanden</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={form.wants_newsletter}
                  onCheckedChange={(checked) => setForm({ ...form, wants_newsletter: checked as boolean })}
                />
                <span className="text-sm">Vill få e-post med nyhetsbrev</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={form.wants_personalized_offers}
                  onCheckedChange={(checked) => setForm({ ...form, wants_personalized_offers: checked as boolean })}
                />
                <span className="text-sm">Vill få personaliserade erbjudanden baserat på köphistorik</span>
              </label>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="notes">Anteckningar</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            className={errors.notes ? 'border-destructive' : ''}
            maxLength={2000}
          />
          {errors.notes && <p className="text-sm text-destructive">{errors.notes}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
