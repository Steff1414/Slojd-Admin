import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { toast } from 'sonner';
import { Lock, Loader2, UserCircle, Mail } from 'lucide-react';
import { z } from 'zod';

const changePasswordSchema = z
  .object({
    newPassword: z.string().min(6, { message: 'Lösenordet måste vara minst 6 tecken' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  });

export default function Account() {
  const { user, updatePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === 'google' || 
    user?.identities?.some((i) => i.provider === 'google');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = changePasswordSchema.safeParse({ newPassword, confirmPassword });
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Lösenordet har uppdaterats');
        setNewPassword('');
        setConfirmPassword('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Mitt konto</h1>
          <p className="text-muted-foreground mt-1">Hantera din inloggning och lösenord</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Kontoinformation
            </CardTitle>
            <CardDescription>Din inloggningsinformation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">E-post</p>
                <p className="font-medium">{user?.email}</p>
              </div>
            </div>
            {isGoogleUser && (
              <p className="text-sm text-muted-foreground">
                Du loggade in med Google. Du kan ange ett lösenord nedan för att även kunna logga in med e-post.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Ändra lösenord
            </CardTitle>
            <CardDescription>
              Ange ett nytt lösenord. Det måste vara minst 6 tecken.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nytt lösenord</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minst 6 tecken"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Bekräfta lösenord</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Skriv lösenordet igen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uppdaterar...
                  </>
                ) : (
                  'Spara nytt lösenord'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
