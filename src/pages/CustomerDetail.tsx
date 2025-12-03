import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryBadge, TypeGroupBadge } from '@/components/CategoryBadge';
import { ContactsListSection } from '@/components/ContactsListSection';
import { ValidationPane } from '@/components/ValidationPane';
import { OrdersTab } from '@/components/OrdersTab';
import { AddContactModal } from '@/components/AddContactModal';
import { AddPayerModal } from '@/components/AddPayerModal';
import { AddAgreementModal } from '@/components/AddAgreementModal';
import { InlineEditCustomer } from '@/components/InlineEditCustomer';
import { PayerGraph } from '@/components/PayerGraph';
import { Customer, Contact, Account, Agreement, ContactCustomerLink, TeacherSchoolAssignment } from '@/types/database';
import {
  Building2,
  ArrowLeft,
  CreditCard,
  Users,
  GraduationCap,
  FileText,
  ExternalLink,
  School,
  ShoppingCart,
  Plus,
  UserCircle,
  Network,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerDetailData extends Customer {
  payer: Customer | null;
}

export default function CustomerDetail() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<CustomerDetailData | null>(null);
  const [paysFor, setPaysFor] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<(ContactCustomerLink & { contact: Contact })[]>([]);
  const [teachers, setTeachers] = useState<(TeacherSchoolAssignment & { teacher: Contact })[]>([]);
  const [accounts, setAccounts] = useState<(Account & { agreement: Agreement | null })[]>([]);
  const [validationItems, setValidationItems] = useState<{ type: 'error' | 'warning' | 'info'; message: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addPayerOpen, setAddPayerOpen] = useState(false);
  const [addAgreementOpen, setAddAgreementOpen] = useState(false);

  const fetchCustomerData = async () => {
    if (!id) return;
    setLoading(true);

    try {
      // Fetch customer with payer
      const { data: customerData } = await supabase
        .from('customers')
        .select(`
          *,
          payer:payer_customer_id (*)
        `)
        .eq('id', id)
        .single();

      if (customerData) {
        setCustomer(customerData as CustomerDetailData);

        // Fetch customers this customer pays for
        const { data: paysForData } = await supabase
          .from('customers')
          .select('*')
          .eq('payer_customer_id', id);
        setPaysFor((paysForData || []) as Customer[]);

        // Fetch linked contacts
        const { data: contactsData } = await supabase
          .from('contact_customer_links')
          .select(`
            *,
            contact:contact_id (*)
          `)
          .eq('customer_id', id);
        setContacts((contactsData || []) as (ContactCustomerLink & { contact: Contact })[]);

        // Fetch teachers if school
        let teachersData: (TeacherSchoolAssignment & { teacher: Contact })[] = [];
        if (customerData.customer_category === 'Skola') {
          const { data } = await supabase
            .from('teacher_school_assignments')
            .select(`
              *,
              teacher:teacher_contact_id (*)
            `)
            .eq('school_customer_id', id)
            .eq('is_active', true);
          teachersData = (data || []) as (TeacherSchoolAssignment & { teacher: Contact })[];
          setTeachers(teachersData);
        }

        // Fetch accounts
        const { data: accountsData } = await supabase
          .from('accounts')
          .select(`
            *,
            agreement:agreement_id (*)
          `)
          .eq('customer_id', id);
        setAccounts((accountsData || []) as (Account & { agreement: Agreement | null })[]);

        // Compute validation items
        const items: { type: 'error' | 'warning' | 'info'; message: string }[] = [];
        const isPayer = (paysForData || []).length > 0;
        const hasPrimary = (contactsData || []).some((l: ContactCustomerLink) => l.is_primary);
        
        // Only show contact warnings for non-payer customers
        if (!isPayer) {
          if (!hasPrimary && (contactsData || []).length > 0) {
            items.push({ type: 'warning', message: 'Ingen primär kontakt angiven' });
          }
          if ((contactsData || []).length === 0) {
            items.push({ type: 'info', message: 'Inga kontakter kopplade till kunden' });
          }
        }
        
        if (customerData.customer_category === 'Skola' && !customerData.payer_customer_id) {
          items.push({ type: 'warning', message: 'Skolan saknar betalare (kommun)' });
        }
        if (customerData.customer_category === 'Skola' && teachersData.length === 0) {
          items.push({ type: 'info', message: 'Inga lärare registrerade vid skolan' });
        }
        setValidationItems(items);
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const isPayer = paysFor.length > 0;
  const needsPayer = customer && ['Skola', 'Omsorg', 'Förening'].includes(customer.customer_category) && !customer.payer_customer_id;

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

  if (!customer) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Kunden hittades inte</p>
          <Link to="/customers" className="text-primary hover:underline mt-2 inline-block">
            Tillbaka till kundlistan
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Back button */}
        <Link to="/customers">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tillbaka
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          <div className="w-16 h-16 rounded-xl bg-customer/10 flex items-center justify-center flex-shrink-0">
            {customer.customer_category === 'Skola' ? (
              <School className="h-8 w-8 text-school" />
            ) : isPayer ? (
              <CreditCard className="h-8 w-8 text-payer" />
            ) : (
              <Building2 className="h-8 w-8 text-customer" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-3xl font-bold text-foreground">{customer.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <CategoryBadge category={customer.customer_category} />
              <TypeGroupBadge typeGroup={customer.customer_type_group} />
              {isPayer && <Badge variant="payer">Betalare</Badge>}
              {customer.is_active ? (
                <Badge variant="success">Aktiv</Badge>
              ) : (
                <Badge variant="destructive">Inaktiv</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for main content */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList>
            <TabsTrigger value="info">Översikt</TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Ordrar
            </TabsTrigger>
            {isPayer && (
              <TabsTrigger value="graph" className="gap-2">
                <Network className="h-4 w-4" />
                Graf
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {/* Details Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Info with Inline Edit */}
              <InlineEditCustomer customer={customer} onUpdate={fetchCustomerData} />

              {/* Payer Info - Only for B2B/B2G customers */}
              {customer.customer_type_group !== 'B2C' && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-payer" />
                          Betalare
                        </CardTitle>
                        <CardDescription>Vem som betalar för denna kund</CardDescription>
                      </div>
                      {needsPayer && !customer.payer && (
                        <Button variant="outline" size="sm" onClick={() => setAddPayerOpen(true)} className="gap-2">
                          <Plus className="h-4 w-4" />
                          Lägg till betalare
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {customer.payer ? (
                      <Link
                        to={`/customers/${customer.payer.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-payer/5 hover:bg-payer/10 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-payer/10 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-payer" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{customer.payer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.payer.bc_customer_number}
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground ml-auto" />
                      </Link>
                    ) : (
                      <p className="text-muted-foreground">Ingen betalare angiven</p>
                    )}

                    {paysFor.length > 0 && (
                      <div className="mt-6">
                        <p className="text-sm font-medium text-muted-foreground mb-3">
                          Betalar för ({paysFor.length})
                        </p>
                        <div className="space-y-2">
                          {paysFor.map((c) => (
                            <Link
                              key={c.id}
                              to={`/customers/${c.id}`}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                            >
                              <CategoryBadge category={c.customer_category} />
                              <span className="font-medium">{c.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Payer Contact Person - only for payers */}
            {isPayer && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-payer" />
                    Kontaktperson (betalare)
                  </CardTitle>
                  <CardDescription>Valfri kontaktperson för betalarkunden</CardDescription>
                </CardHeader>
                <CardContent>
                  {contacts.length > 0 ? (
                    <div className="space-y-3">
                      {contacts.slice(0, 1).map((link) => (
                        <Link
                          key={link.id}
                          to={`/contacts/${link.contact.id}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-payer/5 hover:bg-payer/10 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-contact/10 flex items-center justify-center">
                              <Users className="h-5 w-5 text-contact" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {link.contact.first_name} {link.contact.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">{link.contact.email}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">Ingen kontaktperson angiven (valfritt)</p>
                      <Button variant="outline" size="sm" onClick={() => setAddContactOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contacts */}
            <ContactsListSection
              contacts={contacts}
              customerId={id!}
              onAddContact={() => setAddContactOpen(true)}
              onUpdate={fetchCustomerData}
            />

            {/* Teachers (if school) */}
            {customer.customer_category === 'Skola' && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-teacher" />
                    Lärare vid denna skola ({teachers.length})
                  </CardTitle>
                  <CardDescription>Lärare som undervisar vid skolan</CardDescription>
                </CardHeader>
                <CardContent>
                  {teachers.length === 0 ? (
                    <p className="text-muted-foreground">Inga lärare registrerade</p>
                  ) : (
                    <div className="space-y-3">
                      {teachers.map((assignment) => (
                        <Link
                          key={assignment.id}
                          to={`/contacts/${assignment.teacher.id}`}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-teacher/10 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-teacher" />
                            </div>
                            <div>
                              <p className="font-medium">
                                {assignment.teacher.first_name} {assignment.teacher.last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.teacher.email}
                              </p>
                            </div>
                          </div>
                          {assignment.role && (
                            <Badge variant="secondary">{assignment.role}</Badge>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Accounts & Agreements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="font-display text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Konton & Avtal ({accounts.length})
                    </CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setAddAgreementOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Lägg till avtal
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {accounts.length === 0 ? (
                  <p className="text-muted-foreground">Inga konton</p>
                ) : (
                  <div className="space-y-3">
                    {accounts.map((account) => (
                      <div
                        key={account.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div>
                          <p className="font-medium">{account.name}</p>
                          {account.agreement && (
                            <p className="text-sm text-muted-foreground">
                              Avtal: {account.agreement.name}
                            </p>
                          )}
                        </div>
                        {account.is_default && <Badge variant="outline">Standard</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Pane - at bottom */}
            <ValidationPane items={validationItems} title="Datavalidering" />
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                  Ordrar
                </CardTitle>
                <CardDescription>Orderhistorik för denna kund</CardDescription>
              </CardHeader>
              <CardContent>
                <OrdersTab customerId={id} showBuyer={customer.customer_type_group !== 'B2C'} />
              </CardContent>
            </Card>
          </TabsContent>

          {isPayer && (
            <TabsContent value="graph">
              <PayerGraph customerId={id!} customerName={customer.name} />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Add Contact Modal */}
      <AddContactModal
        open={addContactOpen}
        onOpenChange={setAddContactOpen}
        customerId={id!}
        customerCategory={customer.customer_category}
        onSuccess={fetchCustomerData}
      />

      {/* Add Payer Modal */}
      <AddPayerModal
        open={addPayerOpen}
        onOpenChange={setAddPayerOpen}
        customerId={id!}
        onSuccess={fetchCustomerData}
      />

      {/* Add Agreement Modal */}
      <AddAgreementModal
        open={addAgreementOpen}
        onOpenChange={setAddAgreementOpen}
        customerId={id!}
        customerName={customer.name}
        onSuccess={fetchCustomerData}
      />
    </AppLayout>
  );
}
