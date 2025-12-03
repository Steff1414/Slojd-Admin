import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Contact, RelationshipType, ContactType } from '@/types/database';
import { Search, UserPlus, Users, GraduationCap, Loader2 } from 'lucide-react';

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'TeacherAtSchool', label: 'Lärare vid skola' },
  { value: 'BuyerAtCompany', label: 'Köpare' },
  { value: 'Employee', label: 'Anställd' },
  { value: 'Other', label: 'Övrigt' },
];

const CONTACT_TYPES: ContactType[] = ['Privatperson', 'Medlem', 'Nyhetsbrev', 'Lärare', 'Köpare', 'Övrig'];

interface AddContactToCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
}

export function AddContactToCustomerModal({ open, onOpenChange, customerId, customerName, onSuccess }: AddContactToCustomerModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [saving, setSaving] = useState(false);

  // Existing contact search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<{ contact: Contact; relationshipType: RelationshipType; isPrimary: boolean }[]>([]);

  // New contact form
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    contact_type: 'Övrig' as ContactType,
    is_teacher: false,
  });
  const [newRelationshipType, setNewRelationshipType] = useState<RelationshipType>('Other');

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setSearchResults([]);
      setSelectedContacts([]);
      setNewContact({ first_name: '', last_name: '', email: '', phone: '', contact_type: 'Övrig', is_teacher: false });
      setNewRelationshipType('Other');
      setTab('existing');
    }
  }, [open]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);

    const { data } = await supabase
      .from('contacts')
      .select('*')
      .is('merged_into_id', null)
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,voyado_id.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
      .limit(20);

    setSearchResults((data || []) as Contact[]);
    setSearching(false);
  };

  const toggleContactSelection = (contact: Contact) => {
    const existing = selectedContacts.find(sc => sc.contact.id === contact.id);
    if (existing) {
      setSelectedContacts(selectedContacts.filter(sc => sc.contact.id !== contact.id));
    } else {
      setSelectedContacts([...selectedContacts, { contact, relationshipType: 'Other', isPrimary: false }]);
    }
  };

  const updateSelectedContact = (contactId: string, field: 'relationshipType' | 'isPrimary', value: any) => {
    setSelectedContacts(selectedContacts.map(sc => 
      sc.contact.id === contactId ? { ...sc, [field]: value } : sc
    ));
  };

  const handleSaveExisting = async () => {
    if (selectedContacts.length === 0) {
      toast({ title: 'Välj minst en kontakt', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Check if any selected contact should be primary
    const hasPrimaryInSelection = selectedContacts.some(sc => sc.isPrimary);
    
    // If setting any as primary, unset existing primary contacts for this customer
    if (hasPrimaryInSelection) {
      await supabase
        .from('contact_customer_links')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true);
    }

    // Only allow one primary among selected contacts
    let primarySet = false;
    for (const sc of selectedContacts) {
      const shouldBePrimary = sc.isPrimary && !primarySet;
      if (shouldBePrimary) primarySet = true;
      
      const { data, error } = await supabase
        .from('contact_customer_links')
        .insert({
          contact_id: sc.contact.id,
          customer_id: customerId,
          relationship_type: sc.relationshipType,
          is_primary: shouldBePrimary,
        })
        .select()
        .single();

      if (error) {
        toast({ title: 'Kunde inte koppla kontakt', description: error.message, variant: 'destructive' });
      } else {
        await logAction('contact_customer_link', data.id, 'create', null, data);
      }
    }

    toast({ title: 'Kontakter kopplade', description: `${selectedContacts.length} kontakt(er) kopplad till ${customerName}` });
    setSaving(false);
    onOpenChange(false);
    onSuccess();
  };

  const handleSaveNew = async () => {
    if (!newContact.first_name.trim() || !newContact.last_name.trim() || !newContact.email.trim()) {
      toast({ title: 'Fyll i namn och e-post', variant: 'destructive' });
      return;
    }

    setSaving(true);

    // Generate voyado_id
    const voyadoId = `VOY-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Create contact
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .insert({
        ...newContact,
        voyado_id: voyadoId,
        phone: newContact.phone || null,
      })
      .select()
      .single();

    if (contactError) {
      toast({ title: 'Kunde inte skapa kontakt', description: contactError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    await logAction('contact', contactData.id, 'create', null, contactData);

    // Create link
    const { data: linkData, error: linkError } = await supabase
      .from('contact_customer_links')
      .insert({
        contact_id: contactData.id,
        customer_id: customerId,
        relationship_type: newRelationshipType,
        is_primary: true,
      })
      .select()
      .single();

    if (linkError) {
      toast({ title: 'Kunde inte koppla kontakt', description: linkError.message, variant: 'destructive' });
    } else {
      await logAction('contact_customer_link', linkData.id, 'create', null, linkData);
    }

    toast({ title: 'Kontakt skapad och kopplad', description: `${newContact.first_name} ${newContact.last_name} har lagts till` });
    setSaving(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lägg till kontakt till {customerName}</DialogTitle>
          <DialogDescription>Välj en befintlig kontakt eller skapa en ny</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'existing' | 'new')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="gap-2">
              <Users className="h-4 w-4" />
              Befintlig kontakt
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Ny kontakt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {/* Search */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på namn, e-post, telefon, Voyado ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sök'}
              </Button>
            </div>

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                {searchResults.map((contact) => {
                  const isSelected = selectedContacts.some(sc => sc.contact.id === contact.id);
                  return (
                    <div
                      key={contact.id}
                      className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                      onClick={() => toggleContactSelection(contact)}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                          {contact.is_teacher && <GraduationCap className="h-4 w-4 text-teacher" />}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{contact.email}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{contact.voyado_id}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected contacts configuration */}
            {selectedContacts.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Valda kontakter ({selectedContacts.length})</Label>
                {selectedContacts.map(({ contact, relationshipType, isPrimary }) => (
                  <div key={contact.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                      <p className="text-sm text-muted-foreground">{contact.email}</p>
                    </div>
                    <Select value={relationshipType} onValueChange={(v) => updateSelectedContact(contact.id, 'relationshipType', v)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_TYPES.map(rt => (
                          <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={isPrimary} onCheckedChange={(c) => updateSelectedContact(contact.id, 'isPrimary', c)} />
                      Primär
                    </label>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button onClick={handleSaveExisting} disabled={saving || selectedContacts.length === 0}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Lägg till {selectedContacts.length} kontakt(er)
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Förnamn *</Label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                  placeholder="Förnamn"
                />
              </div>
              <div className="space-y-2">
                <Label>Efternamn *</Label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                  placeholder="Efternamn"
                />
              </div>
              <div className="space-y-2">
                <Label>E-post *</Label>
                <Input
                  type="email"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                  placeholder="namn@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Telefon</Label>
                <Input
                  value={newContact.phone}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                  placeholder="070-123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label>Kontakttyp</Label>
                <Select value={newContact.contact_type} onValueChange={(v) => setNewContact({ ...newContact, contact_type: v as ContactType })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_TYPES.map(ct => (
                      <SelectItem key={ct} value={ct}>{ct}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rolltyp</Label>
                <Select value={newRelationshipType} onValueChange={(v) => setNewRelationshipType(v as RelationshipType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map(rt => (
                      <SelectItem key={rt.value} value={rt.value}>{rt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="is_teacher"
                checked={newContact.is_teacher}
                onCheckedChange={(c) => setNewContact({ ...newContact, is_teacher: c })}
              />
              <Label htmlFor="is_teacher">Är lärare</Label>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Avbryt</Button>
              <Button onClick={handleSaveNew} disabled={saving || !newContact.first_name || !newContact.last_name || !newContact.email}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
                Skapa och koppla
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
