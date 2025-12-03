import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Search, Landmark } from 'lucide-react';
import { CategoryBadge } from '@/components/CategoryBadge';
import type { CustomerCategory } from '@/types/database';

interface PayerCustomer {
  id: string;
  name: string;
  bc_customer_number: string;
  customer_category: CustomerCategory;
  customer_type_group: string;
  is_active: boolean;
  paysForCount: number;
}

export default function Payers() {
  const [allPayers, setAllPayers] = useState<PayerCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayers();
  }, []);

  const fetchPayers = async () => {
    setLoading(true);
    
    // Find all customer IDs that are used as payers
    const { data: customersWithPayers, error: refError } = await supabase
      .from('customers')
      .select('payer_customer_id')
      .not('payer_customer_id', 'is', null);

    if (refError) {
      console.error('Error fetching payer refs:', refError);
      setLoading(false);
      return;
    }

    // Count how many customers each payer pays for
    const payerCounts: Record<string, number> = {};
    (customersWithPayers || []).forEach(c => {
      if (c.payer_customer_id) {
        payerCounts[c.payer_customer_id] = (payerCounts[c.payer_customer_id] || 0) + 1;
      }
    });

    const payerIds = Object.keys(payerCounts);
    
    if (payerIds.length === 0) {
      setAllPayers([]);
      setLoading(false);
      return;
    }

    // Fetch payer customer details
    const { data: payersData, error } = await supabase
      .from('customers')
      .select('id, name, bc_customer_number, customer_category, customer_type_group, is_active')
      .in('id', payerIds)
      .order('name');

    if (error) {
      console.error('Error fetching payers:', error);
      setLoading(false);
      return;
    }

    const payers = (payersData || []).map(p => ({
      ...p,
      paysForCount: payerCounts[p.id] || 0
    })) as PayerCustomer[];

    setAllPayers(payers);
    setLoading(false);
  };

  // Filtered payers with typeahead
  const filteredPayers = useMemo(() => {
    if (!searchQuery.trim()) {
      return allPayers;
    }

    const query = searchQuery.toLowerCase().trim();
    return allPayers.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.bc_customer_number.toLowerCase().includes(query)
    );
  }, [allPayers, searchQuery]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Betalare</h1>
          <p className="text-muted-foreground mt-1">Kommuner och andra organisationer som betalar för kunder</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Landmark className="h-5 w-5" />
                  Betalarlista
                </CardTitle>
                <CardDescription>
                  {filteredPayers.length} av {allPayers.length} betalare
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök betalare..."
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
            ) : filteredPayers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchQuery ? 'Inga betalare matchar sökningen' : 'Inga betalare hittades'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Namn</TableHead>
                    <TableHead>BC-kundnummer</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead className="text-right">Betalar för</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayers.map((payer) => (
                    <TableRow key={payer.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link to={`/customers/${payer.id}`} className="font-medium text-primary hover:underline">
                          {payer.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{payer.bc_customer_number}</TableCell>
                      <TableCell>
                        <CategoryBadge category={payer.customer_category} />
                      </TableCell>
                      <TableCell>{payer.customer_type_group}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{payer.paysForCount}</span>
                        <span className="text-muted-foreground ml-1">kunder</span>
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
