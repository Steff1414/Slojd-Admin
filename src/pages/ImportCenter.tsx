import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { useUserRole } from '@/hooks/useUserRole';
import { downloadTemplate } from '@/lib/excelTemplate';
import { parseExcelFile } from '@/lib/excelParser';
import { validateImport } from '@/lib/importValidator';
import { executeImport } from '@/lib/importExecutor';
import type { ParsedImportData, ValidationResult, ImportSummary, ValidationIssue } from '@/types/import';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldAlert,
  Loader2,
  FileCheck,
  Building2,
  Users,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type ImportStep = 'upload' | 'validation' | 'importing' | 'complete';

export default function ImportCenter() {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [step, setStep] = useState<ImportStep>('upload');
  const [parsedData, setParsedData] = useState<ParsedImportData | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast({ title: 'Endast .xlsx-filer stöds', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const data = await parseExcelFile(file);
      setParsedData(data);

      const validation = await validateImport(data);
      setValidationResult(validation);
      setStep('validation');
    } catch (error) {
      console.error('Parse error:', error);
      toast({ title: 'Kunde inte läsa filen', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleImport = async () => {
    if (!parsedData || !validationResult?.canImport) return;

    setStep('importing');
    setLoading(true);
    try {
      const summary = await executeImport(parsedData, user?.id || null);
      setImportSummary(summary);
      setStep('complete');
      toast({ title: 'Import slutförd!' });
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import misslyckades', variant: 'destructive' });
      setStep('validation');
    }
    setLoading(false);
  };

  const resetImport = () => {
    setStep('upload');
    setParsedData(null);
    setValidationResult(null);
    setImportSummary(null);
  };

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="animate-pulse h-64 bg-muted rounded-xl" />
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Endast administratörer kan importera data</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Import Center</h1>
            <p className="text-muted-foreground">Importera kunder, kontakter och betalarrelationer från Excel</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          <StepIndicator step={1} current={step} label="Ladda upp" />
          <div className="flex-1 h-px bg-border" />
          <StepIndicator step={2} current={step} label="Validera" />
          <div className="flex-1 h-px bg-border" />
          <StepIndicator step={3} current={step} label="Importera" />
        </div>

        {step === 'upload' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Steg 1: Ladda ner mall
                </CardTitle>
                <CardDescription>
                  Börja med att ladda ner Excel-mallen med rätt format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Ladda ner import_template.xlsx
                </Button>
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p>Mallen innehåller 3 flikar:</p>
                  <ul className="list-disc list-inside ml-2">
                    <li><strong>Customers</strong> - Kunder</li>
                    <li><strong>Contacts</strong> - Kontakter</li>
                    <li><strong>Payers</strong> - Betalarrelationer</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Steg 2: Ladda upp ifylld fil
                </CardTitle>
                <CardDescription>
                  Ladda upp din ifyllda Excel-fil för validering
                </CardDescription>
              </CardHeader>
              <CardContent>
                <label className="block">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    {loading ? (
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Klicka för att välja fil eller dra och släpp
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Endast .xlsx-filer
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'validation' && validationResult && (
          <div className="space-y-6">
            <ValidationSummaryCards result={validationResult} />

            <Tabs defaultValue="customers">
              <TabsList>
                <TabsTrigger value="customers">
                  Kunder ({validationResult.customers.rowsRead})
                </TabsTrigger>
                <TabsTrigger value="contacts">
                  Kontakter ({validationResult.contacts.rowsRead})
                </TabsTrigger>
                <TabsTrigger value="payers">
                  Betalare ({validationResult.payers.rowsRead})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="customers">
                <ValidationIssuesList issues={validationResult.customers.issues} />
              </TabsContent>
              <TabsContent value="contacts">
                <ValidationIssuesList issues={validationResult.contacts.issues} />
              </TabsContent>
              <TabsContent value="payers">
                <ValidationIssuesList issues={validationResult.payers.issues} />
              </TabsContent>
            </Tabs>

            <div className="flex gap-4">
              <Button variant="outline" onClick={resetImport}>
                Börja om
              </Button>
              <Button
                onClick={handleImport}
                disabled={!validationResult.canImport || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileCheck className="h-4 w-4 mr-2" />
                )}
                {validationResult.canImport ? 'Bekräfta & Importera' : 'Fixa fel först'}
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-lg font-medium">Importerar data...</p>
              <p className="text-sm text-muted-foreground">Detta kan ta en stund</p>
            </CardContent>
          </Card>
        )}

        {step === 'complete' && importSummary && (
          <div className="space-y-6">
            <Alert className="border-success/50 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertTitle>Import slutförd!</AlertTitle>
              <AlertDescription>
                All data har importerats framgångsrikt.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-customer" />
                    Kunder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importSummary.customersCreated + importSummary.customersUpdated}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {importSummary.customersCreated} skapade, {importSummary.customersUpdated} uppdaterade
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-contact" />
                    Kontakter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importSummary.contactsCreated + importSummary.contactsUpdated}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {importSummary.contactsCreated} skapade, {importSummary.contactsUpdated} uppdaterade
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-payer" />
                    Betalarrelationer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {importSummary.payerLinksCreated + importSummary.payerLinksUpdated}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {importSummary.payerLinksCreated} skapade, {importSummary.payerLinksUpdated} uppdaterade
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link to="/customers">
                <Button variant="outline">Visa kunder</Button>
              </Link>
              <Link to="/contacts">
                <Button variant="outline">Visa kontakter</Button>
              </Link>
              <Link to="/audit-log">
                <Button variant="outline">Visa ändringslogg</Button>
              </Link>
              <Button onClick={resetImport}>Ny import</Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StepIndicator({ step, current, label }: { step: number; current: ImportStep; label: string }) {
  const stepMap: Record<ImportStep, number> = { upload: 1, validation: 2, importing: 3, complete: 3 };
  const currentNum = stepMap[current];
  const isActive = step <= currentNum;
  const isComplete = step < currentNum || current === 'complete';

  return (
    <div className="flex items-center gap-2">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        isComplete ? 'bg-success text-success-foreground' : 
        isActive ? 'bg-primary text-primary-foreground' : 
        'bg-muted text-muted-foreground'
      }`}>
        {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
    </div>
  );
}

function ValidationSummaryCards({ result }: { result: ValidationResult }) {
  const sheets = [
    { key: 'customers', label: 'Kunder', data: result.customers, icon: Building2 },
    { key: 'contacts', label: 'Kontakter', data: result.contacts, icon: Users },
    { key: 'payers', label: 'Betalare', data: result.payers, icon: CreditCard },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sheets.map(({ key, label, data, icon: Icon }) => (
        <Card key={key} className={data.rowsWithErrors > 0 ? 'border-destructive/50' : data.rowsWithWarnings > 0 ? 'border-warning/50' : 'border-success/50'}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>{data.rowsValid}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <span>{data.rowsWithWarnings}</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>{data.rowsWithErrors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ValidationIssuesList({ issues }: { issues: ValidationIssue[] }) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-success" />
          Inga problem hittades
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ScrollArea className="h-64">
          <div className="divide-y divide-border">
            {issues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3">
                {issue.severity === 'ERROR' ? (
                  <XCircle className="h-4 w-4 text-destructive mt-0.5" />
                ) : issue.severity === 'WARNING' ? (
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-info mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={issue.severity === 'ERROR' ? 'destructive' : 'secondary'}>
                      Rad {issue.rowNumber}
                    </Badge>
                    {issue.field && (
                      <Badge variant="outline">{issue.field}</Badge>
                    )}
                    <span className="text-xs text-muted-foreground truncate">{issue.entityKey}</span>
                  </div>
                  <p className="text-sm">{issue.message}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
