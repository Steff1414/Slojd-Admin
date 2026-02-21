import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchNorceCustomerByCode } from '@/integrations/norce';
import type { NorceCustomer } from '@/types/norce';

export function NorceCustomerLookup() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NorceCustomer | null>(null);

  const handleLookup = async () => {
    const code = query.trim();
    if (!code) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const customer = await fetchNorceCustomerByCode(code);
      if (!customer) {
        setError('Ingen kund hittades för kundkoden');
        return;
      }
      setResult(customer);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Okänt fel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Hämta kund via exakt kundkod (CustomerCode)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleLookup} disabled={loading || !query.trim()}>
            {loading ? 'Hämtar...' : 'Hämta kund'}
          </Button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {result && (
          <div className="rounded-md border bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">
                {[result.FirstName, result.LastName].filter(Boolean).join(' ') || 'Namn saknas'}
              </h3>
              <Badge variant={result.IsActive ? 'default' : 'secondary'}>
                {result.IsActive ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
              <p><span className="text-muted-foreground">Kundkod:</span> <span className="font-mono">{result.CustomerCode || '-'}</span></p>
              <p><span className="text-muted-foreground">Norce ID:</span> <span className="font-mono">{result.Id}</span></p>
              <p><span className="text-muted-foreground">E-post:</span> {result.EmailAddress || '-'}</p>
              <p><span className="text-muted-foreground">Telefon:</span> {result.CellPhoneNumber || result.PhoneNumber || '-'}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
