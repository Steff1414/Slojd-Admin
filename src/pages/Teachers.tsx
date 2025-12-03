import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contact, TeacherSchoolAssignment, Customer } from '@/types/database';
import { Search, GraduationCap, Mail, School, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TeacherWithSchools extends Contact {
  schools: (TeacherSchoolAssignment & { school: Customer })[];
}

export default function Teachers() {
  const [teachers, setTeachers] = useState<TeacherWithSchools[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true);
      try {
        // Fetch teachers
        const { data: contactsData, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('is_teacher', true)
          .order('last_name');

        if (error) throw error;

        // Fetch their school assignments
        const teacherIds = contactsData?.map((c) => c.id) || [];
        const { data: assignmentsData } = await supabase
          .from('teacher_school_assignments')
          .select(`
            *,
            school:school_customer_id (*)
          `)
          .in('teacher_contact_id', teacherIds)
          .eq('is_active', true);

        // Map schools to teachers
        const teachersWithSchools = (contactsData || []).map((teacher) => ({
          ...teacher,
          schools: (assignmentsData || []).filter(
            (a) => a.teacher_contact_id === teacher.id
          ),
        })) as TeacherWithSchools[];

        // Filter by search
        let filtered = teachersWithSchools;
        if (search) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.first_name.toLowerCase().includes(searchLower) ||
              t.last_name.toLowerCase().includes(searchLower) ||
              t.email.toLowerCase().includes(searchLower) ||
              t.schools.some((s) => s.school.name.toLowerCase().includes(searchLower))
          );
        }

        setTeachers(filtered);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTeachers();
  }, [search]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Lärare</h1>
            <p className="text-muted-foreground mt-1">
              Alla lärare och deras skolkopplingar
            </p>
          </div>
          <Link to="/teachers/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Ny lärare
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök på namn, e-post eller skola..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Laddar...</div>
        ) : teachers.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Inga lärare hittades
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {teachers.map((teacher) => (
              <Link key={teacher.id} to={`/contacts/${teacher.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-teacher/10 flex items-center justify-center flex-shrink-0">
                        <GraduationCap className="h-6 w-6 text-teacher" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display font-semibold text-foreground truncate">
                          {teacher.first_name} {teacher.last_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{teacher.email}</span>
                        </div>

                        {/* Schools */}
                        {teacher.schools.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            {teacher.schools.slice(0, 3).map((assignment) => (
                              <div
                                key={assignment.id}
                                className="flex items-center gap-2 text-sm"
                              >
                                <School className="h-3.5 w-3.5 text-school" />
                                <span className="truncate text-muted-foreground">
                                  {assignment.school.name}
                                </span>
                                {assignment.role && (
                                  <Badge variant="secondary" className="text-xs ml-auto flex-shrink-0">
                                    {assignment.role}
                                  </Badge>
                                )}
                              </div>
                            ))}
                            {teacher.schools.length > 3 && (
                              <p className="text-xs text-muted-foreground">
                                +{teacher.schools.length - 3} fler skolor
                              </p>
                            )}
                          </div>
                        )}

                        {teacher.schools.length === 0 && (
                          <p className="text-sm text-muted-foreground mt-3">
                            Inga skolkopplingar
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Visar {teachers.length} {teachers.length === 1 ? 'lärare' : 'lärare'}
        </p>
      </div>
    </AppLayout>
  );
}
