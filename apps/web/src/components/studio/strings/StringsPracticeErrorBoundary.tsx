'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface StringsPracticeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface StringsPracticeErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
}

export default class StringsPracticeErrorBoundary extends React.Component<
  StringsPracticeErrorBoundaryProps,
  StringsPracticeErrorBoundaryState
> {
  constructor(props: StringsPracticeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<StringsPracticeErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    console.error('[StringsPracticeErrorBoundary] Error en Escenario de Cuerdas:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Detener transporte Tone.js
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

      return (
        <div className="min-h-screen w-full bg-[#080c14] text-slate-100 flex items-center justify-center p-6 select-none">
          <div className="max-w-md w-full rounded-3xl bg-slate-900/90 border border-red-500/30 p-8 shadow-2xl flex flex-col items-center text-center space-y-6 backdrop-blur-xl">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 shadow-glow-rose">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Interrupción en el Escenario de Cuerdas
              </h2>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                El motor de audio o el renderizado del mástil encontró una excepción. El contexto ha
                sido estabilizado para evitar bloqueos del navegador.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-red-300/80 text-left overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-mono text-xs transition-all flex items-center justify-center gap-2 shadow-glow-cyan cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reiniciar Reproductor</span>
              </button>

              <a
                href="/studio/strings"
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Editor</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
