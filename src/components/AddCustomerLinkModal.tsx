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
import { Search, Building2, Check, X, School, Star } from 'lucide-react';
import { Customer, RelationshipType } from '@/types/database';
import { CategoryBadge } from './CategoryBadge';

interface AddCustomerLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  isTeacher?: boolean;
  suggestedSchoolIds?: string[];
  onSuccess: () => void;
}

const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'TeacherAtSchool', label: 'Lärare vid skola' },
  { value: 'BuyerAtCompany', label: 'Köpare' },
  { value: 'Employee', label: 'Anställd' },
  { value: 'Other', label: 'Övrigt' },
];

export function AddCustomerLinkModal({ 
  open, 
  onOpenChange, 
  contactId, 
  isTeacher,
  suggestedSchoolIds = [],
  onSuccess 
}: AddCustomerLinkModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suggestedCustomers, setSuggestedCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('Other');
  const [isPrimary, setIsPrimary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch suggested schools for teachers
  useEffect(() => {
    if (open && isTeacher && suggestedSchoolIds.length > 0) {
      const fetchSuggested = async () => {
        const { data } = await supabase
          .from('customers')
          .select('*')
          .in('id', suggestedSchoolIds);
        setSuggestedCustomers((data || []) as Customer[]);
      };
      fetchSuggested();
    } else {
      setSuggestedCustomers([]);
    }
  }, [open, isTeacher, suggestedSchoolIds]);

  useEffect(() => {
    if (!search || search.length < 2) {
      setCustomers([]);
      return;
    }

    const searchCustomers = async () => {
      setLoading(true);
      const searchTerm = `%${search}%`;
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.${searchTerm},bc_customer_number.ilike.${searchTerm}`)
        .limit(10);
      setCustomers((data || []) as Customer[]);
      setLoading(false);
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSave = async () => {
    if (!selectedCustomer) return;
    setSaving(true);

    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from('contact_customer_links')
        .select('id')
        .eq('contact_id', contactId)
        .eq('customer_id', selectedCustomer.id)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Kontakten är redan kopplad till denna kund', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('contact_customer_links')
        .insert({
          contact_id: contactId,
          customer_id: selectedCustomer.id,
          relationship_type: relationshipType,
          is_primary: isPrimary,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction('contact_customer_link', data.id, 'create', null, data);

      toast({ title: 'Kundkoppling skapad!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding customer link:', error);
      toast({ title: 'Kunde inte lägga till koppling', variant: 'destructive' });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSearch('');
    setCustomers([]);
    setSelectedCustomer(null);
    setRelationshipType('Other');
    setIsPrimary(false);
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    // Auto-set relationship type based on customer category
    if (customer.customer_category === 'Skola' && isTeacher) {
      setRelationshipType('TeacherAtSchool');
    } else if (['Företag', 'ÅF', 'UF'].includes(customer.customer_category)) {
      setRelationshipType('BuyerAtCompany');
    }
  };

  const renderCustomerItem = (customer: Customer, isSuggested = false) => (
    <button
      key={customer.id}
      onClick={() => selectCustomer(customer)}
      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
    >
      <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center">
        {customer.customer_category === 'Skola' ? (
          <School className="h-5 w-5 text-school" />
        ) : (
          <Building2 className="h-5 w-5 text-customer" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{customer.name}</p>
          {isSuggested && (
            <Star className="h-3 w-3 text-warning fill-warning" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{customer.bc_customer_number}</p>
      </div>
      <CategoryBadge category={customer.customer_category} />
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till kund</DialogTitle>
          <DialogDescription>Sök och koppla kontakten till en kund</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedCustomer ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök på kundnamn eller BC-nummer..."
                  className="pl-9"
                />
              </div>

              {/* Suggested schools for teachers */}
              {suggestedCustomers.length > 0 && !search && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Föreslagna skolor (där läraren undervisar)
                  </p>
                  <div className="space-y-1">
                    {suggestedCustomers.map((c) => renderCustomerItem(c, true))}
                  </div>
                </div>
              )}

              {/* Results */}
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Söker...</div>
                ) : customers.length === 0 && search.length >= 2 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Inga kunder hittades</div>
                ) : search.length >= 2 ? (
                  <div className="space-y-1">
                    {customers.map((c) => renderCustomerItem(c))}
                  </div>
                ) : null}
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Selected customer */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center">
                  {selectedCustomer.customer_category === 'Skola' ? (
                    <School className="h-5 w-5 text-school" />
                  ) : (
                    <Building2 className="h-5 w-5 text-customer" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedCustomer.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.bc_customer_number}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
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
                <Button variant="outline" onClick={() => setSelectedCustomer(null)} className="flex-1">
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
