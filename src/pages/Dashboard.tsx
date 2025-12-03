import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataQualityScan } from '@/components/DataQualityScan';
import { RecentMessagesCard } from '@/components/dashboard/RecentMessagesCard';
import { BrowsingStatsCard } from '@/components/dashboard/BrowsingStatsCard';
import { Building2, Users, GraduationCap, School, CreditCard, UserCheck } from 'lucide-react';
import { Customer, Contact } from '@/types/database';
import { CategoryBadge, TypeGroupBadge } from '@/components/CategoryBadge';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  totalTeachers: number;
  totalSchools: number;
  totalPayers: number;
  categoryCounts: Record<string, number>;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalContacts: 0,
    totalTeachers: 0,
    totalSchools: 0,
    totalPayers: 0,
    categoryCounts: {},
  });
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [recentContacts, setRecentContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch customers
        const { data: customers } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch contacts
        const { data: contacts } = await supabase
          .from('contacts')
          .select('*')
          .order('created_at', { ascending: false });

        if (customers && contacts) {
          const categoryCounts: Record<string, number> = {};
          customers.forEach((c) => {
            categoryCounts[c.customer_category] = (categoryCounts[c.customer_category] || 0) + 1;
          });

          setStats({
            totalCustomers: customers.length,
            totalContacts: contacts.length,
            totalTeachers: contacts.filter((c) => c.is_teacher).length,
            totalSchools: customers.filter((c) => c.customer_category === 'Skola').length,
            totalPayers: customers.filter((c) => c.customer_category === 'Omsorg').length,
            categoryCounts,
          });

          setRecentCustomers(customers.slice(0, 5) as Customer[]);
          setRecentContacts(contacts.slice(0, 5) as Contact[]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Översikt av kunder, kontakter och relationer
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Totalt antal kunder"
            value={stats.totalCustomers}
            icon={Building2}
            color="customer"
            onClick={() => navigate('/customers')}
          />
          <StatCard
            title="Kontakter"
            value={stats.totalContacts}
            icon={Users}
            color="contact"
            onClick={() => navigate('/contacts')}
          />
          <StatCard
            title="Lärare"
            value={stats.totalTeachers}
            icon={GraduationCap}
            color="teacher"
            onClick={() => navigate('/teachers')}
          />
          <StatCard
            title="Skolor"
            value={stats.totalSchools}
            icon={School}
            color="school"
            onClick={() => navigate('/customers?category=Skola')}
          />
        </div>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Kunder per kategori</CardTitle>
            <CardDescription>Fördelning av kunder efter kundkategori</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(stats.categoryCounts).map(([category, count]) => (
                <Link
                  key={category}
                  to={`/customers?category=${category}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                  <CategoryBadge category={category as Customer['customer_category']} />
                  <span className="font-semibold text-foreground">{count}</span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent items */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Senaste kunderna</CardTitle>
                <CardDescription>De senast tillagda kunderna</CardDescription>
              </div>
              <Link
                to="/customers"
                className="text-sm font-medium text-primary hover:underline"
              >
                Visa alla
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCustomers.map((customer) => (
                  <Link
                    key={customer.id}
                    to={`/customers/${customer.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-customer/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-customer" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.bc_customer_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={customer.customer_category} />
                      <TypeGroupBadge typeGroup={customer.customer_type_group} />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Contacts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Senaste kontakterna</CardTitle>
                <CardDescription>De senast tillagda kontakterna</CardDescription>
              </div>
              <Link
                to="/contacts"
                className="text-sm font-medium text-primary hover:underline"
              >
                Visa alla
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentContacts.map((contact) => (
                  <Link
                    key={contact.id}
                    to={`/contacts/${contact.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-contact/10 flex items-center justify-center">
                        {contact.is_teacher ? (
                          <GraduationCap className="h-5 w-5 text-teacher" />
                        ) : (
                          <UserCheck className="h-5 w-5 text-contact" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{contact.email}</p>
                      </div>
                    </div>
                    {contact.is_teacher && (
                      <Badge variant="teacher">Lärare</Badge>
                    )}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication & Browsing Stats */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RecentMessagesCard />
          <BrowsingStatsCard />
        </div>

        {/* Data Quality Scan */}
        <DataQualityScan />
      </div>
    </AppLayout>
  );
}
