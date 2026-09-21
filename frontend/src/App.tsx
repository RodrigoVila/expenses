import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/pages/Dashboard';
import { Movimientos } from '@/pages/Movimientos';
import { Anual } from '@/pages/Anual';
import { Categorias } from '@/pages/Categorias';
import { Fijos } from '@/pages/Fijos';
import { Hogar } from '@/pages/Hogar';
import { HogarDetail } from '@/pages/HogarDetail';
import { Login } from '@/pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

export default function App() {
  return (
    <ErrorBoundary>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <Toaster
                position="top-center"
                richColors
                closeButton
                toastOptions={{
                  duration: 3000,
                }}
              />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="movimientos" element={<Movimientos />} />
                  <Route path="anual" element={<Anual />} />
                  <Route path="categorias" element={<Categorias />} />
                  <Route path="fijos" element={<Fijos />} />
                  <Route path="hogar" element={<Hogar />} />
                  <Route path="hogar/:id" element={<HogarDetail />} />
                </Route>
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </GoogleOAuthProvider>
    </ErrorBoundary>
  );
}
