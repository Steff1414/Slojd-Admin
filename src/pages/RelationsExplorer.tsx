import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryBadge } from '@/components/CategoryBadge';
import { Search, Building2, Users, GraduationCap, School, CreditCard, ArrowRight, ExternalLink, List } from 'lucide-react';
import { Customer, Contact } from '@/types/database';

interface SearchResult {
  id: string;
  type: 'customer' | 'contact';
  name: string;
  category?: string;
  isTeacher?: boolean;
  bcNumber?: string;
  voyadoId?: string;
}

interface Relation {
  id: string;
  type: string;
  name: string;
  linkType: string;
  category?: string;
}

export default function RelationsExplorer() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [fullResults, setFullResults] = useState<SearchResult[]>([]);
  const [showFullResults, setShowFullResults] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [secondDegree, setSecondDegree] = useState<Relation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Typeahead search
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    const search = async () => {
      const searchTerm = `%${query}%`;
      const results: SearchResult[] = [];

      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, customer_category, bc_customer_number')
        .ilike('name', searchTerm)
        .limit(5);

      customers?.forEach((c) => {
        results.push({
          id: c.id,
          type: 'customer',
          name: c.name,
          category: c.customer_category,
          bcNumber: c.bc_customer_number,
        });
      });

      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, is_teacher, voyado_id')
        .is('merged_into_id', null)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
        .limit(5);

      contacts?.forEach((c) => {
        results.push({
          id: c.id,
          type: 'contact',
          name: `${c.first_name} ${c.last_name}`,
          isTeacher: c.is_teacher || false,
          voyadoId: c.voyado_id,
        });
      });

      setSearchResults(results);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  // Full search on Enter
  const performFullSearch = async () => {
    if (query.length < 2) return;
    
    setSearching(true);
    setShowFullResults(true);
    const searchTerm = `%${query}%`;
    const results: SearchResult[] = [];

    // Search customers by name, BC number
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, customer_category, bc_customer_number, voyado_id')
      .or(`name.ilike.${searchTerm},bc_customer_number.ilike.${searchTerm}`)
      .limit(20);

    customers?.forEach((c) => {
      results.push({
        id: c.id,
        type: 'customer',
        name: c.name,
        category: c.customer_category,
        bcNumber: c.bc_customer_number,
        voyadoId: c.voyado_id || undefined,
      });
    });

    // Search contacts by name, email, voyado_id
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, is_teacher, voyado_id, email')
      .is('merged_into_id', null)
      .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},voyado_id.ilike.${searchTerm}`)
      .limit(20);

    contacts?.forEach((c) => {
      results.push({
        id: c.id,
        type: 'contact',
        name: `${c.first_name} ${c.last_name}`,
        isTeacher: c.is_teacher || false,
        voyadoId: c.voyado_id,
      });
    });

    setFullResults(results);
    setSearchResults([]);
    setSearching(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performFullSearch();
    }
  };

  const selectEntity = async (result: SearchResult) => {
    setSelected(result);
    setQuery('');
    setSearchResults([]);
    setFullResults([]);
    setShowFullResults(false);
    setLoading(true);
    setRelations([]);
    setSecondDegree([]);

    const newRelations: Relation[] = [];
    const newSecondDegree: Relation[] = [];

    if (result.type === 'customer') {
      // Fetch contacts linked to customer
      const { data: links } = await supabase
        .from('contact_customer_links')
        .select('*, contact:contact_id (*)')
        .eq('customer_id', result.id);

      links?.forEach((link: { id: string; contact: Contact; relationship_type: string }) => {
        newRelations.push({
          id: link.contact.id,
          type: 'contact',
          name: `${link.contact.first_name} ${link.contact.last_name}`,
          linkType: link.relationship_type,
        });
      });

      // Fetch payer
      const { data: customer } = await supabase
        .from('customers')
        .select('*, payer:payer_customer_id (*)')
        .eq('id', result.id)
        .single();

      if (customer?.payer) {
        newRelations.push({
          id: customer.payer.id,
          type: 'payer',
          name: customer.payer.name,
          linkType: 'Betalare',
          category: customer.payer.customer_category,
        });
      }

      // Fetch customers this pays for
      const { data: paysFor } = await supabase
        .from('customers')
        .select('*')
        .eq('payer_customer_id', result.id);

      paysFor?.forEach((c: Customer) => {
        newRelations.push({
          id: c.id,
          type: 'paid_for',
          name: c.name,
          linkType: 'Betalar för',
          category: c.customer_category,
        });
      });

      // If school, fetch teachers
      if (result.category === 'Skola') {
        const { data: assignments } = await supabase
          .from('teacher_school_assignments')
          .select('*, teacher:teacher_contact_id (*)')
          .eq('school_customer_id', result.id)
          .eq('is_active', true);

        assignments?.forEach((a: { id: string; teacher: Contact; role: string | null }) => {
          newRelations.push({
            id: a.teacher.id,
            type: 'teacher',
            name: `${a.teacher.first_name} ${a.teacher.last_name}`,
            linkType: a.role || 'Lärare',
          });
        });
      }
    } else {
      // Contact - fetch linked customers
      const { data: links } = await supabase
        .from('contact_customer_links')
        .select('*, customer:customer_id (*)')
        .eq('contact_id', result.id);

      links?.forEach((link: { id: string; customer: Customer; relationship_type: string }) => {
        newRelations.push({
          id: link.customer.id,
          type: 'customer',
          name: link.customer.name,
          linkType: link.relationship_type,
          category: link.customer.customer_category,
        });
      });

      // If teacher, fetch schools
      if (result.isTeacher) {
        const { data: assignments } = await supabase
          .from('teacher_school_assignments')
          .select('*, school:school_customer_id (*)')
          .eq('teacher_contact_id', result.id)
          .eq('is_active', true);

        assignments?.forEach((a: { id: string; school: Customer; role: string | null }) => {
          newRelations.push({
            id: a.school.id,
            type: 'school',
            name: a.school.name,
            linkType: a.role || 'Undervisar vid',
            category: 'Skola',
          });

          // Second degree: school's payer
          if (a.school.payer_customer_id) {
            supabase
              .from('customers')
              .select('*')
              .eq('id', a.school.payer_customer_id)
              .single()
              .then(({ data: payer }) => {
                if (payer) {
                  setSecondDegree((prev) => [
                    ...prev,
                    {
                      id: payer.id,
                      type: 'payer',
                      name: payer.name,
                      linkType: `Betalare för ${a.school.name}`,
                      category: payer.customer_category,
                    },
                  ]);
                }
              });
          }
        });
      }
    }

    setRelations(newRelations);
    setLoading(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer': return <Building2 className="h-5 w-5 text-customer" />;
      case 'contact': return <Users className="h-5 w-5 text-contact" />;
      case 'teacher': return <GraduationCap className="h-5 w-5 text-teacher" />;
      case 'school': return <School className="h-5 w-5 text-school" />;
      case 'payer': return <CreditCard className="h-5 w-5 text-payer" />;
      case 'paid_for': return <Building2 className="h-5 w-5 text-school" />;
      default: return <Building2 className="h-5 w-5" />;
    }
  };

  const getLink = (relation: Relation) => {
    if (['customer', 'school', 'payer', 'paid_for'].includes(relation.type)) {
      return `/customers/${relation.id}`;
    }
    return `/contacts/${relation.id}`;
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'customer') {
      if (result.category === 'Skola') return <School className="h-5 w-5 text-school" />;
      return <Building2 className="h-5 w-5 text-customer" />;
    }
    if (result.isTeacher) return <GraduationCap className="h-5 w-5 text-teacher" />;
    return <Users className="h-5 w-5 text-contact" />;
  };

  const getResultTypeLabel = (result: SearchResult) => {
    if (result.type === 'customer') {
      if (result.category === 'Skola') return 'Skola';
      return 'Kund';
    }
    if (result.isTeacher) return 'Lärare';
    return 'Kontakt';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center">
            <Search className="h-6 w-6 text-info" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Relationsutforskare</h1>
            <p className="text-muted-foreground">Utforska kopplingar mellan kunder, kontakter och lärare</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sök entitet</CardTitle>
            <CardDescription>
              Ange namn på kund, kontakt, lärare eller skola. Tryck Enter för fullständig sökning.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowFullResults(false); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Sök..."
                  className="pl-9"
                />
                {searchResults.length > 0 && !showFullResults && (
                  <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => selectEntity(result)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left"
                      >
                        {getResultIcon(result)}
                        <span className="font-medium">{result.name}</span>
                        {result.category && <Badge variant="outline" className="ml-auto">{result.category}</Badge>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button onClick={performFullSearch} disabled={searching || query.length < 2}>
                <List className="h-4 w-4 mr-2" />
                {searching ? 'Söker...' : 'Visa alla'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Full search results */}
        {showFullResults && fullResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Sökresultat ({fullResults.length})</CardTitle>
              <CardDescription>Klicka på en rad för att visa relationer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {fullResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => selectEntity(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    {getResultIcon(result)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.bcNumber || result.voyadoId}
                      </p>
                    </div>
                    <Badge variant="outline">{getResultTypeLabel(result)}</Badge>
                    {result.category && <CategoryBadge category={result.category as any} />}
                    <Button variant="ghost" size="sm">
                      Välj
                    </Button>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {showFullResults && fullResults.length === 0 && !searching && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Inga resultat hittades för "{query}"
            </CardContent>
          </Card>
        )}

        {selected && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                {getResultIcon(selected)}
                <div>
                  <CardTitle>{selected.name}</CardTitle>
                  <CardDescription>
                    {selected.type === 'customer' ? 'Kund' : selected.isTeacher ? 'Lärare' : 'Kontakt'}
                    {selected.category && ` • ${selected.category}`}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Laddar relationer...</div>
              ) : relations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Inga relationer hittades</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">Direkta relationer ({relations.length})</h3>
                    <div className="space-y-2">
                      {relations.map((rel, idx) => (
                        <Link
                          key={`${rel.id}-${idx}`}
                          to={getLink(rel)}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                        >
                          {getIcon(rel.type)}
                          <div className="flex-1">
                            <p className="font-medium">{rel.name}</p>
                            <Badge variant="outline" className="text-xs">{rel.linkType}</Badge>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {secondDegree.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                        <ArrowRight className="h-4 w-4 inline mr-1" />
                        Andragradsrelationer ({secondDegree.length})
                      </h3>
                      <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                        {secondDegree.map((rel, idx) => (
                          <Link
                            key={`${rel.id}-${idx}`}
                            to={getLink(rel)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            {getIcon(rel.type)}
                            <div className="flex-1">
                              <p className="font-medium">{rel.name}</p>
                              <Badge variant="outline" className="text-xs">{rel.linkType}</Badge>
                            </div>
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
