import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, TrendingUp, User, Clock, ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface RecentVisitor {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  user_agent: string | null;
  contact: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  event_count: number;
}

interface PopularCategory {
  category_name: string;
  view_count: number;
}

export function BrowsingStatsCard() {
  const [visitors, setVisitors] = useState<RecentVisitor[]>([]);
  const [categories, setCategories] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBrowsingStats() {
      try {
        // Fetch recent sessions with contact info
        const { data: sessions } = await supabase
          .from('web_sessions')
          .select(`
            id,
            started_at,
            ended_at,
            user_agent,
            contact:contact_id (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .order('started_at', { ascending: false })
          .limit(5);

        // Fetch event counts for each session
        const sessionsWithCounts: RecentVisitor[] = [];
        if (sessions) {
          for (const session of sessions) {
            const { count } = await supabase
              .from('web_events')
              .select('*', { count: 'exact', head: true })
              .eq('session_id', session.id);
            
            sessionsWithCounts.push({
              ...session,
              contact: session.contact as RecentVisitor['contact'],
              event_count: count || 0,
            });
          }
        }
        setVisitors(sessionsWithCounts);

        // Fetch popular categories from web events
        const { data: categoryEvents } = await supabase
          .from('web_events')
          .select('category_name')
          .not('category_name', 'is', null)
          .order('occurred_at', { ascending: false })
          .limit(100);

        if (categoryEvents) {
          const categoryCounts: Record<string, number> = {};
          categoryEvents.forEach((event) => {
            if (event.category_name) {
              categoryCounts[event.category_name] = (categoryCounts[event.category_name] || 0) + 1;
            }
          });

          const sortedCategories = Object.entries(categoryCounts)
            .map(([name, count]) => ({ category_name: name, view_count: count }))
            .sort((a, b) => b.view_count - a.view_count)
            .slice(0, 5);

          setCategories(sortedCategories);
        }
      } catch (error) {
        console.error('Error fetching browsing stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBrowsingStats();
  }, []);

  const getBrowserName = (userAgent: string | null): string => {
    if (!userAgent) return 'Okänd';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Webbläsare';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Surfstatistik</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Surfstatistik
        </CardTitle>
        <CardDescription>Senaste besökare och populära kategorier</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Recent Visitors */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Senaste besökare
          </h4>
          {visitors.length === 0 ? (
            <p className="text-muted-foreground text-sm">Inga besökare registrerade</p>
          ) : (
            <div className="space-y-2">
              {visitors.map((visitor) => (
                <Link
                  key={visitor.id}
                  to={visitor.contact ? `/contacts/${visitor.contact.id}` : '#'}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-contact/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-contact" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {visitor.contact 
                          ? `${visitor.contact.first_name} ${visitor.contact.last_name}`
                          : 'Anonym besökare'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getBrowserName(visitor.user_agent)} • {visitor.event_count} sidvisningar
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {visitor.started_at 
                      ? format(new Date(visitor.started_at), 'd MMM HH:mm', { locale: sv })
                      : '-'
                    }
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Popular Categories */}
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Populära kategorier
          </h4>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-sm">Ingen kategoridata tillgänglig</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div
                  key={category.category_name}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{category.category_name}</span>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <ShoppingBag className="h-3 w-3" />
                    {category.view_count} visningar
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
