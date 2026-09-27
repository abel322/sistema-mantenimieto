import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import ThemeProvider from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'Sonora Academy | Sound Studio & Music Production LMS',
  description: 'Next-generation academy for music producers, audio engineers, and instrumentalists. Featuring real-time Web Audio synths and A/B waveform analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-[#070A11] text-slate-900 dark:text-gray-100 antialiased selection:bg-synth-violet selection:text-white relative transition-colors duration-200">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          {/* Ambient Corner Radial Glows */}
          <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-synth-violet/20 dark:from-synth-violet/25 to-synth-indigo/10 blur-[130px] pointer-events-none -z-10 rounded-full opacity-40 dark:opacity-100 transition-opacity" />
          <div className="fixed bottom-0 right-0 w-[550px] h-[550px] bg-gradient-to-tl from-synth-cyan/15 dark:from-synth-cyan/20 to-analog-amber/10 blur-[140px] pointer-events-none -z-10 rounded-full opacity-40 dark:opacity-100 transition-opacity" />
          <div className="fixed top-1/3 right-1/4 w-[350px] h-[350px] bg-analog-rose/10 blur-[120px] pointer-events-none -z-10 rounded-full opacity-40 dark:opacity-100 transition-opacity" />

          {/* Top Navigation */}
          <Navbar />

          {/* Main Content Viewport */}
          <main className="min-h-[calc(100vh-80px)]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-[#0B0F19] backdrop-blur-md py-8 px-6 text-sm text-slate-600 dark:text-slate-400 transition-colors">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-electric flex items-center justify-center font-bold text-white text-xs shadow-sm">
                  S
                </div>
                <span className="font-semibold text-slate-800 dark:text-gray-200">Sonora Academy</span>
                <span className="text-xs text-slate-500 dark:text-gray-500">© 2026 Interactive Sound Systems</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  Tone.js Engine: Active
                </span>
                <span>Wavesurfer Audio Inspector v7.8</span>
                <span>5 Musical Tracks</span>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
