import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Search, Users, Check, X } from 'lucide-react';
import { Contact, RelationshipType } from '@/types/database';

interface AddContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerCategory: string;
  onSuccess: () => void;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'TeacherAtSchool', label: 'Lärare vid skola' },
  { value: 'BuyerAtCompany', label: 'Köpare' },
  { value: 'Employee', label: 'Anställd' },
  { value: 'Other', label: 'Övrigt' },
];

export function AddContactModal({ open, onOpenChange, customerId, customerCategory, onSuccess }: AddContactModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [search, setSearch] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('Other');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!search || search.length < 2) {
      setContacts([]);
      return;
    }

    const searchContacts = async () => {
      setLoading(true);
      const searchTerm = `%${search}%`;
      const { data } = await supabase
        .from('contacts')
        .select('*')
        .is('merged_into_id', null)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},voyado_id.ilike.${searchTerm}`)
        .limit(10);
      setContacts((data || []) as Contact[]);
      setLoading(false);
    };

    const debounce = setTimeout(searchContacts, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  useEffect(() => {
    // Auto-select TeacherAtSchool for schools
    if (customerCategory === 'Skola') {
      setRelationshipType('TeacherAtSchool');
    }
  }, [customerCategory]);

  const handleSave = async () => {
    if (!selectedContact) return;
    setSaving(true);

    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from('contact_customer_links')
        .select('id')
        .eq('contact_id', selectedContact.id)
        .eq('customer_id', customerId)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Kontakten är redan kopplad till denna kund', variant: 'destructive' });
        setSaving(false);
        return;
      }

      // If setting as primary, unset other primary contacts for this customer
      if (isPrimary) {
        await supabase
          .from('contact_customer_links')
          .update({ is_primary: false })
          .eq('customer_id', customerId)
          .eq('is_primary', true);
      }

      const { data, error } = await supabase
        .from('contact_customer_links')
        .insert({
          contact_id: selectedContact.id,
          customer_id: customerId,
          relationship_type: relationshipType,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction('contact_customer_link', data.id, 'create', null, data);

      toast({ title: 'Kontakt kopplad!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding contact:', error);
      toast({ title: 'Kunde inte lägga till kontakt', variant: 'destructive' });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSearch('');
    setContacts([]);
    setSelectedContact(null);
    setRelationshipType('Other');
    setIsPrimary(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till kontakt</DialogTitle>
          <DialogDescription>Sök och koppla en kontakt till denna kund</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedContact ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök på namn, e-post eller Voyado ID..."
                  className="pl-9"
                />
              </div>

              {/* Results */}
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Söker...</div>
                ) : contacts.length === 0 && search.length >= 2 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Inga kontakter hittades</div>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-contact" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.first_name} {contact.last_name}</p>
                          <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-xs">{contact.contact_type}</Badge>
                          {contact.is_teacher && <Badge variant="teacher" className="text-xs">Lärare</Badge>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Selected contact */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-contact" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedContact.first_name} {selectedContact.last_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedContact.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Relationship settings */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Relationstyp</Label>
                  <Select value={relationshipType} onValueChange={(v) => setRelationshipType(v as RelationshipType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">Primär kontakt</p>
                    <p className="text-xs text-muted-foreground">Markera som huvudkontakt för kunden</p>
                  </div>
                  <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedContact(null)} className="flex-1">
                  Tillbaka
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
                  <Check className="h-4 w-4" />
                  {saving ? 'Sparar...' : 'Lägg till'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
