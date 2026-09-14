import React, { ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-md w-full p-6 border border-cyan-500/40 bg-slate-950/90 rounded-xl shadow-[0_0_50px_rgba(0,242,255,0.2)] space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-amber-500/20 border border-amber-500/50 rounded-full text-amber-400">
                <AlertTriangle className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h2 className="text-lg font-bold tracking-widest text-white uppercase">
              Recuperación de Subsistema // J.A.R.V.I.S.
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Se detectó una interrupción en el renderizador (frecuentemente causada por extensiones del navegador o el traductor automático).
            </p>
            <div className="p-3 bg-black/60 border border-slate-800 rounded text-[11px] text-rose-400 text-left font-mono overflow-auto max-h-24">
              {this.state.error?.message || 'Error de manipulación DOM'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 text-cyan-200 font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-cyan-950/50"
            >
              <RefreshCw className="w-4 h-4" />
              <span>RESTAURAR SUBSISTEMA Y REINICIAR</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
