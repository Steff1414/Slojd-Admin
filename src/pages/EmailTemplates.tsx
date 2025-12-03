import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { EmailTemplate, Contact } from '@/types/database';
import { Mail, Plus, Pencil, Eye, Search, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

const CATEGORIES = [
  { value: 'WELCOME', label: 'Välkommen' },
  { value: 'ORDER_CONFIRMATION', label: 'Orderbekräftelse' },
  { value: 'ORDER_RECEIVED', label: 'Order mottagen' },
  { value: 'ORDER_DELIVERED', label: 'Order levererad' },
  { value: 'PURCHASE_THANK_YOU', label: 'Tack för köp' },
  { value: 'RECEIPT', label: 'Kvitto' },
  { value: 'ABANDONED_CART_REMINDER', label: 'Övergiven varukorg' },
  { value: 'NEWSLETTER', label: 'Nyhetsbrev' },
  { value: 'OTHER', label: 'Övrigt' },
];

export default function EmailTemplates() {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Edit form
  const [form, setForm] = useState({
    template_key: '',
    name: '',
    category: 'OTHER',
    subject_template: '',
    body_template: '',
    description: '',
    is_active: true,
  });

  // Preview
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('name');
    
    setTemplates((data || []) as EmailTemplate[]);
    setLoading(false);
  };

  const filteredTemplates = templates.filter(t => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (activeFilter === 'active' && !t.is_active) return false;
    if (activeFilter === 'inactive' && t.is_active) return false;
    return true;
  });

  const openEditModal = (template?: EmailTemplate) => {
    if (template) {
      setSelectedTemplate(template);
      setForm({
        template_key: template.template_key,
        name: template.name,
        category: template.category || 'OTHER',
        subject_template: template.subject_template,
        body_template: template.body_template,
        description: template.description || '',
        is_active: template.is_active,
      });
    } else {
      setSelectedTemplate(null);
      setForm({
        template_key: '',
        name: '',
        category: 'OTHER',
        subject_template: '',
        body_template: '',
        description: '',
        is_active: true,
      });
    }
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.template_key.trim() || !form.name.trim() || !form.subject_template.trim()) {
      toast({ title: 'Fyll i obligatoriska fält', variant: 'destructive' });
      return;
    }

    setSaving(true);

    if (selectedTemplate) {
      const { error } = await supabase
        .from('email_templates')
        .update({
          name: form.name,
          category: form.category as any,
          subject_template: form.subject_template,
          body_template: form.body_template,
          description: form.description || null,
          is_active: form.is_active,
        })
        .eq('id', selectedTemplate.id);

      if (error) {
        toast({ title: 'Kunde inte uppdatera mall', description: error.message, variant: 'destructive' });
      } else {
        await logAction('email_template', selectedTemplate.id, 'update', selectedTemplate as any, form as any);
        toast({ title: 'Mall uppdaterad' });
      }
    } else {
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          template_key: form.template_key.toUpperCase().replace(/\s+/g, '_'),
          name: form.name,
          category: form.category as any,
          subject_template: form.subject_template,
          body_template: form.body_template,
          description: form.description || null,
          is_active: form.is_active,
        })
        .select()
        .single();

      if (error) {
        toast({ title: 'Kunde inte skapa mall', description: error.message, variant: 'destructive' });
      } else {
        await logAction('email_template', data.id, 'create', null, data as any);
        toast({ title: 'Mall skapad' });
      }
    }

    setSaving(false);
    setEditModalOpen(false);
    fetchTemplates();
  };

  const toggleActive = async (template: EmailTemplate) => {
    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: !template.is_active })
      .eq('id', template.id);

    if (!error) {
      await logAction('email_template', template.id, 'update', { is_active: template.is_active } as any, { is_active: !template.is_active } as any);
      fetchTemplates();
    }
  };

  const openPreview = async (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setPreviewContact(null);
    setContactSearch('');
    setSearchResults([]);
    setPreviewModalOpen(true);
  };

  const searchContacts = async () => {
    if (!contactSearch.trim()) return;
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .or(`first_name.ilike.%${contactSearch}%,last_name.ilike.%${contactSearch}%,email.ilike.%${contactSearch}%`)
      .is('merged_into_id', null)
      .limit(10);
    setSearchResults((data || []) as Contact[]);
  };

  const resolvePlaceholders = (text: string) => {
    if (!previewContact) return text;
    return text
      .replace(/\{\{firstName\}\}/g, previewContact.first_name)
      .replace(/\{\{lastName\}\}/g, previewContact.last_name)
      .replace(/\{\{email\}\}/g, previewContact.email)
      .replace(/\{\{orderNumber\}\}/g, 'ORD-123456')
      .replace(/\{\{orderTotal\}\}/g, '1 234,50')
      .replace(/\{\{basketLink\}\}/g, 'https://example.com/cart/demo');
  };

  const getCategoryLabel = (category?: string | null) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat?.label || 'Övrigt';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-3">
              <Mail className="h-8 w-8 text-primary" />
              E-postmallar
            </h1>
            <p className="text-muted-foreground mt-1">
              Hantera e-postmallar för automatisk och manuell kommunikation
            </p>
          </div>
          <Button onClick={() => openEditModal()} className="gap-2">
            <Plus className="h-4 w-4" />
            Ny mall
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Kategori</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={activeFilter} onValueChange={setActiveFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="active">Aktiva</SelectItem>
                    <SelectItem value="inactive">Inaktiva</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{filteredTemplates.length} mallar</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>Mallnyckel</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uppdaterad</TableHead>
                    <TableHead className="text-right">Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{template.template_key}</code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getCategoryLabel(template.category)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.is_active ? 'default' : 'secondary'}>
                          {template.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(template.updated_at), 'd MMM yyyy', { locale: sv })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openPreview(template)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(template)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleActive(template)}>
                            {template.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate ? 'Redigera mall' : 'Ny e-postmall'}</DialogTitle>
            <DialogDescription>Konfigurera mallens innehåll och inställningar</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Mallnyckel *</Label>
                <Input
                  value={form.template_key}
                  onChange={(e) => setForm({ ...form, template_key: e.target.value })}
                  placeholder="ORDER_CONFIRMED"
                  disabled={!!selectedTemplate}
                  className={selectedTemplate ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>Namn *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Orderbekräftelse"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beskrivning</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Skickas när order bekräftas"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ämnesrad *</Label>
              <Input
                value={form.subject_template}
                onChange={(e) => setForm({ ...form, subject_template: e.target.value })}
                placeholder="Tack för din beställning #{{orderNumber}}"
              />
              <p className="text-xs text-muted-foreground">
                Platshållare: {'{{firstName}}, {{lastName}}, {{orderNumber}}, {{orderTotal}}'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Innehåll (HTML)</Label>
              <Textarea
                value={form.body_template}
                onChange={(e) => setForm({ ...form, body_template: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                placeholder="<h1>Hej {{firstName}}!</h1><p>Tack för din beställning.</p>"
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(c) => setForm({ ...form, is_active: c })}
              />
              <Label htmlFor="is_active">Aktiv</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Avbryt</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {selectedTemplate ? 'Spara' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Förhandsgranska: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>Välj en kontakt för att se hur mallen renderas</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök kontakt..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchContacts()}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" onClick={searchContacts}>Sök</Button>
            </div>

            {searchResults.length > 0 && !previewContact && (
              <div className="border rounded-lg max-h-[150px] overflow-y-auto">
                {searchResults.map(contact => (
                  <div
                    key={contact.id}
                    className="p-2 hover:bg-muted cursor-pointer"
                    onClick={() => setPreviewContact(contact)}
                  >
                    <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  </div>
                ))}
              </div>
            )}

            {previewContact && (
              <div className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium">{previewContact.first_name} {previewContact.last_name}</p>
                  <p className="text-sm text-muted-foreground">{previewContact.email}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setPreviewContact(null)}>Byt</Button>
              </div>
            )}

            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Ämne</Label>
                  <p className="font-medium">{resolvePlaceholders(selectedTemplate.subject_template)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Innehåll</Label>
                  <div 
                    className="p-4 bg-background border rounded-lg prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: resolvePlaceholders(selectedTemplate.body_template) }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewModalOpen(false)}>Stäng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
