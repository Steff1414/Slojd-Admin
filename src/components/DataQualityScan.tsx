import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDataQualityScan, DuplicateGroup, AnomalyItem } from '@/hooks/useDataQualityScan';
import {
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Building2,
  Users,
  GraduationCap,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';

const typeLabels: Record<DuplicateGroup['type'], string> = {
  school_name: 'Duplicerade skolnamn',
  customer_name: 'Duplicerade kundnamn (B2B/B2G)',
  contact_email: 'Duplicerade e-postadresser (kontakter)',
  teacher_email: 'Duplicerade e-postadresser (lärare)',
  bc_number: 'Duplicerade BC-kundnummer',
  voyado_id: 'Duplicerade Voyado ID',
  norce_code: 'Duplicerade Norce-koder',
  sitoo_number: 'Duplicerade Sitoo-nummer',
};

const anomalyLabels: Record<AnomalyItem['type'], string> = {
  school_no_payer: 'Skolor utan betalare',
  teacher_no_school: 'Lärare utan skolkoppling',
};

export function DataQualityScan() {
  const { loading, report, runScan, searchDuplicates } = useDataQualityScan();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<DuplicateGroup[]>([]);
  const [searching, setSearching] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await searchDuplicates(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const toggleGroup = (key: string) => {
    const next = new Set(expandedGroups);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setExpandedGroups(next);
  };

  const getEntityIcon = (type: 'Customer' | 'Contact' | 'Teacher') => {
    switch (type) {
      case 'Customer':
        return <Building2 className="h-4 w-4 text-customer" />;
      case 'Teacher':
        return <GraduationCap className="h-4 w-4 text-teacher" />;
      default:
        return <Users className="h-4 w-4 text-contact" />;
    }
  };

  const getEntityLink = (record: DuplicateGroup['records'][0]) => {
    if (record.entityType === 'Customer') {
      return `/customers/${record.id}`;
    }
    return `/contacts/${record.id}`;
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-info" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Datakvalitetskontroll
            </CardTitle>
            <CardDescription>Sök efter dubbletter och anomalier i databasen</CardDescription>
          </div>
          <Button onClick={runScan} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Skannar...' : 'Kör skanning'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duplicate Search */}
        <div className="flex gap-2">
          <Input
            placeholder="Sök efter dubbletter (namn, e-post, ID)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={searching} variant="secondary">
            {searching ? 'Söker...' : 'Sök'}
          </Button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Sökresultat</h4>
            {searchResults.map((group, idx) => (
              <DuplicateGroupCard
                key={`search-${idx}`}
                group={group}
                expanded={expandedGroups.has(`search-${idx}`)}
                onToggle={() => toggleGroup(`search-${idx}`)}
                getEntityIcon={getEntityIcon}
                getEntityLink={getEntityLink}
                getSeverityIcon={getSeverityIcon}
              />
            ))}
          </div>
        )}

        {/* Scan Report */}
        {report && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{report.summary.totalDuplicateGroups}</p>
                <p className="text-sm text-muted-foreground">Duplicatgrupper</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-2xl font-bold">{report.summary.totalAnomalies}</p>
                <p className="text-sm text-muted-foreground">Anomalier</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <p className="text-2xl font-bold text-destructive">{report.summary.criticalIssues}</p>
                <p className="text-sm text-muted-foreground">Kritiska</p>
              </div>
              <div className="p-4 rounded-lg bg-warning/10">
                <p className="text-2xl font-bold text-warning">{report.summary.warnings}</p>
                <p className="text-sm text-muted-foreground">Varningar</p>
              </div>
            </div>

            {report.summary.totalDuplicateGroups === 0 && report.summary.totalAnomalies === 0 ? (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20">
                <CheckCircle className="h-5 w-5 text-success" />
                <p className="font-medium text-success">Inga problem hittades!</p>
              </div>
            ) : (
              <>
                {/* Critical ID Duplicates */}
                {report.duplicates.filter(d => d.severity === 'error').length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Kritiska ID-duplikat
                    </h4>
                    {report.duplicates
                      .filter(d => d.severity === 'error')
                      .map((group, idx) => (
                        <DuplicateGroupCard
                          key={`error-${idx}`}
                          group={group}
                          expanded={expandedGroups.has(`error-${idx}`)}
                          onToggle={() => toggleGroup(`error-${idx}`)}
                          getEntityIcon={getEntityIcon}
                          getEntityLink={getEntityLink}
                          getSeverityIcon={getSeverityIcon}
                        />
                      ))}
                  </div>
                )}

                {/* Warning Duplicates */}
                {report.duplicates.filter(d => d.severity === 'warning').length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-warning flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Potentiella dubbletter
                    </h4>
                    {report.duplicates
                      .filter(d => d.severity === 'warning')
                      .map((group, idx) => (
                        <DuplicateGroupCard
                          key={`warn-${idx}`}
                          group={group}
                          expanded={expandedGroups.has(`warn-${idx}`)}
                          onToggle={() => toggleGroup(`warn-${idx}`)}
                          getEntityIcon={getEntityIcon}
                          getEntityLink={getEntityLink}
                          getSeverityIcon={getSeverityIcon}
                        />
                      ))}
                  </div>
                )}

                {/* Anomalies */}
                {report.anomalies.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-muted-foreground flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Anomalier
                    </h4>
                    {report.anomalies.map((anomaly, idx) => (
                      <AnomalyCard
                        key={`anomaly-${idx}`}
                        anomaly={anomaly}
                        expanded={expandedGroups.has(`anomaly-${idx}`)}
                        onToggle={() => toggleGroup(`anomaly-${idx}`)}
                        getEntityIcon={getEntityIcon}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Senast skannad: {report.scannedAt.toLocaleString('sv-SE')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DuplicateGroupCard({
  group,
  expanded,
  onToggle,
  getEntityIcon,
  getEntityLink,
  getSeverityIcon,
}: {
  group: DuplicateGroup;
  expanded: boolean;
  onToggle: () => void;
  getEntityIcon: (type: 'Customer' | 'Contact' | 'Teacher') => React.ReactNode;
  getEntityLink: (record: DuplicateGroup['records'][0]) => string;
  getSeverityIcon: (severity: 'error' | 'warning' | 'info') => React.ReactNode;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {getSeverityIcon(group.severity)}
            <div>
              <p className="font-medium">{group.value}</p>
              <p className="text-sm text-muted-foreground">{typeLabels[group.type]}</p>
            </div>
          </div>
          <Badge variant={group.severity === 'error' ? 'destructive' : 'secondary'}>
            {group.records.length} poster
          </Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Typ</TableHead>
                <TableHead>Namn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>ID</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {group.records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEntityIcon(record.entityType)}
                      <span className="text-sm">{record.entityType}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{record.email || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {record.bcNumber || record.voyadoId || record.norceCode || record.sitooNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Link to={getEntityLink(record)}>
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function AnomalyCard({
  anomaly,
  expanded,
  onToggle,
  getEntityIcon,
}: {
  anomaly: AnomalyItem;
  expanded: boolean;
  onToggle: () => void;
  getEntityIcon: (type: 'Customer' | 'Contact' | 'Teacher') => React.ReactNode;
}) {
  return (
    <Collapsible open={expanded} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <AlertTriangle className="h-4 w-4 text-warning" />
            <p className="font-medium">{anomalyLabels[anomaly.type]}</p>
          </div>
          <Badge variant="secondary">{anomaly.records.length} poster</Badge>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2 pl-8">
          {anomaly.records.map((record) => (
            <Link
              key={record.id}
              to={record.entityType === 'Customer' ? `/customers/${record.id}` : `/contacts/${record.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                {getEntityIcon(record.entityType as 'Customer' | 'Contact' | 'Teacher')}
                <span>{record.name}</span>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
