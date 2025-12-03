import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Profile } from '@/types/database';
import { KeyRound, Mail, RefreshCw, Eye, EyeOff, Copy, Check } from 'lucide-react';

interface UserAccountManagementProps {
  profile: Profile;
  contactId: string;
  onUpdate: () => void;
}

export function UserAccountManagement({ profile, contactId, onUpdate }: UserAccountManagementProps) {
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const [generating, setGenerating] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleGenerateNewPassword = async () => {
    setGenerating(true);
    const password = generatePassword();

    try {
      // In a real app, this would call an edge function to update the user's password
      // For demo, we just simulate and log it
      const { error } = await supabase
        .from('norce_password_sync_log')
        .insert({
          profile_id: profile.id,
          status: 'password_reset_generated',
        });

      if (error) throw error;

      // Log the action (without the actual password)
      await logAction('profile', profile.id, 'password_reset', null, { 
        action: 'password_generated',
        timestamp: new Date().toISOString(),
      } as any);

      setNewPassword(password);
      toast({ 
        title: 'Nytt lösenord genererat',
        description: 'Kopiera lösenordet och skicka det till användaren på ett säkert sätt.',
      });
    } catch (error: any) {
      toast({ 
        title: 'Kunde inte generera lösenord', 
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Lösenord kopierat' });
    }
  };

  const handleClearPassword = () => {
    setNewPassword(null);
    setShowPassword(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          Användarhantering
        </CardTitle>
        <CardDescription>Hantera inloggning och lösenord</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Info */}
        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{profile.email}</p>
            <p className="text-sm text-muted-foreground">
              {profile.is_active ? 'Aktivt konto' : 'Inaktivt konto'}
            </p>
          </div>
          {profile.is_active ? (
            <Badge variant="success">Aktiv</Badge>
          ) : (
            <Badge variant="destructive">Inaktiv</Badge>
          )}
        </div>

        {/* Password Management */}
        <div className="space-y-3 pt-3 border-t border-border">
          <Label className="text-sm font-medium">Lösenordshantering</Label>
          
          {newPassword ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <p className="text-sm text-warning-foreground mb-2">
                  Nytt lösenord genererat. Kopiera och skicka till användaren på ett säkert sätt:
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                  >
                    {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearPassword}>
                Rensa och dölj
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleGenerateNewPassword}
                disabled={generating}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Genererar...' : 'Generera nytt lösenord'}
              </Button>
              <span className="text-sm text-muted-foreground">
                Skickas inte automatiskt
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground pt-3 border-t border-border">
          <p>Användaren loggar in med e-postadressen ovan. Lösenordet måste kommuniceras säkert (ej via e-post om möjligt).</p>
        </div>
      </CardContent>
    </Card>
  );
}
