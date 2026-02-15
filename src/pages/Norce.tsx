import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  RefreshCw,
  Store,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import {
  fetchNorceProducts,
  fetchNorceOrders,
  fetchNorceCustomers,
} from '@/integrations/norce';
import type {
  NorceProduct,
  NorceOrder,
  NorceCustomer,
} from '@/types/norce';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'PPP', { locale: sv });
  } catch {
    return dateStr;
  }
};

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive">
      <CardContent className="p-6 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
        <p className="text-destructive font-medium">{message}</p>
        <Button variant="outline" onClick={onRetry} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Försök igen
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Norce() {
  const [activeTab, setActiveTab] = useState('products');

  // Products
  const [products, setProducts] = useState<NorceProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsFetched, setProductsFetched] = useState(false);
  const [productsSearch, setProductsSearch] = useState('');

  // Orders
  const [orders, setOrders] = useState<NorceOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersFetched, setOrdersFetched] = useState(false);
  const [ordersSearch, setOrdersSearch] = useState('');

  // Customers
  const [customers, setCustomers] = useState<NorceCustomer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState<string | null>(null);
  const [customersFetched, setCustomersFetched] = useState(false);
  const [customersSearch, setCustomersSearch] = useState('');

  useEffect(() => {
    if (activeTab === 'products' && !productsFetched) loadProducts();
    if (activeTab === 'orders' && !ordersFetched) loadOrders();
    if (activeTab === 'customers' && !customersFetched) loadCustomers();
  }, [activeTab, productsFetched, ordersFetched, customersFetched]);

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const res = await fetchNorceProducts();
      setProducts(res.value || []);
      setProductsFetched(true);
    } catch (e) {
      setProductsError(e instanceof Error ? e.message : 'Okänt fel');
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadOrders() {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const res = await fetchNorceOrders();
      setOrders(res.value || []);
      setOrdersFetched(true);
    } catch (e) {
      setOrdersError(e instanceof Error ? e.message : 'Okänt fel');
    } finally {
      setOrdersLoading(false);
    }
  }

  async function loadCustomers() {
    setCustomersLoading(true);
    setCustomersError(null);
    try {
      const res = await fetchNorceCustomers();
      setCustomers(res.value || []);
      setCustomersFetched(true);
    } catch (e) {
      setCustomersError(e instanceof Error ? e.message : 'Okänt fel');
    } finally {
      setCustomersLoading(false);
    }
  }

  const filteredProducts = useMemo(() => {
    if (!productsSearch) return products;
    const q = productsSearch.toLowerCase();
    return products.filter(
      (p) =>
        p.DefaultName?.toLowerCase().includes(q) ||
        p.ManufacturerPartNo?.toLowerCase().includes(q) ||
        p.Alias?.toLowerCase().includes(q),
    );
  }, [products, productsSearch]);

  const filteredOrders = useMemo(() => {
    if (!ordersSearch) return orders;
    const q = ordersSearch.toLowerCase();
    return orders.filter(
      (o) =>
        o.OrderNo?.toLowerCase().includes(q) ||
        o.Source?.toLowerCase().includes(q),
    );
  }, [orders, ordersSearch]);

  const filteredCustomers = useMemo(() => {
    if (!customersSearch) return customers;
    const q = customersSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.FirstName?.toLowerCase().includes(q) ||
        c.LastName?.toLowerCase().includes(q) ||
        c.EmailAddress?.toLowerCase().includes(q) ||
        c.CustomerCode?.toLowerCase().includes(q),
    );
  }, [customers, customersSearch]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Norce Commerce
            </h1>
            <p className="text-muted-foreground mt-1">
              Data direkt från Norce Commerce API (demo)
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" /> Produkter
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Ordrar
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2">
              <Users className="h-4 w-4" /> Kunder
            </TabsTrigger>
          </TabsList>

          {/* ─── Products ─── */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på namn eller artikelnr..."
                  value={productsSearch}
                  onChange={(e) => setProductsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setProductsFetched(false); }}
                title="Uppdatera"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {productsError ? (
              <ErrorCard message={productsError} onRetry={() => { setProductsFetched(false); }} />
            ) : (
              <Card>
                <CardContent className="p-0">
                  {productsLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Laddar...</div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Inga produkter hittades
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Namn</th>
                            <th>Artikelnr</th>
                            <th>Variant</th>
                            <th>ID</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => (
                            <tr key={product.Id}>
                              <td className="font-medium">
                                {product.DefaultName}
                              </td>
                              <td className="font-mono text-sm text-muted-foreground">
                                {product.ManufacturerPartNo || '-'}
                              </td>
                              <td>
                                <Badge variant={product.IsVariant ? 'default' : 'secondary'}>
                                  {product.IsVariant ? 'Variant' : 'Standard'}
                                </Badge>
                              </td>
                              <td className="text-muted-foreground text-sm">
                                {product.Id}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground">
              Visar {filteredProducts.length} produkter
              {products.length !== filteredProducts.length && ` av ${products.length}`}
            </p>
          </TabsContent>

          {/* ─── Orders ─── */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på ordernr eller källa..."
                  value={ordersSearch}
                  onChange={(e) => setOrdersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setOrdersFetched(false); }}
                title="Uppdatera"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {ordersError ? (
              <ErrorCard message={ordersError} onRetry={() => { setOrdersFetched(false); }} />
            ) : (
              <Card>
                <CardContent className="p-0">
                  {ordersLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Laddar...</div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Inga ordrar hittades
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Ordernr</th>
                            <th>Datum</th>
                            <th>Källa</th>
                            <th>Leveranssätt</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr key={order.Id}>
                              <td className="font-mono font-medium">
                                {order.OrderNo || order.Id}
                              </td>
                              <td className="text-muted-foreground text-sm">
                                {formatDate(order.OrderDate || order.Created)}
                              </td>
                              <td>{order.Source || '-'}</td>
                              <td className="text-muted-foreground">
                                {order.DeliveryMode || '-'}
                              </td>
                              <td>
                                <Badge variant="secondary">
                                  Status {order.StatusId}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground">
              Visar {filteredOrders.length} ordrar
              {orders.length !== filteredOrders.length && ` av ${orders.length}`}
            </p>
          </TabsContent>

          {/* ─── Customers ─── */}
          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Sök på namn, e-post eller kundkod..."
                  value={customersSearch}
                  onChange={(e) => setCustomersSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { setCustomersFetched(false); }}
                title="Uppdatera"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {customersError ? (
              <ErrorCard message={customersError} onRetry={() => { setCustomersFetched(false); }} />
            ) : (
              <Card>
                <CardContent className="p-0">
                  {customersLoading ? (
                    <div className="p-8 text-center text-muted-foreground">Laddar...</div>
                  ) : filteredCustomers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      Inga kunder hittades
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Namn</th>
                            <th>E-post</th>
                            <th>Kundkod</th>
                            <th>Telefon</th>
                            <th>Status</th>
                            <th>Skapad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCustomers.map((customer) => (
                            <tr key={customer.Id}>
                              <td className="font-medium">
                                {[customer.FirstName, customer.LastName]
                                  .filter(Boolean)
                                  .join(' ') || '-'}
                              </td>
                              <td className="text-muted-foreground">
                                {customer.EmailAddress || '-'}
                              </td>
                              <td className="font-mono text-sm text-muted-foreground">
                                {customer.CustomerCode || '-'}
                              </td>
                              <td className="text-muted-foreground">
                                {customer.CellPhoneNumber || customer.PhoneNumber || '-'}
                              </td>
                              <td>
                                <Badge variant={customer.IsActive ? 'default' : 'secondary'}>
                                  {customer.IsActive ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                              </td>
                              <td className="text-muted-foreground text-sm">
                                {formatDate(customer.Created)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <p className="text-sm text-muted-foreground">
              Visar {filteredCustomers.length} kunder
              {customers.length !== filteredCustomers.length && ` av ${customers.length}`}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
