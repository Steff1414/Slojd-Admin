import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer } from '@/types/database';
import { Building2, School, GraduationCap, CreditCard, ChevronRight, Network, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface PayerNode {
  id: string;
  name: string;
  category: string;
  bcNumber: string;
  children: PayerNode[];
  teachers?: { id: string; name: string }[];
}

interface PayerGraphProps {
  customerId: string;
  customerName: string;
}

export function PayerGraph({ customerId, customerName }: PayerGraphProps) {
  const [graphData, setGraphData] = useState<PayerNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([customerId]));

  useEffect(() => {
    async function fetchGraphData() {
      setLoading(true);

      // Fetch customers this payer pays for
      const { data: paidFor } = await supabase
        .from('customers')
        .select('id, name, customer_category, bc_customer_number')
        .eq('payer_customer_id', customerId);

      // For each school, fetch teachers
      const schoolIds = (paidFor || [])
        .filter(c => c.customer_category === 'Skola')
        .map(c => c.id);

      let teachersBySchool: Record<string, { id: string; name: string }[]> = {};

      if (schoolIds.length > 0) {
        const { data: assignments } = await supabase
          .from('teacher_school_assignments')
          .select(`
            school_customer_id,
            teacher:teacher_contact_id (id, first_name, last_name)
          `)
          .in('school_customer_id', schoolIds)
          .eq('is_active', true);

        if (assignments) {
          assignments.forEach(a => {
            const schoolId = a.school_customer_id;
            if (!teachersBySchool[schoolId]) teachersBySchool[schoolId] = [];
            const teacher = a.teacher as any;
            if (teacher) {
              teachersBySchool[schoolId].push({
                id: teacher.id,
                name: `${teacher.first_name} ${teacher.last_name}`,
              });
            }
          });
        }
      }

      const rootNode: PayerNode = {
        id: customerId,
        name: customerName,
        category: 'Betalare',
        bcNumber: '',
        children: (paidFor || []).map(c => ({
          id: c.id,
          name: c.name,
          category: c.customer_category,
          bcNumber: c.bc_customer_number,
          children: [],
          teachers: c.customer_category === 'Skola' ? teachersBySchool[c.id] || [] : undefined,
        })),
      };

      setGraphData(rootNode);
      setLoading(false);
    }

    fetchGraphData();
  }, [customerId, customerName]);

  const toggleNode = (nodeId: string) => {
    const next = new Set(expandedNodes);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setExpandedNodes(next);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Skola':
        return <School className="h-4 w-4 text-school" />;
      case 'Betalare':
        return <CreditCard className="h-4 w-4 text-payer" />;
      default:
        return <Building2 className="h-4 w-4 text-customer" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-pulse">Laddar graf...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!graphData || graphData.children.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Organisationsträd
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Ingen underliggande struktur att visa.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          Organisationsträd
        </CardTitle>
        <CardDescription>Visar kunder som {customerName} betalar för</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Root node */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-payer/10 border border-payer/20">
            <CreditCard className="h-5 w-5 text-payer" />
            <span className="font-semibold">{graphData.name}</span>
            <Badge variant="payer" className="ml-auto">Betalare</Badge>
          </div>

          {/* Children */}
          <div className="ml-6 border-l-2 border-border pl-4 space-y-2">
            {graphData.children.map((child) => (
              <div key={child.id} className="space-y-2">
                <Link
                  to={`/customers/${child.id}`}
                  className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  {getCategoryIcon(child.category)}
                  <span className="font-medium">{child.name}</span>
                  <Badge variant="secondary" className="ml-2">{child.category}</Badge>
                  <span className="text-xs text-muted-foreground ml-auto">{child.bcNumber}</span>
                </Link>

                {/* Teachers for schools */}
                {child.teachers && child.teachers.length > 0 && (
                  <div className="ml-6 border-l-2 border-teacher/20 pl-4 space-y-1">
                    {child.teachers.slice(0, 5).map((teacher) => (
                      <Link
                        key={teacher.id}
                        to={`/contacts/${teacher.id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-sm"
                      >
                        <GraduationCap className="h-3 w-3 text-teacher" />
                        <span>{teacher.name}</span>
                      </Link>
                    ))}
                    {child.teachers.length > 5 && (
                      <p className="text-xs text-muted-foreground pl-5">
                        +{child.teachers.length - 5} fler lärare
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
