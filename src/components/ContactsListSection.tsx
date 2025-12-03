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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { RelationshipBadge } from './CategoryBadge';
import { Users, Plus, GraduationCap, Trash2, Star } from 'lucide-react';
import { ContactCustomerLink, Contact } from '@/types/database';

interface ContactsListSectionProps {
  contacts: (ContactCustomerLink & { contact: Contact })[];
  customerId: string;
  onAddContact: () => void;
  onUpdate: () => void;
}

export function ContactsListSection({ contacts, customerId, onAddContact, onUpdate }: ContactsListSectionProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<(ContactCustomerLink & { contact: Contact }) | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState<string | null>(null);

  const handleDeleteClick = (link: ContactCustomerLink & { contact: Contact }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Don't allow deleting if it's the only contact
    if (contacts.length === 1) {
      toast({ 
        title: 'Kan inte ta bort', 
        description: 'En kund måste ha minst en kontakt',
        variant: 'destructive' 
      });
      return;
    }
    
    // Don't allow deleting the primary contact if there are others
    if (link.is_primary && contacts.length > 1) {
      toast({ 
        title: 'Byt primär kontakt först', 
        description: 'Du måste välja en annan primär kontakt innan du kan ta bort denna',
        variant: 'destructive' 
      });
      return;
    }
    
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

      toast({ title: 'Kontakt borttagen', description: `${linkToDelete.contact.first_name} ${linkToDelete.contact.last_name} har tagits bort` });
      onUpdate();
    } catch (error) {
      console.error('Error deleting contact link:', error);
      toast({ title: 'Kunde inte ta bort kontakt', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setLinkToDelete(null);
    }
  };

  const handleSetPrimary = async (link: ContactCustomerLink & { contact: Contact }, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (link.is_primary) return; // Already primary
    
    setSettingPrimary(link.id);

    try {
      // First, unset all other primary contacts for this customer
      await supabase
        .from('contact_customer_links')
        .update({ is_primary: false })
        .eq('customer_id', customerId)
        .eq('is_primary', true);

      // Then set this one as primary
      const { error } = await supabase
        .from('contact_customer_links')
        .update({ is_primary: true })
        .eq('id', link.id);

      if (error) throw error;

      await logAction('contact_customer_link', link.id, 'update', { is_primary: false }, { is_primary: true });

      toast({ 
        title: 'Primär kontakt ändrad', 
        description: `${link.contact.first_name} ${link.contact.last_name} är nu primär kontakt` 
      });
      onUpdate();
    } catch (error) {
      console.error('Error setting primary contact:', error);
      toast({ title: 'Kunde inte ändra primär kontakt', variant: 'destructive' });
    } finally {
      setSettingPrimary(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-contact" />
                Kontakter ({contacts.length})
              </CardTitle>
              <CardDescription>Kontakter kopplade till denna kund</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onAddContact} className="gap-2">
              <Plus className="h-4 w-4" />
              Lägg till kontakt
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <p className="text-muted-foreground">Inga kontakter kopplade</p>
          ) : (
            <div className="space-y-3">
              {contacts.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                >
                  <Link
                    to={`/contacts/${link.contact.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center flex-shrink-0">
                      {link.contact.is_teacher ? (
                        <GraduationCap className="h-5 w-5 text-teacher" />
                      ) : (
                        <Users className="h-5 w-5 text-contact" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {link.contact.first_name} {link.contact.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">{link.contact.email}</p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <RelationshipBadge relationshipType={link.relationship_type} />
                    {link.contact.is_teacher && <Badge variant="teacher">Lärare</Badge>}
                    
                    {/* Primary contact toggle */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={link.is_primary ? "default" : "ghost"}
                            size="icon"
                            className={`h-8 w-8 ${
                              link.is_primary 
                                ? 'bg-warning/20 text-warning hover:bg-warning/30' 
                                : 'opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-warning'
                            }`}
                            onClick={(e) => handleSetPrimary(link, e)}
                            disabled={settingPrimary === link.id || link.is_primary}
                          >
                            <Star className={`h-4 w-4 ${link.is_primary ? 'fill-warning' : ''}`} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {link.is_primary ? 'Primär kontakt' : 'Gör till primär kontakt'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Delete button */}
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
            <AlertDialogTitle>Ta bort kontakt</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort kopplingen till {linkToDelete?.contact.first_name} {linkToDelete?.contact.last_name}? 
              Detta påverkar inte kontakten, bara kopplingen till denna kund.
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
