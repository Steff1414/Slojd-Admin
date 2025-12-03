import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Contact, ContactType } from '@/types/database';
import { Pencil, Save, X, Mail, Phone } from 'lucide-react';

const CONTACT_TYPES: ContactType[] = ['Member', 'Newsletter', 'Teacher', 'Buyer', 'Other'];

interface InlineEditContactProps {
  contact: Contact;
  onUpdate: () => void;
}

export function InlineEditContact({ contact, onUpdate }: InlineEditContactProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone || '',
    contact_type: contact.contact_type,
    is_teacher: contact.is_teacher,
    notes: contact.notes || '',
  });

  const handleSave = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim()) {
      toast({ title: 'Förnamn, efternamn och e-post krävs', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const beforeSnapshot = { ...contact };

    const { error } = await supabase
      .from('contacts')
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone: form.phone || null,
        contact_type: form.contact_type,
        is_teacher: form.is_teacher,
        notes: form.notes || null,
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
      ...form,
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
      notes: contact.notes || '',
    });
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
        <div className="space-y-2">
          <Label htmlFor="notes">Anteckningar</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  );
}
