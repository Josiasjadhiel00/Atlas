import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, QrCode, X, Copy, Check, Download, ShieldCheck, 
  ExternalLink, Sparkles, CheckCircle2, ArrowRight, Radio
} from 'lucide-react';
import { sciFiAudio } from '../../utils/audioSynth';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PairMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PairMobileModal: React.FC<PairMobileModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'instructions'>('qr');
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  // Compute pairing URL
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const pairingUrl = `${currentOrigin}/?client=mobile&token=atlas_${Math.random().toString(36).substring(2, 8)}`;

  useEffect(() => {
    if (!isOpen) return;

    // Generate real QR code as Data URL
    QRCode.toDataURL(pairingUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#00f2fe',
        light: '#030816'
      },
      errorCorrectionLevel: 'H'
    })
    .then(url => setQrDataUrl(url))
    .catch(err => console.error('[QRCode] Error:', err));
  }, [isOpen, pairingUrl]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    sciFiAudio.playBlip();
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#050b1d] border-2 border-[#00f2ff66] rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(0,242,255,0.25)] relative overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff55] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                Vincular Teléfono Móvil
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00f2ff22] text-[#00f2ff] font-sans">PWA</span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                PROTOCOLO // ATLAS MOBILE CLIENT COMPANION
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sciFiAudio.playBlip();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 my-4 text-xs font-mono">
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              setActiveTab('qr');
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'border-[#00f2ff] text-[#00f2ff] font-bold bg-[#00f2ff0d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Escanear Código QR
          </button>
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              setActiveTab('instructions');
            }}
            className={`flex-1 py-2 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'instructions'
                ? 'border-[#00f2ff] text-[#00f2ff] font-bold bg-[#00f2ff0d]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Guía de Instalación PWA
          </button>
        </div>

        {/* Tab 1: QR Code & Link */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#02050e] border border-[#00f2ff33] relative">
              {/* Corner Sci-Fi accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00f2ff]" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00f2ff]" />

              {qrDataUrl ? (
                <div className="p-2 bg-[#030816] rounded-lg border border-[#00f2ff44] shadow-[0_0_20px_rgba(0,242,255,0.15)]">
                  <img 
                    src={qrDataUrl} 
                    alt="ATLAS Pairing QR Code" 
                    className="w-52 h-52 sm:w-56 sm:h-56 block rounded"
                  />
                </div>
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-slate-500 font-mono text-xs">
                  Generando cifrado QR...
                </div>
              )}

              <div className="mt-3 text-center">
                <p className="text-xs text-cyan-300 font-mono font-semibold flex items-center justify-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Apunta con la cámara de tu teléfono móvil
                </p>
                <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                  Acceso directo con el mismo núcleo ATLAS y sincronización en tiempo real.
                </p>
              </div>
            </div>

            {/* Direct URL copy field */}
            <div className="flex items-center gap-2 bg-[#02050e] border border-white/10 rounded-xl p-2">
              <input
                type="text"
                readOnly
                value={pairingUrl}
                className="bg-transparent text-xs text-slate-300 font-mono flex-1 outline-none px-2 truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00f2ff20] hover:bg-[#00f2ff35] text-[#00f2ff] text-xs font-mono font-semibold border border-[#00f2ff44] transition-all cursor-pointer shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Enlace</span>
                  </>
                )}
              </button>
            </div>

            {/* In-app install button if open on a compatible device */}
            {isInstallable && !isInstalled && (
              <button
                onClick={() => {
                  sciFiAudio.playConfirmSound();
                  install();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#0099ff] hover:from-[#33f5ff] hover:to-[#1aa3ff] text-black font-mono font-bold text-xs shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                INSTALAR COMO APLICACIÓN PWA EN ESTE DISPOSITIVO
              </button>
            )}
          </div>
        )}

        {/* Tab 2: PWA Steps & Specs */}
        {activeTab === 'instructions' && (
          <div className="space-y-3 font-sans text-xs">
            <div className="p-3 rounded-xl bg-[#02050e] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">A</span>
                Para dispositivos Android (Chrome / Brave / Edge)
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
                <li>Escanea el código QR o abre el enlace en Google Chrome.</li>
                <li>Toca el aviso emergente <span className="text-white font-semibold">"Instalar ATLAS Core"</span> o pulsa el menú de 3 puntos (⋮).</li>
                <li>Selecciona <span className="text-white font-semibold">"Instalar aplicación"</span> o "Añadir a la pantalla principal".</li>
                <li>Se abrirá en modo nativo a pantalla completa con acceso permanente al micrófono.</li>
              </ol>
            </div>

            <div className="p-3 rounded-xl bg-[#02050e] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-mono font-bold">
                <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px]">B</span>
                Para dispositivos iOS (iPhone / iPad en Safari)
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 pl-1 leading-relaxed">
                <li>Apunta con la app de Cámara de tu iPhone al código QR y abre en Safari.</li>
                <li>Toca el botón <span className="text-white font-semibold">Compartir</span> (el icono del recuadro con la flecha hacia arriba).</li>
                <li>Desplaza la lista y toca <span className="text-white font-semibold">"Añadir a la pantalla de inicio"</span>.</li>
                <li>Pulsa "Añadir" arriba a la derecha. ¡Listo! Icono táctico en tu pantalla de inicio.</li>
              </ol>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center gap-2 text-emerald-300 text-[11px] font-mono">
              <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Manifiesto PWA certificado: pantalla completa, aceleración gráfica y caché offline.</span>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Nodo Móvil: Disponible</span>
          </div>

          <button
            onClick={() => {
              sciFiAudio.playBlip();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
