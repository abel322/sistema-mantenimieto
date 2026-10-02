'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface DrumPracticeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface DrumPracticeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export default class DrumPracticeErrorBoundary extends React.Component<
  DrumPracticeErrorBoundaryProps,
  DrumPracticeErrorBoundaryState
> {
  constructor(props: DrumPracticeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<DrumPracticeErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    console.error('[DrumPracticeErrorBoundary] Unhandled error in Drum Practice Stage:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Cleanup Tone.js Transport
    try {
      import('tone').then((Tone) => {
        try {
          Tone.getTransport().stop();
        } catch (_) {}
      });
    } catch (_) {}
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isDev = process.env.NODE_ENV === 'development';
      const errorMsg = this.state.error?.message || 'Error desconocido';

      return (
        <div className="fixed inset-0 z-[200] w-screen h-screen bg-[#060a14] flex items-center justify-center p-6 select-none">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-md w-full flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-100 mb-1.5">
                Error en el Reproductor de Batería
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Se detectó una excepción no controlada en el motor de audio o en la pista visual. Tus configuraciones de ejercicio y métrica están a salvo.
              </p>
            </div>

            {isDev && (
              <div className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 p-4 text-left">
                <p className="text-xs font-mono text-red-300 break-all leading-relaxed">
                  {errorMsg}
                </p>
                {this.state.errorInfo?.componentStack && (
                  <details className="mt-3">
                    <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
                      Component stack
                    </summary>
                    <pre className="mt-2 text-[10px] text-slate-500 overflow-auto max-h-40 leading-relaxed">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Reproductor
              </button>
              <a
                href="/studio/drums"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700/80 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Editor
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
