import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary global. Si algo en el árbol crashea, evita la pantalla en blanco
 * y muestra un fallback con opción de recargar o volver al inicio.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Podría mandar a un servicio de logging tipo Sentry acá.
    console.error('[ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-svh flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 space-y-4 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h1 className="font-semibold">Ups, algo salió mal</h1>
              <p className="text-xs text-slate-500">La app tuvo un error inesperado.</p>
            </div>
          </div>

          {this.state.error?.message && (
            <div className="text-xs text-slate-600 dark:text-slate-400 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg font-mono break-words">
              {this.state.error.message}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" fullWidth onClick={this.handleHome}>
              Ir al inicio
            </Button>
            <Button fullWidth onClick={this.handleReload}>
              Recargar
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
