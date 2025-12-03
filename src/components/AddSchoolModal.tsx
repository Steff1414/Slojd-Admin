import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Search, School, Check, X, Building2 } from 'lucide-react';
import { Customer } from '@/types/database';

interface AddSchoolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
  onSuccess: () => void;
}

export function AddSchoolModal({ open, onOpenChange, teacherId, onSuccess }: AddSchoolModalProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [search, setSearch] = useState('');
  const [schools, setSchools] = useState<(Customer & { payer?: Customer | null })[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<Customer | null>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!search || search.length < 2) {
      setSchools([]);
      return;
    }

    const searchSchools = async () => {
      setLoading(true);
      const searchTerm = `%${search}%`;
      const { data } = await supabase
        .from('customers')
        .select(`
          *,
          payer:payer_customer_id (id, name)
        `)
        .eq('customer_category', 'Skola')
        .eq('is_active', true)
        .or(`name.ilike.${searchTerm},bc_customer_number.ilike.${searchTerm}`)
        .limit(10);
      setSchools((data || []) as (Customer & { payer?: Customer | null })[]);
      setLoading(false);
    };

    const debounce = setTimeout(searchSchools, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const handleSave = async () => {
    if (!selectedSchool) return;
    setSaving(true);

    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('teacher_school_assignments')
        .select('id')
        .eq('teacher_contact_id', teacherId)
        .eq('school_customer_id', selectedSchool.id)
        .maybeSingle();

      if (existing) {
        toast({ title: 'Läraren är redan kopplad till denna skola', variant: 'destructive' });
        setSaving(false);
        return;
      }

      const { data, error } = await supabase
        .from('teacher_school_assignments')
        .insert({
          teacher_contact_id: teacherId,
          school_customer_id: selectedSchool.id,
          role: role || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await logAction('teacher_school_assignment', data.id, 'create', null, data);

      // Also create contact_customer_link if not exists
      const { data: linkExists } = await supabase
        .from('contact_customer_links')
        .select('id')
        .eq('contact_id', teacherId)
        .eq('customer_id', selectedSchool.id)
        .maybeSingle();

      if (!linkExists) {
        const { data: linkData, error: linkError } = await supabase
          .from('contact_customer_links')
          .insert({
            contact_id: teacherId,
            customer_id: selectedSchool.id,
            relationship_type: 'TeacherAtSchool',
            is_primary: false,
          })
          .select()
          .single();

        if (!linkError && linkData) {
          await logAction('contact_customer_link', linkData.id, 'create', null, linkData);
        }
      }

      toast({ title: 'Skolkoppling skapad!' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error('Error adding school:', error);
      toast({ title: 'Kunde inte lägga till skola', variant: 'destructive' });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setSearch('');
    setSchools([]);
    setSelectedSchool(null);
    setRole('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lägg till skola</DialogTitle>
          <DialogDescription>Sök och koppla läraren till en skola</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!selectedSchool ? (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök på skolnamn eller BC-nummer..."
                  className="pl-9"
                />
              </div>

              {/* Results */}
              <ScrollArea className="h-64">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Söker...</div>
                ) : schools.length === 0 && search.length >= 2 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">Inga skolor hittades</div>
                ) : (
                  <div className="space-y-2">
                    {schools.map((school) => (
                      <button
                        key={school.id}
                        onClick={() => setSelectedSchool(school)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-school/10 flex items-center justify-center">
                          <School className="h-5 w-5 text-school" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{school.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{school.bc_customer_number}</p>
                        </div>
                        {school.payer && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Building2 className="h-3 w-3" />
                            <span className="truncate max-w-24">{school.payer.name}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <>
              {/* Selected school */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-school/5 border border-school/20">
                <div className="w-10 h-10 rounded-lg bg-school/10 flex items-center justify-center">
                  <School className="h-5 w-5 text-school" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedSchool.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSchool.bc_customer_number}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedSchool(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label>Roll vid skolan (valfritt)</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="t.ex. Slöjdlärare, Klasslärare..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedSchool(null)} className="flex-1">
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
