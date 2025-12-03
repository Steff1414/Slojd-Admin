import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Search, Building2, Check, X, CreditCard, Plus } from 'lucide-react';
import { Customer, CustomerCategory, CustomerTypeGroup } from '@/types/database';
import { CategoryBadge } from './CategoryBadge';

interface AddPayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS: { value: CustomerCategory; label: string }[] = [
  { value: 'Företag', label: 'Företag' },
  { value: 'Omsorg', label: 'Skola och Omsorg' },
  { value: 'Förening', label: 'Förening' },
  { value: 'Kommun och Region', label: 'Kommun och Region' },
];
const TYPE_GROUP_OPTIONS: CustomerTypeGroup[] = ['B2B', 'B2G'];

export function AddPayerModal({ open, onOpenChange, customerId, onSuccess }: AddPayerModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  // Existing payer search
  const [search, setSearch] = useState('');
  const [payers, setPayers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New payer form
  const [newPayerName, setNewPayerName] = useState('');
  const [newPayerCategory, setNewPayerCategory] = useState<CustomerCategory>('Företag');
  const [newPayerTypeGroup, setNewPayerTypeGroup] = useState<CustomerTypeGroup>('B2G');
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');

  useEffect(() => {
    if (!search || search.length < 2) {
      setPayers([]);
      return;
    }

    const searchPayers = async () => {
      setLoading(true);
      const searchTerm = `%${search}%`;
      
      // Find customers that are already payers for other customers, or any active B2B/B2G customer
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('is_active', true)
        .in('customer_type_group', ['B2B', 'B2G'])
        .or(`name.ilike.${searchTerm},bc_customer_number.ilike.${searchTerm}`)
        .limit(10);
      
      setPayers((data || []) as Customer[]);
      setLoading(false);
    };

    const debounce = setTimeout(searchPayers, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const selectExistingPayer = async (payer: Customer) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('customers')
        .update({ payer_customer_id: payer.id })
        .eq('id', customerId);

      if (error) throw error;

      await logAction('customer', customerId, 'update_payer', null, { payer_customer_id: payer.id });

      toast({ title: 'Betalare tillagd!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error setting payer:', error);
      toast({ title: 'Kunde inte sätta betalare', variant: 'destructive' });
    }
    setSaving(false);
  };

  const createNewPayer = async () => {
    if (!newPayerName.trim()) {
      toast({ title: 'Ange ett namn för betalaren', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Generate a unique BC number for the new payer
      const bcNumber = `PAY-${Date.now().toString(36).toUpperCase()}`;

      const { data: newPayer, error: createError } = await supabase
        .from('customers')
        .insert({
          name: newPayerName.trim(),
          bc_customer_number: bcNumber,
          customer_category: newPayerCategory,
          customer_type_group: newPayerTypeGroup,
          is_active: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      await logAction('customer', newPayer.id, 'create', null, newPayer);

      // Now set this as the payer
      const { error: updateError } = await supabase
        .from('customers')
        .update({ payer_customer_id: newPayer.id })
        .eq('id', customerId);

      if (updateError) throw updateError;

      await logAction('customer', customerId, 'update_payer', null, { payer_customer_id: newPayer.id });

      toast({ title: 'Ny betalare skapad och kopplad!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error creating payer:', error);
      toast({ title: 'Kunde inte skapa betalare', variant: 'destructive' });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSearch('');
    setPayers([]);
    setNewPayerName('');
    setNewPayerCategory('Företag');
    setNewPayerTypeGroup('B2G');
    setActiveTab('existing');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till betalare</DialogTitle>
          <DialogDescription>Välj en befintlig betalare eller skapa en ny</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing" className="gap-2">
              <Search className="h-4 w-4" />
              Befintlig
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Plus className="h-4 w-4" />
              Skapa ny
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Sök på namn eller BC-nummer..."
                className="pl-9"
              />
            </div>

            {/* Results */}
            <ScrollArea className="h-64">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Söker...</div>
              ) : payers.length === 0 && search.length >= 2 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Inga betalare hittades
                </div>
              ) : (
                <div className="space-y-2">
                  {payers.map((payer) => (
                    <button
                      key={payer.id}
                      onClick={() => selectExistingPayer(payer)}
                      disabled={saving}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                    >
                      <div className="w-10 h-10 rounded-lg bg-payer/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-payer" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{payer.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{payer.bc_customer_number}</p>
                      </div>
                      <CategoryBadge category={payer.customer_category} />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Namn *</Label>
                <Input
                  value={newPayerName}
                  onChange={(e) => setNewPayerName(e.target.value)}
                  placeholder="t.ex. Göteborgs kommun"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori</Label>
                  <Select value={newPayerCategory} onValueChange={(v) => setNewPayerCategory(v as CustomerCategory)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Kundgrupp</Label>
                  <Select value={newPayerTypeGroup} onValueChange={(v) => setNewPayerTypeGroup(v as CustomerTypeGroup)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_GROUP_OPTIONS.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={createNewPayer} disabled={saving || !newPayerName.trim()} className="w-full gap-2">
                <Check className="h-4 w-4" />
                {saving ? 'Skapar...' : 'Skapa och koppla betalare'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
