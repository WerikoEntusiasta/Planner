import React from 'react';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught React Error in Planner:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAll = () => {
    try {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((names) => {
          for (const name of names) {
            caches.delete(name);
          }
        });
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Reset cleanup warning:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0d0d12] text-zinc-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#16161f] border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold font-display text-white">
                Ocorreu uma instabilidade na exibição
              </h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Detectamos uma falha temporária de renderização. Clique abaixo para recarregar ou limpar o cache do aplicativo.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-black/50 border border-zinc-800/80 rounded-xl p-3 text-left overflow-hidden">
                <p className="text-[11px] font-mono text-red-400 truncate">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw size={14} />
                Recarregar Página
              </button>

              <button
                onClick={this.handleResetAll}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 size={13} className="text-amber-400" />
                Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
