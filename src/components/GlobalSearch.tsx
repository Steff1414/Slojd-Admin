import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building2, Users, GraduationCap, School, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'customer' | 'contact' | 'teacher' | 'school';
  name: string;
  subtitle: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      const searchTerm = `%${query}%`;
      const allResults: SearchResult[] = [];

      // Search customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, bc_customer_number, customer_category')
        .or(`name.ilike.${searchTerm},bc_customer_number.ilike.${searchTerm},norce_code.ilike.${searchTerm}`)
        .limit(5);

      customers?.forEach((c) => {
        const isSchool = c.customer_category === 'Skola';
        allResults.push({
          id: c.id,
          type: isSchool ? 'school' : 'customer',
          name: c.name,
          subtitle: `BC: ${c.bc_customer_number}`,
        });
      });

      // Search contacts
      const { data: contacts } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, voyado_id, is_teacher')
        .is('merged_into_id', null)
        .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm},voyado_id.ilike.${searchTerm}`)
        .limit(5);

      contacts?.forEach((c) => {
        allResults.push({
          id: c.id,
          type: c.is_teacher ? 'teacher' : 'contact',
          name: `${c.first_name} ${c.last_name}`,
          subtitle: c.email,
        });
      });

      setResults(allResults);
      setLoading(false);
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    if (result.type === 'customer' || result.type === 'school') {
      navigate(`/customers/${result.id}`);
    } else {
      navigate(`/contacts/${result.id}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'customer': return <Building2 className="h-4 w-4 text-customer" />;
      case 'school': return <School className="h-4 w-4 text-school" />;
      case 'teacher': return <GraduationCap className="h-4 w-4 text-teacher" />;
      case 'contact': return <Users className="h-4 w-4 text-contact" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer': return 'Kund';
      case 'school': return 'Skola';
      case 'teacher': return 'Lärare';
      case 'contact': return 'Kontakt';
      default: return type;
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Sök kund, kontakt, lärare..."
          className="pl-9 pr-9 bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-foreground/50"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Söker...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Inga resultat</div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase">
                    {getTypeLabel(type)} ({items.length})
                  </div>
                  {items.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors text-left"
                    >
                      {getIcon(result.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{result.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
