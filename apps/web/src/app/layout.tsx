import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';

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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-obsidian-canvas text-gray-100 antialiased selection:bg-synth-violet selection:text-white relative">
        {/* Ambient Corner Radial Glows */}
        <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-synth-violet/25 to-synth-indigo/10 blur-[130px] pointer-events-none -z-10 rounded-full" />
        <div className="fixed bottom-0 right-0 w-[550px] h-[550px] bg-gradient-to-tl from-synth-cyan/20 to-analog-amber/10 blur-[140px] pointer-events-none -z-10 rounded-full" />
        <div className="fixed top-1/3 right-1/4 w-[350px] h-[350px] bg-analog-rose/10 blur-[120px] pointer-events-none -z-10 rounded-full" />

        {/* Top Navigation */}
        <Navbar />

        {/* Main Content Viewport */}
        <main className="min-h-[calc(100vh-80px)]">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/5 bg-surface-slate/80 backdrop-blur-md py-8 px-6 text-sm text-gray-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-electric flex items-center justify-center font-bold text-white text-xs">
                S
              </div>
              <span className="font-semibold text-gray-200">Sonora Academy</span>
              <span className="text-xs text-gray-500">© 2026 Interactive Sound Systems</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Tone.js Engine: Active
              </span>
              <span>Wavesurfer Audio Inspector v7.8</span>
              <span>5 Musical Tracks</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
