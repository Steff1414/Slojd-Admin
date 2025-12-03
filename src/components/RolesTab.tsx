import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge, RelationshipBadge } from '@/components/CategoryBadge';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ContactCustomerLink, Customer } from '@/types/database';
import { Building2, School, Save, Bell, ChevronDown, ChevronUp } from 'lucide-react';

interface RoleWithCustomer extends ContactCustomerLink {
  customer: Customer;
  wants_sms?: boolean;
  wants_newsletter?: boolean;
  wants_personalized_offers?: boolean;
}

interface RolesTabProps {
  customerLinks: RoleWithCustomer[];
  onUpdate: () => void;
}

export function RolesTab({ customerLinks, onUpdate }: RolesTabProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<Record<string, {
    wants_sms: boolean;
    wants_newsletter: boolean;
    wants_personalized_offers: boolean;
  }>>(() => {
    const initial: Record<string, any> = {};
    customerLinks.forEach(link => {
      initial[link.id] = {
        wants_sms: link.wants_sms ?? false,
        wants_newsletter: link.wants_newsletter ?? false,
        wants_personalized_offers: link.wants_personalized_offers ?? false,
      };
    });
    return initial;
  });

  const handleToggle = (linkId: string, field: 'wants_sms' | 'wants_newsletter' | 'wants_personalized_offers') => {
    setPreferences(prev => ({
      ...prev,
      [linkId]: {
        ...prev[linkId],
        [field]: !prev[linkId]?.[field],
      },
    }));
  };

  const handleSave = async (linkId: string) => {
    const link = customerLinks.find(l => l.id === linkId);
    if (!link) return;

    setSaving(linkId);
    const prefs = preferences[linkId];
    
    const beforeSnapshot = {
      wants_sms: link.wants_sms,
      wants_newsletter: link.wants_newsletter,
      wants_personalized_offers: link.wants_personalized_offers,
    };

    const { error } = await supabase
      .from('contact_customer_links')
      .update({
        wants_sms: prefs.wants_sms,
        wants_newsletter: prefs.wants_newsletter,
        wants_personalized_offers: prefs.wants_personalized_offers,
      })
      .eq('id', linkId);

    if (error) {
      toast({ title: 'Kunde inte spara', description: error.message, variant: 'destructive' });
      setSaving(null);
      return;
    }

    await logAction('contact_customer_link', linkId, 'update', beforeSnapshot as any, prefs as any);
    toast({ title: 'Preferenser sparade' });
    setSaving(null);
    onUpdate();
  };

  const hasChanges = (linkId: string) => {
    const link = customerLinks.find(l => l.id === linkId);
    if (!link) return false;
    const prefs = preferences[linkId];
    return (
      prefs.wants_sms !== (link.wants_sms ?? false) ||
      prefs.wants_newsletter !== (link.wants_newsletter ?? false) ||
      prefs.wants_personalized_offers !== (link.wants_personalized_offers ?? false)
    );
  };

  if (customerLinks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Roller & Kommunikationspreferenser
          </CardTitle>
          <CardDescription>Inga kundkopplingar att konfigurera</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Lägg till kundkopplingar för att kunna ställa in kommunikationspreferenser per roll.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Roller & Kommunikationspreferenser
        </CardTitle>
        <CardDescription>
          Hantera kommunikationspreferenser för varje roll ({customerLinks.length} {customerLinks.length === 1 ? 'roll' : 'roller'})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {customerLinks.map((link) => {
          const isExpanded = expandedRole === link.id;
          const prefs = preferences[link.id] || { wants_sms: false, wants_newsletter: false, wants_personalized_offers: false };
          const changed = hasChanges(link.id);

          return (
            <div
              key={link.id}
              className="border border-border rounded-lg overflow-hidden"
            >
              {/* Role Header */}
              <button
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
                onClick={() => setExpandedRole(isExpanded ? null : link.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center">
                    {link.customer.customer_category === 'Skola' ? (
                      <School className="h-5 w-5 text-school" />
                    ) : (
                      <Building2 className="h-5 w-5 text-customer" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{link.customer.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <CategoryBadge category={link.customer.customer_category} />
                      <RelationshipBadge relationshipType={link.relationship_type} />
                      {link.is_primary && <Badge variant="outline" className="text-xs">Primär</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {changed && <Badge variant="secondary" className="text-xs">Osparade ändringar</Badge>}
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Preferences */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-border bg-muted/30">
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={prefs.wants_sms}
                        onCheckedChange={() => handleToggle(link.id, 'wants_sms')}
                      />
                      <span className="text-sm">Vill få SMS med erbjudanden</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={prefs.wants_newsletter}
                        onCheckedChange={() => handleToggle(link.id, 'wants_newsletter')}
                      />
                      <span className="text-sm">Vill få e-post med nyhetsbrev</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        checked={prefs.wants_personalized_offers}
                        onCheckedChange={() => handleToggle(link.id, 'wants_personalized_offers')}
                      />
                      <span className="text-sm">Vill få personaliserade erbjudanden baserat på köphistorik</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <Link
                      to={`/customers/${link.customer.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      Visa kund →
                    </Link>
                    <Button
                      size="sm"
                      onClick={() => handleSave(link.id)}
                      disabled={!changed || saving === link.id}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      {saving === link.id ? 'Sparar...' : 'Spara'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
