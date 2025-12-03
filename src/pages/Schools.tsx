import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, School } from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { CustomerCategory } from '@/types/database';

interface SchoolCustomer {
  id: string;
  name: string;
  bc_customer_number: string;
  customer_category: CustomerCategory;
  customer_type_group: string;
  is_active: boolean;
  payer: { id: string; name: string } | null;
}

export default function Schools() {
  const [schools, setSchools] = useState<SchoolCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSchools();
  }, [searchQuery]);

  const fetchSchools = async () => {
    setLoading(true);
    let query = supabase
      .from('customers')
      .select(`
        id,
        name,
        bc_customer_number,
        customer_category,
        customer_type_group,
        is_active,
        payer:customers!customers_payer_customer_id_fkey(id, name)
      `)
      .eq('customer_category', 'Skola')
      .order('name');

    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,bc_customer_number.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching schools:', error);
    } else {
      const mapped = (data || []).map(d => ({
        ...d,
        payer: Array.isArray(d.payer) && d.payer.length > 0 ? d.payer[0] : null
      }));
      setSchools(mapped);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Skolor</h1>
          <p className="text-muted-foreground mt-1">Hantera alla skolor i systemet</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <School className="h-5 w-5" />
                  Skollista
                </CardTitle>
                <CardDescription>
                  {schools.length} skolor totalt
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök skola..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Laddar...</p>
            ) : schools.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Inga skolor hittades</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>BC-kundnummer</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Betalare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/customers/${school.id}`} className="font-medium text-primary hover:underline">
                          {school.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{school.bc_customer_number}</TableCell>
                      <TableCell>
                        <CategoryBadge category={school.customer_category} />
                      </TableCell>
                      <TableCell>{school.customer_type_group}</TableCell>
                      <TableCell>
                        {school.payer ? (
                          <Link to={`/customers/${school.payer.id}`} className="text-primary hover:underline">
                            {school.payer.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
