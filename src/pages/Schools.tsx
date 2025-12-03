import { useState, useEffect, useMemo } from 'react';
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
  payer_customer_id: string | null;
  payer?: { id: string; name: string } | null;
}

export default function Schools() {
  const [allSchools, setAllSchools] = useState<SchoolCustomer[]>([]);
  const [payers, setPayers] = useState<Record<string, { id: string; name: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    setLoading(true);
    
    // Fetch all schools
    const { data: schoolsData, error } = await supabase
      .from('customers')
      .select('id, name, bc_customer_number, customer_category, customer_type_group, is_active, payer_customer_id')
      .eq('customer_category', 'Skola')
      .order('name');

    if (error) {
      console.error('Error fetching schools:', error);
      setLoading(false);
      return;
    }

    const schools = schoolsData || [];
    setAllSchools(schools as SchoolCustomer[]);

    // Fetch payer info for schools that have payers
    const payerIds = [...new Set(schools.filter(s => s.payer_customer_id).map(s => s.payer_customer_id))];
    if (payerIds.length > 0) {
      const { data: payerData } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', payerIds);

      if (payerData) {
        const payerMap: Record<string, { id: string; name: string }> = {};
        payerData.forEach(p => {
          payerMap[p.id] = { id: p.id, name: p.name };
        });
        setPayers(payerMap);
      }
    }

    setLoading(false);
  };

  // Debounced and filtered schools
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) {
      return allSchools.map(s => ({
        ...s,
        payer: s.payer_customer_id ? payers[s.payer_customer_id] || null : null
      }));
    }

    const query = searchQuery.toLowerCase().trim();
    return allSchools
      .filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.bc_customer_number.toLowerCase().includes(query)
      )
      .map(s => ({
        ...s,
        payer: s.payer_customer_id ? payers[s.payer_customer_id] || null : null
      }));
  }, [allSchools, payers, searchQuery]);

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
                  {filteredSchools.length} av {allSchools.length} skolor
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
            ) : filteredSchools.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchQuery ? 'Inga skolor matchar sökningen' : 'Inga skolor hittades'}
              </p>
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
                  {filteredSchools.map((school) => (
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
