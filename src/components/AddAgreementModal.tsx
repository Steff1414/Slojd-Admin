import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Check, FileText } from 'lucide-react';
import { Agreement } from '@/types/database';

interface AddAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  onSuccess: () => void;
}

export function AddAgreementModal({ open, onOpenChange, customerId, customerName, onSuccess }: AddAgreementModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgreements();
      // Default account name based on customer
      setAccountName(`Konto - ${customerName}`);
    }
  }, [open, customerName]);

  const fetchAgreements = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('agreements')
      .select('*')
      .eq('is_active', true)
      .order('name');
    setAgreements((data || []) as Agreement[]);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!selectedAgreementId) {
      toast({ title: 'Välj ett avtal', variant: 'destructive' });
      return;
    }

    if (!accountName.trim()) {
      toast({ title: 'Ange ett kontonamn', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Create account with the selected agreement
      const { data: account, error } = await supabase
        .from('accounts')
        .insert({
          name: accountName.trim(),
          customer_id: customerId,
          agreement_id: selectedAgreementId,
          is_default: false,
        })
        .select(`
          *,
          agreement:agreement_id (*)
        `)
        .single();

      if (error) throw error;

      await logAction('account', account.id, 'create', null, account);

      toast({ title: 'Avtal tillagt!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding agreement:', error);
      toast({ title: 'Kunde inte lägga till avtal', variant: 'destructive' });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSelectedAgreementId('');
    setAccountName('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Lägg till avtal
          </DialogTitle>
          <DialogDescription>Välj ett standardavtal för kunden</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Avtal *</Label>
            {loading ? (
              <div className="h-10 bg-muted rounded animate-pulse" />
            ) : (
              <Select value={selectedAgreementId} onValueChange={setSelectedAgreementId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj avtal..." />
                </SelectTrigger>
                <SelectContent>
                  {agreements.map((agreement) => (
                    <SelectItem key={agreement.id} value={agreement.id}>
                      <div className="flex flex-col">
                        <span>{agreement.name}</span>
                        {agreement.description && (
                          <span className="text-xs text-muted-foreground">{agreement.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Kontonamn *</Label>
            <Input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="t.ex. Huvudkonto"
            />
            <p className="text-xs text-muted-foreground">
              Ett konto skapas med det valda avtalet
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving || !selectedAgreementId} className="flex-1 gap-2">
              <Check className="h-4 w-4" />
              {saving ? 'Sparar...' : 'Lägg till'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
