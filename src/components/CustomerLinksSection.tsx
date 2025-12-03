import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { CategoryBadge, RelationshipBadge } from './CategoryBadge';
import { Building2, Plus, School, Trash2 } from 'lucide-react';
import { ContactCustomerLink, Customer } from '@/types/database';

interface CustomerLinksSectionProps {
  customerLinks: (ContactCustomerLink & { customer: Customer })[];
  onAddCustomer: () => void;
  onUpdate: () => void;
}

export function CustomerLinksSection({ customerLinks, onAddCustomer, onUpdate }: CustomerLinksSectionProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<(ContactCustomerLink & { customer: Customer }) | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteClick = (link: ContactCustomerLink & { customer: Customer }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLinkToDelete(link);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!linkToDelete) return;
    setDeleting(true);

    try {
      const { error } = await supabase
        .from('contact_customer_links')
        .delete()
        .eq('id', linkToDelete.id);

      if (error) throw error;

      await logAction('contact_customer_link', linkToDelete.id, 'delete', JSON.parse(JSON.stringify(linkToDelete)), null);

      toast({ title: 'Koppling borttagen', description: `Koppling till ${linkToDelete.customer.name} har tagits bort` });
      onUpdate();
    } catch (error) {
      console.error('Error deleting customer link:', error);
      toast({ title: 'Kunde inte ta bort koppling', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-customer" />
                Kopplingar till kunder ({customerLinks.length})
              </CardTitle>
              <CardDescription>Kunder som denna kontakt är kopplad till</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onAddCustomer} className="gap-2">
              <Plus className="h-4 w-4" />
              Lägg till kund
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customerLinks.length === 0 ? (
            <p className="text-muted-foreground">Inga kopplingar</p>
          ) : (
            <div className="space-y-3">
              {customerLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <Link
                    to={`/customers/${link.customer.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center flex-shrink-0">
                      {link.customer.customer_category === 'Skola' ? (
                        <School className="h-5 w-5 text-school" />
                      ) : (
                        <Building2 className="h-5 w-5 text-customer" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{link.customer.name}</p>
                      <CategoryBadge category={link.customer.customer_category} />
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <RelationshipBadge relationshipType={link.relationship_type} />
                    {link.is_primary && <Badge variant="outline">Primär</Badge>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteClick(link, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort kundkoppling</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort kopplingen till {linkToDelete?.customer.name}? 
              Detta påverkar inte kunden eller kontakten, bara kopplingen mellan dem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Tar bort...' : 'Ta bort'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
