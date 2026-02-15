import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (user) {
        navigate('/dashboard');
      } else {
        const hash = window.location.hash?.slice(1);
        const params = hash ? Object.fromEntries(new URLSearchParams(hash)) : {};
        const errorDesc = params.error_description || params.error;
        if (errorDesc) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        navigate('/auth', {
          replace: true,
          state: errorDesc ? { message: `Inloggning misslyckades: ${errorDesc}` } : {},
        });
      }
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-12 h-12 rounded-xl bg-primary/20" />
      </div>
    </div>
  );
}
