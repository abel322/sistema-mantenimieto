'use client';

import React from 'react';
import { RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PracticeErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface PracticeErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional fallback to render instead of the default rescue UI */
  fallback?: React.ReactNode;
  /** Called when the user clicks "Reiniciar" */
  onReset?: () => void;
}

/**
 * PracticeErrorBoundary
 *
 * Error Boundary class component that wraps the Synthesia practice stage.
 * Catches any unhandled exceptions thrown during rendering or effects
 * (including Tone.js audio graph failures and Canvas drawing errors)
 * and presents a rescue interface instead of a blank screen.
 *
 * React error boundaries MUST be class components — they cannot be
 * implemented as function components.
 */
export default class PracticeErrorBoundary extends React.Component<
  PracticeErrorBoundaryProps,
  PracticeErrorBoundaryState
> {
  constructor(props: PracticeErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): Partial<PracticeErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log structured error for debugging — never rethrow
    console.error('[PracticeErrorBoundary] Caught unhandled error in practice stage:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // ── Tone.js Audio cleanup ──────────────────────────────────────────────────
    // If audio nodes are in a bad state, try to stop everything gracefully
    try {
      // Lazy import to avoid circular dependency at module level
      import('@/services/audio/keysAudioEngine').then(({ keysAudioEngine }) => {
        try {
          keysAudioEngine.stopAll();
        } catch (_) {}
      });
    } catch (_) {}

    // ── Tone.js Transport cleanup ──────────────────────────────────────────────
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
      const isAudioError =
        errorMsg.toLowerCase().includes('channeldata') ||
        errorMsg.toLowerCase().includes('audiobuffer') ||
        errorMsg.toLowerCase().includes('tone') ||
        errorMsg.toLowerCase().includes('webaudio');

      return (
        <div className="fixed inset-0 z-[200] w-screen h-screen bg-[#060a14] flex items-center justify-center p-6">
          {/* Ambient background glow */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-md w-full flex flex-col items-center gap-6 text-center">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-xl font-black text-slate-100 mb-1">
                Error en el Reproductor de Práctica
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isAudioError
                  ? 'El motor de audio no pudo inicializarse correctamente. Esto suele ocurrir cuando el AudioContext no ha sido activado por una interacción del usuario.'
                  : 'Se produjo un error inesperado al cargar el escenario Synthesia. Esto no afecta tus datos de práctica.'}
              </p>
            </div>

            {/* Error detail (dev only) */}
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

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                id="practice-error-reset-btn"
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar Reproductor
              </button>
              <a
                href="/studio/keys"
                id="practice-error-back-btn"
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm border border-slate-700/80 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Editor
              </a>
            </div>

            {/* Tip */}
            <p className="text-xs text-slate-600 font-mono">
              {isAudioError
                ? 'TIP: Interactúa con la página antes de abrir el reproductor para activar el AudioContext.'
                : 'Tus rutinas y configuraciones están guardadas de forma segura.'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
