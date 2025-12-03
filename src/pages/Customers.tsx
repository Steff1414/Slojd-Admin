import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategoryBadge, TypeGroupBadge } from '@/components/CategoryBadge';
import { Customer, CustomerCategory, CustomerTypeGroup } from '@/types/database';
import { Search, Building2, Filter, X, Plus } from 'lucide-react';

const categories: CustomerCategory[] = ['Privat', 'Personal', 'Företag', 'ÅF', 'UF', 'Skola', 'Omsorg', 'Förening'];
const typeGroups: CustomerTypeGroup[] = ['B2C', 'B2B', 'B2G'];

export default function Customers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [customers, setCustomers] = useState<(Customer & { payer: Customer | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>(searchParams.get('category') || 'all');
  const [typeGroupFilter, setTypeGroupFilter] = useState<string>(searchParams.get('typeGroup') || 'all');

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        let query = supabase
          .from('customers')
          .select(`
            *,
            payer:payer_customer_id (
              id,
              name,
              bc_customer_number
            )
          `)
          .order('name');

        if (categoryFilter && categoryFilter !== 'all') {
          query = query.eq('customer_category', categoryFilter as CustomerCategory);
        }
        if (typeGroupFilter && typeGroupFilter !== 'all') {
          query = query.eq('customer_type_group', typeGroupFilter as CustomerTypeGroup);
        }

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(searchLower) ||
              c.bc_customer_number.toLowerCase().includes(searchLower)
          );
        }

        setCustomers(filtered as (Customer & { payer: Customer | null })[]);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [categoryFilter, typeGroupFilter, search]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter && categoryFilter !== 'all') params.set('category', categoryFilter);
    if (typeGroupFilter && typeGroupFilter !== 'all') params.set('typeGroup', typeGroupFilter);
    setSearchParams(params);
  }, [search, categoryFilter, typeGroupFilter, setSearchParams]);

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeGroupFilter('all');
  };

  const hasFilters = search || (categoryFilter && categoryFilter !== 'all') || (typeGroupFilter && typeGroupFilter !== 'all');

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Kunder</h1>
          <p className="text-muted-foreground mt-1">
            Hantera kunder, företag, skolor och kommuner
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på namn eller kundnummer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Alla kategorier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla kategorier</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeGroupFilter} onValueChange={setTypeGroupFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Alla typer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alla typer</SelectItem>
                  {typeGroups.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="icon" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Laddar...</div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Inga kunder hittades
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>Kundnummer (BC)</th>
                      <th>Kategori</th>
                      <th>Typ</th>
                      <th>Betalare</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>
                          <Link
                            to={`/customers/${customer.id}`}
                            className="flex items-center gap-3 hover:text-primary transition-colors"
                          >
                            <div className="w-9 h-9 rounded-lg bg-customer/10 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-customer" />
                            </div>
                            <span className="font-medium">{customer.name}</span>
                          </Link>
                        </td>
                        <td className="font-mono text-sm text-muted-foreground">
                          {customer.bc_customer_number}
                        </td>
                        <td>
                          <CategoryBadge category={customer.customer_category} />
                        </td>
                        <td>
                          <TypeGroupBadge typeGroup={customer.customer_type_group} />
                        </td>
                        <td>
                          {customer.payer ? (
                            <Link
                              to={`/customers/${customer.payer.id}`}
                              className="text-payer hover:underline"
                            >
                              {customer.payer.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-muted-foreground">
          Visar {customers.length} {customers.length === 1 ? 'kund' : 'kunder'}
        </p>
      </div>
    </AppLayout>
  );
}
