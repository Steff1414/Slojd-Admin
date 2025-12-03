import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ContactTypeBadge } from '@/components/CategoryBadge';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/types/database';
import { Search, Users, GraduationCap, Mail, Phone, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('contacts')
          .select('*')
          .order('last_name');

        if (error) throw error;

        let filtered = (data || []) as Contact[];
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.first_name.toLowerCase().includes(searchLower) ||
              c.last_name.toLowerCase().includes(searchLower) ||
              c.email.toLowerCase().includes(searchLower) ||
              c.voyado_id.toLowerCase().includes(searchLower)
          );
        }

        setContacts(filtered);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [search]);

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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök på namn, e-post eller Voyado ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Laddar...</div>
            ) : contacts.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Inga kontakter hittades
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>E-post</th>
                      <th>Telefon</th>
                      <th>Typ</th>
                      <th>Voyado ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => (
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
                            <div>
                              <span className="font-medium">
                                {contact.first_name} {contact.last_name}
                              </span>
                              {contact.is_teacher && (
                                <Badge variant="teacher" className="ml-2">
                                  Lärare
                                </Badge>
                              )}
                            </div>
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
          Visar {contacts.length} {contacts.length === 1 ? 'kontakt' : 'kontakter'}
        </p>
      </div>
    </AppLayout>
  );
}
