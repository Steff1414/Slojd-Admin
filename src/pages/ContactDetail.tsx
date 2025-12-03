import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryBadge, ContactTypeBadge, RelationshipBadge } from '@/components/CategoryBadge';
import { ValidationPane } from '@/components/ValidationPane';
import { OrdersTab } from '@/components/OrdersTab';
import { AddSchoolModal } from '@/components/AddSchoolModal';
import { AddCustomerLinkModal } from '@/components/AddCustomerLinkModal';
import { InlineEditContact } from '@/components/InlineEditContact';
import { RolesTab } from '@/components/RolesTab';
import { RolePreferencesOverview } from '@/components/RolePreferencesOverview';
import { UserAccountManagement } from '@/components/UserAccountManagement';
import { MergeHistory } from '@/components/MergeHistory';
import { Contact, Customer, ContactCustomerLink, TeacherSchoolAssignment, Profile } from '@/types/database';
import {
  Users,
  ArrowLeft,
  GraduationCap,
  Building2,
  School,
  ExternalLink,
  ShoppingCart,
  Plus,
  Bell,
  KeyRound,
} from 'lucide-react';

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [customerLinks, setCustomerLinks] = useState<(ContactCustomerLink & { customer: Customer })[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<(TeacherSchoolAssignment & { school: Customer })[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [validationItems, setValidationItems] = useState<{ type: 'error' | 'warning' | 'info'; message: string }[]>([]);
  const [emailDuplicates, setEmailDuplicates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addSchoolOpen, setAddSchoolOpen] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);

  const fetchContactData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Fetch contact
      const { data: contactData } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (contactData) {
        setContact(contactData as Contact);

        // Fetch customer links
        const { data: linksData } = await supabase
          .from('contact_customer_links')
          .select(`
            *,
            customer:customer_id (*)
          `)
          .eq('contact_id', id);
        setCustomerLinks((linksData || []) as (ContactCustomerLink & { customer: Customer })[]);

        // Fetch teacher assignments if teacher
        let assignmentsData: (TeacherSchoolAssignment & { school: Customer })[] = [];
        if (contactData.is_teacher) {
          const { data } = await supabase
            .from('teacher_school_assignments')
            .select(`
              *,
              school:school_customer_id (*)
            `)
            .eq('teacher_contact_id', id)
            .eq('is_active', true);
          assignmentsData = (data || []) as (TeacherSchoolAssignment & { school: Customer })[];
          setTeacherAssignments(assignmentsData);
        }

        // Fetch profile/user info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('contact_id', id)
          .maybeSingle();
        setProfile(profileData as Profile | null);

        // Check for email duplicates
        const { count } = await supabase
          .from('contacts')
          .select('*', { count: 'exact', head: true })
          .eq('email', contactData.email)
          .is('merged_into_id', null);
        setEmailDuplicates(count || 0);

        // Compute validation items
        const items: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
        if ((count || 0) > 1) {
          items.push({ type: 'info', message: `E-postadressen delas av ${count} kontakter (tillåtet)` });
        }
        if (contactData.is_teacher && assignmentsData.length === 0) {
          items.push({ type: 'warning', message: 'Lärare saknar skolkoppling' });
        }
        if ((linksData || []).length === 0) {
          items.push({ type: 'info', message: 'Inga kundkopplingar' });
        }
        setValidationItems(items);
      }
    } catch (error) {
      console.error('Error fetching contact:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactData();
  }, [id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Kontakten hittades inte</p>
          <Link to="/contacts" className="text-primary hover:underline mt-2 inline-block">
            Tillbaka till kontaktlistan
          </Link>
        </div>
      </AppLayout>
    );
  }

  // Get school IDs for suggestions in AddCustomerLinkModal
  const suggestedSchoolIds = teacherAssignments.map(a => a.school.id);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Link to={contact.is_teacher ? '/teachers' : '/contacts'}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
        </Link>

        {/* Merge History Banner (if merged) */}
        <MergeHistory contactId={id!} />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <div className="w-16 h-16 rounded-full bg-contact/10 flex items-center justify-center flex-shrink-0">
            {contact.is_teacher ? (
              <GraduationCap className="h-8 w-8 text-teacher" />
            ) : (
              <Users className="h-8 w-8 text-contact" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {contact.first_name} {contact.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <ContactTypeBadge contactType={contact.contact_type} />
              {contact.is_teacher && <Badge variant="teacher">Lärare</Badge>}
              {profile && <Badge variant="outline" className="gap-1"><KeyRound className="h-3 w-3" />Har inloggning</Badge>}
            </div>
          </div>
        </div>

        {/* Tabs for main content */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Översikt</TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Bell className="h-4 w-4" />
              Roller
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Ordrar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Info with Inline Edit */}
              <InlineEditContact contact={contact} onUpdate={fetchContactData} />

              {/* Customer Links */}
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
                    <Button variant="outline" size="sm" onClick={() => setAddCustomerOpen(true)} className="gap-2">
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
                        <Link
                          key={link.id}
                          to={`/customers/${link.customer.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
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
                              <CategoryBadge category={link.customer.customer_category} />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RelationshipBadge relationshipType={link.relationship_type} />
                            {link.is_primary && <Badge variant="outline">Primär</Badge>}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Teacher Assignments */}
            {contact.is_teacher && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-display text-lg flex items-center gap-2">
                        <School className="h-5 w-5 text-school" />
                        Undervisar vid ({teacherAssignments.length})
                      </CardTitle>
                      <CardDescription>Skolor där denna lärare undervisar</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setAddSchoolOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Lägg till skola
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {teacherAssignments.length === 0 ? (
                    <p className="text-muted-foreground">Inga skolkopplingar</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {teacherAssignments.map((assignment) => (
                        <Link
                          key={assignment.id}
                          to={`/customers/${assignment.school.id}`}
                          className="flex items-center justify-between p-4 rounded-lg bg-school/5 hover:bg-school/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-school/10 flex items-center justify-center">
                              <School className="h-6 w-6 text-school" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{assignment.school.name}</p>
                              {assignment.role && (
                                <p className="text-sm text-muted-foreground">{assignment.role}</p>
                              )}
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* User Account Management */}
            {profile && (
              <UserAccountManagement 
                profile={profile} 
                contactId={id!}
                onUpdate={fetchContactData} 
              />
            )}

            {/* Role Preferences Overview */}
            <RolePreferencesOverview customerLinks={customerLinks} />

            {/* Validation Pane - at bottom */}
            <ValidationPane items={validationItems} title="Datavalidering" />
          </TabsContent>

          <TabsContent value="roles">
            <RolesTab customerLinks={customerLinks} onUpdate={fetchContactData} />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Ordrar
                </CardTitle>
                <CardDescription>Ordrar gjorda av denna kontakt</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersTab contactId={id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add School Modal */}
      {contact.is_teacher && (
        <AddSchoolModal
          open={addSchoolOpen}
          onOpenChange={setAddSchoolOpen}
          teacherId={id!}
          onSuccess={fetchContactData}
        />
      )}

      {/* Add Customer Link Modal */}
      <AddCustomerLinkModal
        open={addCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        contactId={id!}
        isTeacher={contact.is_teacher}
        suggestedSchoolIds={suggestedSchoolIds}
        onSuccess={fetchContactData}
      />
    </AppLayout>
  );
}
