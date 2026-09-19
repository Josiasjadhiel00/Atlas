import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { sciFiAudio } from '../../utils/audioSynth';

export const PWAInstallButton: React.FC<{ variant?: 'header' | 'badge' | 'full' }> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = () => {
    sciFiAudio.playConfirmSound();
    install();
  };

  if (isInstallable) {
    if (variant === 'badge') {
      return (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00f2ff20] hover:bg-[#00f2ff35] text-[#00f2ff] border border-[#00f2ff55] text-xs font-mono transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
          title="Instalar ATLAS Core en este dispositivo"
        >
          <Download className="w-3.5 h-3.5 animate-bounce" />
          <span className="font-semibold">Instalar App</span>
        </button>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00f2ff20] to-[#0099ff20] hover:from-[#00f2ff35] hover:to-[#0099ff35] border border-[#00f2ff66] px-3 py-1.5 text-xs font-mono text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.15)] transition-all cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="font-semibold">Instalar PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => {
            sciFiAudio.playBlip();
            setShowIOSGuide(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 text-sky-300 text-xs font-mono transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-[#050b1d] border border-sky-400/50 p-5 shadow-[0_0_30px_rgba(56,189,248,0.25)]">
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Instalar ATLAS en iPhone / iPad
              </h3>
              <p className="mt-2.5 text-xs text-slate-300 font-sans leading-relaxed">
                1. Toca el botón <strong>Compartir</strong> en la barra de Safari.<br />
                2. Desplaza hacia abajo y selecciona <strong>Añadir a la pantalla de inicio</strong>.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-white/10 hover:bg-white/15 py-2 text-xs font-mono text-white transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
