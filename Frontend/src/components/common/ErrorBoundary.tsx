import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('SindhuDrishti Runtime Caught Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public handleReload = () => {
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[480px] w-full flex items-center justify-center p-6 font-['DM_Sans',sans-serif]">
          <div className="max-w-xl w-full p-8 rounded-2xl bg-[#030919]/90 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)] backdrop-blur-xl flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 mb-5 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <AlertOctagon className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white tracking-tight mb-2">
              {this.props.fallbackTitle || 'Runtime Render Recovery'}
            </h2>

            <p className="text-sm text-zinc-400 mb-6 max-w-md">
              A client-side component experienced an unexpected issue. The application prevented a crash to keep your session safe.
            </p>

            {this.state.error && (
              <div className="w-full mb-6 p-4 rounded-xl bg-slate-950/80 border border-red-900/40 text-left overflow-x-auto">
                <p className="text-xs font-mono text-red-300 font-semibold mb-1">
                  {this.state.error.name}: {this.state.error.message}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[11px] font-mono text-zinc-500 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-950/80 border border-sky-800/60 text-sky-300 text-xs font-semibold hover:border-sky-400 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(56,189,248,0.4)] cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
