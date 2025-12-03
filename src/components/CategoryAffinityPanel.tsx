import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Contact, CategoryAffinity } from '@/types/database';
import { TrendingUp, Palette, Hammer, ShoppingBag } from 'lucide-react';

interface CategoryAffinityPanelProps {
  contactId: string;
}

export function CategoryAffinityPanel({ contactId }: CategoryAffinityPanelProps) {
  const [affinities, setAffinities] = useState<CategoryAffinity[]>([]);
  const [totalSpend, setTotalSpend] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffinity();
  }, [contactId]);

  const fetchAffinity = async () => {
    // Get all orders for this contact
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_contact_id', contactId);

    if (!orders || orders.length === 0) {
      setLoading(false);
      return;
    }

    const orderIds = orders.map(o => o.id);

    // Get all order items for these orders
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .in('order_id', orderIds);

    if (!items || items.length === 0) {
      setLoading(false);
      return;
    }

    // Aggregate by main category
    const mainCategoryMap = new Map<string, {
      totalSpend: number;
      totalQuantity: number;
      categories: Map<string, { spend: number; quantity: number }>;
    }>();

    let total = 0;

    items.forEach(item => {
      total += Number(item.line_total);
      
      if (!mainCategoryMap.has(item.main_category)) {
        mainCategoryMap.set(item.main_category, {
          totalSpend: 0,
          totalQuantity: 0,
          categories: new Map(),
        });
      }
      
      const mainCat = mainCategoryMap.get(item.main_category)!;
      mainCat.totalSpend += Number(item.line_total);
      mainCat.totalQuantity += item.quantity;

      if (!mainCat.categories.has(item.category_name)) {
        mainCat.categories.set(item.category_name, { spend: 0, quantity: 0 });
      }
      const cat = mainCat.categories.get(item.category_name)!;
      cat.spend += Number(item.line_total);
      cat.quantity += item.quantity;
    });

    setTotalSpend(total);

    // Convert to array and sort by spend
    const affinityArray: CategoryAffinity[] = Array.from(mainCategoryMap.entries())
      .map(([mainCategory, data]) => ({
        mainCategory,
        totalSpend: data.totalSpend,
        totalQuantity: data.totalQuantity,
        categories: Array.from(data.categories.entries())
          .map(([name, stats]) => ({ name, ...stats }))
          .sort((a, b) => b.spend - a.spend)
          .slice(0, 5),
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 3);

    setAffinities(affinityArray);
    setLoading(false);
  };

  const getCategoryIcon = (mainCategory: string) => {
    if (mainCategory.toLowerCase().includes('teckna') || mainCategory.toLowerCase().includes('måla')) {
      return <Palette className="h-4 w-4" />;
    }
    if (mainCategory.toLowerCase().includes('trä') || mainCategory.toLowerCase().includes('metall')) {
      return <Hammer className="h-4 w-4" />;
    }
    return <ShoppingBag className="h-4 w-4" />;
  };

  const getCategoryColor = (mainCategory: string, index: number) => {
    if (mainCategory.toLowerCase().includes('teckna') || mainCategory.toLowerCase().includes('måla')) {
      return 'bg-purple-500';
    }
    if (mainCategory.toLowerCase().includes('trä') || mainCategory.toLowerCase().includes('metall')) {
      return 'bg-amber-600';
    }
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500'];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Kategoriaffinitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (affinities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Kategoriaffinitet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            <ShoppingBag className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Inga köp registrerade ännu</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Kategoriaffinitet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {affinities.map((affinity, idx) => {
          const percentage = totalSpend > 0 ? (affinity.totalSpend / totalSpend) * 100 : 0;
          
          return (
            <div key={affinity.mainCategory} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-white ${getCategoryColor(affinity.mainCategory, idx)}`}>
                    {getCategoryIcon(affinity.mainCategory)}
                  </div>
                  <span className="font-medium text-sm">{affinity.mainCategory}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {affinity.totalSpend.toFixed(0)} kr ({percentage.toFixed(0)}%)
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="flex flex-wrap gap-1 pl-8">
                {affinity.categories.slice(0, 4).map(cat => (
                  <span 
                    key={cat.name} 
                    className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
        
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Baserat på totalt {totalSpend.toFixed(0)} kr i köp
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
