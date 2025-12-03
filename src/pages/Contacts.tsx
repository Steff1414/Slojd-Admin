import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ContactTypeBadge } from '@/components/CategoryBadge';
import { Contact, ContactType } from '@/types/database';
import { Search, Users, GraduationCap, Mail, Phone, Plus, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortDirection = 'asc' | 'desc' | null;
type SortField = 'name' | 'email' | 'phone' | 'contact_type' | 'voyado_id';

const CONTACT_TYPES: ContactType[] = ['Privatperson', 'Medlem', 'Nyhetsbrev', 'Lärare', 'Köpare', 'Övrig'];

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Filter state
  const [typeFilters, setTypeFilters] = useState<Set<ContactType>>(new Set());

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('last_name');

        if (error) throw error;
        setContacts((data || []) as Contact[]);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, []);

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let result = [...contacts];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.first_name.toLowerCase().includes(searchLower) ||
          c.last_name.toLowerCase().includes(searchLower) ||
          c.email.toLowerCase().includes(searchLower) ||
          c.voyado_id.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filters
    if (typeFilters.size > 0) {
      result = result.filter((c) => typeFilters.has(c.contact_type));
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aVal: string;
        let bVal: string;

        switch (sortField) {
          case 'name':
            aVal = `${a.last_name} ${a.first_name}`.toLowerCase();
            bVal = `${b.last_name} ${b.first_name}`.toLowerCase();
            break;
          case 'email':
            aVal = a.email.toLowerCase();
            bVal = b.email.toLowerCase();
            break;
          case 'phone':
            aVal = (a.phone || '').toLowerCase();
            bVal = (b.phone || '').toLowerCase();
            break;
          case 'contact_type':
            aVal = a.contact_type.toLowerCase();
            bVal = b.contact_type.toLowerCase();
            break;
          case 'voyado_id':
            aVal = a.voyado_id.toLowerCase();
            bVal = b.voyado_id.toLowerCase();
            break;
          default:
            return 0;
        }

        if (sortDirection === 'asc') {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
    }

    return result;
  }, [contacts, search, typeFilters, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleTypeFilter = (type: ContactType) => {
    const newFilters = new Set(typeFilters);
    if (newFilters.has(type)) {
      newFilters.delete(type);
    } else {
      newFilters.add(type);
    }
    setTypeFilters(newFilters);
  };

  const clearTypeFilters = () => {
    setTypeFilters(new Set());
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4 ml-1" />;
    }
    return <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th 
      className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center">
        {children}
        <SortIcon field={field} />
      </div>
    </th>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Kontakter</h1>
            <p className="text-muted-foreground mt-1">
              Alla kontakter i systemet
            </p>
          </div>
          <Link to="/contacts/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny kontakt
            </Button>
          </Link>
        </div>

        {/* Search and Active Filters */}
        <div className="flex flex-col gap-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök på namn, e-post eller Voyado ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {typeFilters.size > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {Array.from(typeFilters).map((type) => (
                <Button
                  key={type}
                  variant="secondary"
                  size="sm"
                  className="h-7 gap-1"
                  onClick={() => toggleTypeFilter(type)}
                >
                  {type}
                  <X className="h-3 w-3" />
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="h-7"
                onClick={clearTypeFilters}
              >
                Rensa alla
              </Button>
            </div>
          )}
        </div>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Laddar...</div>
            ) : filteredAndSortedContacts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Inga kontakter hittades
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <SortableHeader field="name">Namn</SortableHeader>
                      <SortableHeader field="email">E-post</SortableHeader>
                      <SortableHeader field="phone">Telefon</SortableHeader>
                      <th>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="flex items-center cursor-pointer hover:text-foreground">
                              Typ
                              <Filter className={`h-4 w-4 ml-1 ${typeFilters.size > 0 ? 'text-primary' : 'opacity-50'}`} />
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-48 bg-popover p-2">
                            <div className="space-y-2">
                              {CONTACT_TYPES.map((type) => (
                                <label
                                  key={type}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded"
                                >
                                  <Checkbox
                                    checked={typeFilters.has(type)}
                                    onCheckedChange={() => toggleTypeFilter(type)}
                                  />
                                  <span className="text-sm">{type}</span>
                                </label>
                              ))}
                              {typeFilters.size > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full mt-2"
                                  onClick={clearTypeFilters}
                                >
                                  Rensa filter
                                </Button>
                              )}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </th>
                      <SortableHeader field="voyado_id">Voyado ID</SortableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedContacts.map((contact) => (
                      <tr key={contact.id}>
                        <td>
                          <Link
                            to={`/contacts/${contact.id}`}
                            className="flex items-center gap-3 hover:text-primary transition-colors"
                          >
                            <div className="w-9 h-9 rounded-full bg-contact/10 flex items-center justify-center flex-shrink-0">
                              {contact.is_teacher ? (
                                <GraduationCap className="h-4 w-4 text-teacher" />
                              ) : (
                                <Users className="h-4 w-4 text-contact" />
                              )}
                            </div>
                            <span className="font-medium">
                              {contact.first_name} {contact.last_name}
                            </span>
                          </Link>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            {contact.email}
                          </div>
                        </td>
                        <td>
                          {contact.phone ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {contact.phone}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td>
                          <ContactTypeBadge contactType={contact.contact_type} />
                        </td>
                        <td className="font-mono text-sm text-muted-foreground">
                          {contact.voyado_id}
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
          Visar {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'kontakt' : 'kontakter'}
          {contacts.length !== filteredAndSortedContacts.length && ` av ${contacts.length}`}
        </p>
      </div>
    </AppLayout>
  );
}
