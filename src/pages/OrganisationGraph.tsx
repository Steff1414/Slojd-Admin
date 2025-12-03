import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Customer } from '@/types/database';
import {
  Network,
  Building2,
  School,
  CreditCard,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  Search,
  ExternalLink,
} from 'lucide-react';

interface PayerWithDependents {
  payer: Customer;
  dependents: {
    customer: Customer;
    teachers?: { id: string; name: string }[];
  }[];
}

export default function OrganisationGraph() {
  const [data, setData] = useState<PayerWithDependents[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedPayers, setExpandedPayers] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      // Find all payers (customers that other customers reference as payer)
      const { data: allCustomers } = await supabase
        .from('customers')
        .select('*')
        .in('customer_type_group', ['B2B', 'B2G']);

      if (!allCustomers) {
        setLoading(false);
        return;
      }

      // Group by payer
      const payerIds = new Set<string>();
      allCustomers.forEach(c => {
        if (c.payer_customer_id) {
          payerIds.add(c.payer_customer_id);
        }
      });

      // Fetch payer details
      const payersList: Customer[] = [];
      for (const payerId of payerIds) {
        const payer = allCustomers.find(c => c.id === payerId);
        if (payer) {
          payersList.push(payer as Customer);
        } else {
          // Payer might not be in B2B/B2G filter
          const { data: fetchedPayer } = await supabase
            .from('customers')
            .select('*')
            .eq('id', payerId)
            .single();
          if (fetchedPayer) {
            payersList.push(fetchedPayer as Customer);
          }
        }
      }

      // For each payer, get dependents
      const result: PayerWithDependents[] = [];

      for (const payer of payersList) {
        const dependents = allCustomers.filter(c => c.payer_customer_id === payer.id);

        // Get teachers for schools
        const schoolIds = dependents.filter(d => d.customer_category === 'Skola').map(d => d.id);
        let teachersBySchool: Record<string, { id: string; name: string }[]> = {};

        if (schoolIds.length > 0) {
          const { data: assignments } = await supabase
            .from('teacher_school_assignments')
            .select(`
              school_customer_id,
              teacher:teacher_contact_id (id, first_name, last_name)
            `)
            .in('school_customer_id', schoolIds)
            .eq('is_active', true);

          if (assignments) {
            assignments.forEach(a => {
              const schoolId = a.school_customer_id;
              if (!teachersBySchool[schoolId]) teachersBySchool[schoolId] = [];
              const teacher = a.teacher as any;
              if (teacher) {
                teachersBySchool[schoolId].push({
                  id: teacher.id,
                  name: `${teacher.first_name} ${teacher.last_name}`,
                });
              }
            });
          }
        }

        result.push({
          payer: payer,
          dependents: dependents.map(d => ({
            customer: d as Customer,
            teachers: d.customer_category === 'Skola' ? teachersBySchool[d.id] : undefined,
          })),
        });
      }

      // Sort by number of dependents
      result.sort((a, b) => b.dependents.length - a.dependents.length);

      setData(result);
      setLoading(false);
    }

    fetchData();
  }, []);

  const togglePayer = (payerId: string) => {
    const next = new Set(expandedPayers);
    if (next.has(payerId)) {
      next.delete(payerId);
    } else {
      next.add(payerId);
    }
    setExpandedPayers(next);
  };

  const filteredData = data.filter(item => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    if (item.payer.name.toLowerCase().includes(searchLower)) return true;
    return item.dependents.some(d => d.customer.name.toLowerCase().includes(searchLower));
  });

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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Organisationsöversikt</h1>
            <p className="text-muted-foreground">
              Grafisk vy över betalare och deras underliggande organisationer
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök betalare eller organisation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{data.length}</div>
              <p className="text-sm text-muted-foreground">Betalare (toppnoder)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {data.reduce((acc, d) => acc + d.dependents.length, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Underliggande organisationer</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">
                {data.reduce((acc, d) => acc + d.dependents.filter(dep => dep.customer.customer_category === 'Skola').length, 0)}
              </div>
              <p className="text-sm text-muted-foreground">Skolor</p>
            </CardContent>
          </Card>
        </div>

        {/* Graph */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Betalarstruktur</CardTitle>
            <CardDescription>
              Klicka på en betalare för att expandera och se underliggande organisationer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredData.length === 0 ? (
              <p className="text-muted-foreground">Inga betalare hittades</p>
            ) : (
              filteredData.map((item) => (
                <Collapsible
                  key={item.payer.id}
                  open={expandedPayers.has(item.payer.id)}
                  onOpenChange={() => togglePayer(item.payer.id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-payer/5 hover:bg-payer/10 cursor-pointer border border-payer/20">
                      <div className="flex items-center gap-3">
                        {expandedPayers.has(item.payer.id) ? (
                          <ChevronDown className="h-5 w-5 text-payer" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-payer" />
                        )}
                        <CreditCard className="h-5 w-5 text-payer" />
                        <div>
                          <p className="font-semibold">{item.payer.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.payer.bc_customer_number}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="payer">{item.dependents.length} organisationer</Badge>
                        <Link to={`/customers/${item.payer.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-8 mt-2 border-l-2 border-border pl-4 space-y-2">
                      {item.dependents.map((dep) => (
                        <div key={dep.customer.id} className="space-y-1">
                          <Link
                            to={`/customers/${dep.customer.id}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              {dep.customer.customer_category === 'Skola' ? (
                                <School className="h-4 w-4 text-school" />
                              ) : (
                                <Building2 className="h-4 w-4 text-customer" />
                              )}
                              <span className="font-medium">{dep.customer.name}</span>
                              <Badge variant="secondary">{dep.customer.customer_category}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {dep.customer.bc_customer_number}
                            </span>
                          </Link>

                          {/* Teachers */}
                          {dep.teachers && dep.teachers.length > 0 && (
                            <div className="ml-8 border-l border-teacher/20 pl-3 py-1">
                              <p className="text-xs text-muted-foreground mb-1">
                                {dep.teachers.length} lärare
                              </p>
                              {dep.teachers.slice(0, 3).map((t) => (
                                <Link
                                  key={t.id}
                                  to={`/contacts/${t.id}`}
                                  className="flex items-center gap-2 p-1 rounded hover:bg-muted text-sm"
                                >
                                  <GraduationCap className="h-3 w-3 text-teacher" />
                                  <span>{t.name}</span>
                                </Link>
                              ))}
                              {dep.teachers.length > 3 && (
                                <p className="text-xs text-muted-foreground pl-5">
                                  +{dep.teachers.length - 3} fler
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
