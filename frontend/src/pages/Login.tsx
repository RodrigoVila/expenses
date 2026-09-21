import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { Wallet } from 'lucide-react';

export function Login() {
  const { user, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Si ya está logueado (por token existente o post-login), lo mandamos al home
  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-6 bg-gradient-to-br from-brand-600 to-brand-700">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 mx-auto flex items-center justify-center">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-slate-500">Iniciá sesión para gestionar tus gastos</p>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={async (cred) => {
              if (!cred.credential) {
                setError('No se recibió el credential de Google');
                return;
              }
              setError(null);
              setLoading(true);
              try {
                await loginWithGoogle(cred.credential);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Falló el login');
              } finally {
                setLoading(false);
              }
            }}
            onError={() => setError('Falló el login de Google')}
            useOneTap={false}
          />
        </div>

        {loading && (
          <p className="text-sm text-slate-500 text-center">Ingresando...</p>
        )}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}

        <p className="text-xs text-slate-400 text-center">
          Al continuar aceptás que la app guarde tu email y nombre para asociarlos a tus movimientos.
        </p>
      </div>
    </div>
  );
}
