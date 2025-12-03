import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Code, ArrowRight } from 'lucide-react';

export default function ApiDocs() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">API Dokumentation</h1>
            <p className="text-muted-foreground">REST API för externa integrationer</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Översikt</CardTitle>
            <CardDescription>
              API:et ger externa system möjlighet att söka och importera kontaktdata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge>Base URL</Badge>
                <code className="px-2 py-1 rounded bg-muted font-mono text-xs">/api</code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Auth</Badge>
                <span className="text-muted-foreground">Bearer token (JWT)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* GET /contacts/search */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-success/10 text-success border-success">GET</Badge>
                <code className="font-mono text-sm">/api/contacts/search</code>
              </div>
              <CardDescription>Sök kontakter med fritext</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="params">
                <TabsList>
                  <TabsTrigger value="params">Parametrar</TabsTrigger>
                  <TabsTrigger value="response">Svar</TabsTrigger>
                  <TabsTrigger value="example">Exempel</TabsTrigger>
                </TabsList>
                <TabsContent value="params" className="mt-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <code className="font-mono text-sm text-primary">q</code>
                      <div>
                        <p className="text-sm font-medium">Sökterm</p>
                        <p className="text-xs text-muted-foreground">Söker i namn, e-post och voyado_id</p>
                      </div>
                      <Badge variant="destructive" className="ml-auto">Required</Badge>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <code className="font-mono text-sm text-primary">limit</code>
                      <div>
                        <p className="text-sm font-medium">Max antal resultat</p>
                        <p className="text-xs text-muted-foreground">Standard: 20, Max: 100</p>
                      </div>
                      <Badge variant="outline" className="ml-auto">Optional</Badge>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="response" className="mt-4">
                  <ScrollArea className="h-48 rounded-lg border p-4 bg-muted/30">
                    <pre className="text-xs font-mono">{`{
  "data": [
    {
      "id": "uuid",
      "first_name": "Anna",
      "last_name": "Andersson",
      "email": "anna@example.com",
      "phone": "+46701234567",
      "voyado_id": "VOY-12345",
      "contact_type": "Teacher",
      "is_teacher": true
    }
  ],
  "count": 1
}`}</pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="example" className="mt-4">
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <code className="text-xs font-mono">
                      GET /api/contacts/search?q=anna&limit=10
                    </code>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* POST /contacts/import */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning">POST</Badge>
                <code className="font-mono text-sm">/api/contacts/import</code>
              </div>
              <CardDescription>Importera flera kontakter på en gång</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="body">
                <TabsList>
                  <TabsTrigger value="body">Request Body</TabsTrigger>
                  <TabsTrigger value="response">Svar</TabsTrigger>
                  <TabsTrigger value="example">Exempel</TabsTrigger>
                </TabsList>
                <TabsContent value="body" className="mt-4">
                  <ScrollArea className="h-64 rounded-lg border p-4 bg-muted/30">
                    <pre className="text-xs font-mono">{`{
  "contacts": [
    {
      "first_name": "Erik",      // required
      "last_name": "Eriksson",   // required
      "email": "erik@school.se", // required
      "voyado_id": "VOY-NEW-1",  // required
      "phone": "+46701112233",   // optional
      "contact_type": "Teacher", // optional
      "is_teacher": true,        // optional
      "notes": "Slöjdlärare",    // optional
      "customer_links": [        // optional
        {
          "customer_bc_number": "BC-10001",
          "relationship_type": "TeacherAtSchool",
          "is_primary": false
        }
      ]
    }
  ]
}`}</pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="response" className="mt-4">
                  <ScrollArea className="h-48 rounded-lg border p-4 bg-muted/30">
                    <pre className="text-xs font-mono">{`{
  "summary": {
    "total": 5,
    "created": 3,
    "updated": 1,
    "errors": 1
  },
  "results": [
    {
      "voyado_id": "VOY-NEW-1",
      "status": "created",
      "id": "uuid-1"
    },
    {
      "voyado_id": "VOY-NEW-2",
      "status": "updated",
      "id": "uuid-2"
    },
    {
      "voyado_id": "VOY-NEW-3",
      "status": "error",
      "error": "Missing required field: email"
    }
  ]
}`}</pre>
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="example" className="mt-4">
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                    <code className="text-xs font-mono block">POST /api/contacts/import</code>
                    <code className="text-xs font-mono block text-muted-foreground">Content-Type: application/json</code>
                    <code className="text-xs font-mono block text-muted-foreground">Authorization: Bearer {"<token>"}</code>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Error Codes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Felkoder</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  <Badge variant="outline">400</Badge>
                  <span className="text-sm">Ogiltig begäran - kontrollera parametrar</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  <Badge variant="outline">401</Badge>
                  <span className="text-sm">Ej autentiserad - saknar giltig token</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  <Badge variant="outline">403</Badge>
                  <span className="text-sm">Ej behörig - saknar rätt behörigheter</span>
                </div>
                <div className="flex items-center gap-3 p-2 rounded bg-muted/50">
                  <Badge variant="outline">500</Badge>
                  <span className="text-sm">Serverfel - försök igen senare</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
