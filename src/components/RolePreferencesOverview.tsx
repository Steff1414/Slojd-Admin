import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge, RelationshipBadge } from '@/components/CategoryBadge';
import { ContactCustomerLink, Customer } from '@/types/database';
import { Building2, School, Bell, MessageSquare, Mail, Sparkles } from 'lucide-react';

interface RoleWithCustomer extends ContactCustomerLink {
  customer: Customer;
}

interface RolePreferencesOverviewProps {
  customerLinks: RoleWithCustomer[];
}

export function RolePreferencesOverview({ customerLinks }: RolePreferencesOverviewProps) {
  if (customerLinks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Kommunikationspreferenser per roll
        </CardTitle>
        <CardDescription>
          {customerLinks.length} {customerLinks.length === 1 ? 'roll' : 'roller'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {customerLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-start gap-4 p-3 rounded-lg bg-muted/30 border border-border"
            >
              {/* Customer Info */}
              <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center flex-shrink-0">
                {link.customer.customer_category === 'Skola' ? (
                  <School className="h-5 w-5 text-school" />
                ) : (
                  <Building2 className="h-5 w-5 text-customer" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link 
                    to={`/customers/${link.customer.id}`}
                    className="font-medium hover:text-primary transition-colors truncate"
                  >
                    {link.customer.name}
                  </Link>
                  <RelationshipBadge relationshipType={link.relationship_type} />
                  {link.is_primary && <Badge variant="outline" className="text-xs">Primär</Badge>}
                </div>
                <div className="mt-1">
                  <CategoryBadge category={link.customer.customer_category} />
                </div>

                {/* Preferences inline */}
                <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={link.wants_sms ?? false} disabled className="opacity-70" />
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`text-sm ${link.wants_sms ? 'text-foreground' : 'text-muted-foreground'}`}>
                      SMS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={link.wants_newsletter ?? false} disabled className="opacity-70" />
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`text-sm ${link.wants_newsletter ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Nyhetsbrev
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={link.wants_personalized_offers ?? false} disabled className="opacity-70" />
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={`text-sm ${link.wants_personalized_offers ? 'text-foreground' : 'text-muted-foreground'}`}>
                      Personaliserat
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
