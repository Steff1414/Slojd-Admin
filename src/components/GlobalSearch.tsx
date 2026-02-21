import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Search, Building2, Users, GraduationCap, School, X,
  LayoutDashboard, Network, Landmark, Upload, Merge,
  FileText, Store, History, Settings, ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  type: 'customer' | 'contact' | 'teacher' | 'school' | 'page';
  name: string;
  subtitle: string;
  href?: string;
}

const pages: { name: string; subtitle: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { name: 'Dashboard', subtitle: 'Översikt', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kunder', subtitle: 'CRM', href: '/customers', icon: Building2 },
  { name: 'Kontakter', subtitle: 'CRM', href: '/contacts', icon: Users },
  { name: 'Företag / Organisationer', subtitle: 'CRM', href: '/organisation-graph', icon: Network },
  { name: 'Lärare', subtitle: 'CRM', href: '/teachers', icon: GraduationCap },
  { name: 'Skolor', subtitle: 'CRM', href: '/schools', icon: School },
  { name: 'Betalare', subtitle: 'CRM', href: '/payers', icon: Landmark },
  { name: 'Import', subtitle: 'Verktyg', href: '/import', icon: Upload },
  { name: 'Slå samman', subtitle: 'Verktyg', href: '/merge-contacts', icon: Merge },
  { name: 'API Docs', subtitle: 'Utvecklare', href: '/api-docs', icon: FileText },
  { name: 'Norce Commerce', subtitle: 'Utvecklare', href: '/norce', icon: Store },
  { name: 'Användare', subtitle: 'Admin', href: '/allowed-emails', icon: Users },
  { name: 'Ändringslogg', subtitle: 'Admin', href: '/audit-log', icon: History },
  { name: 'Mitt konto', subtitle: 'Konto', href: '/account', icon: Settings },
];

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter pages by query
  const matchingPages = useMemo(() => {
    if (query.length < 1) return [];
    const q = query.toLowerCase();
    return pages.filter(p =>
      p.name.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query]);

  // All results: pages first, then data
  const allResults = useMemo(() => {
    const pageResults: SearchResult[] = matchingPages.map(p => ({
      id: p.href,
      type: 'page' as const,
      name: p.name,
      subtitle: p.subtitle,
      href: p.href,
    }));
    return [...pageResults, ...results];
  }, [matchingPages, results]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [allResults.length]);

  const handleSelect = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    setResults([]);
    if (result.type === 'page' && result.href) {
      navigate(result.href);
    } else if (result.type === 'customer' || result.type === 'school') {
      navigate(`/customers/${result.id}`);
    } else {
      navigate(`/contacts/${result.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(allResults[selectedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const getIcon = (type: string, result?: SearchResult) => {
    if (type === 'page' && result?.href) {
      const page = pages.find(p => p.href === result.href);
      if (page) {
        const Icon = page.icon;
        return <Icon className="h-4 w-4 text-muted-foreground" />;
      }
    }
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
      case 'page': return 'Gå till';
      case 'customer': return 'Kund';
      case 'school': return 'Skola';
      case 'teacher': return 'Lärare';
      case 'contact': return 'Kontakt';
      default: return type;
    }
  };

  // Group: pages first, then data by type
  const groupedResults = allResults.reduce((acc, result) => {
    if (!acc[result.type]) acc[result.type] = [];
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  // Track flat index for keyboard navigation
  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Sök eller navigera...  ⌘K"
          className="pl-9 pr-9 h-9 bg-muted/50 border-transparent focus:border-border focus:bg-background text-sm placeholder:text-muted-foreground/60"
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

      {isOpen && query.length >= 1 && (
        <div className="absolute top-full mt-1.5 w-full min-w-[320px] bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {loading && results.length === 0 && matchingPages.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Söker...</div>
          ) : allResults.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">Inga resultat</div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type}>
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {getTypeLabel(type)}
                  </div>
                  {items.map((result) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={result.id}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                          idx === selectedIndex
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted'
                        )}
                      >
                        {getIcon(result.type, result)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{result.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        </div>
                        {result.type === 'page' && (
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
