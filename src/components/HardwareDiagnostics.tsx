import React, { useState } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Play, RefreshCw, 
  Mic, Volume2, Cpu, Terminal, ShieldAlert, Sparkles 
} from 'lucide-react';
import { sciFiAudio, speakSpanish } from '../utils/audioSynth';

export const HardwareDiagnostics: React.FC = () => {
  const [testResults, setTestResults] = useState<{ [key: string]: 'passed' | 'failed' | 'pending' | 'idle' }>({
    mic: 'idle',
    synth: 'idle',
    api: 'idle',
    tts: 'idle'
  });

  const runMicTest = async () => {
    setTestResults(prev => ({ ...prev, mic: 'pending' }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      sciFiAudio.playConfirmSound();
      setTestResults(prev => ({ ...prev, mic: 'passed' }));
    } catch (e) {
      console.warn(e);
      setTestResults(prev => ({ ...prev, mic: 'failed' }));
    }
  };

  const runSynthTest = () => {
    setTestResults(prev => ({ ...prev, synth: 'pending' }));
    try {
      sciFiAudio.playActivationChime();
      setTimeout(() => {
        sciFiAudio.playConfirmSound();
        setTestResults(prev => ({ ...prev, synth: 'passed' }));
      }, 500);
    } catch (e) {
      setTestResults(prev => ({ ...prev, synth: 'failed' }));
    }
  };

  const runApiTest = async () => {
    setTestResults(prev => ({ ...prev, api: 'pending' }));
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (data.status === 'online') {
        sciFiAudio.playConfirmSound();
        setTestResults(prev => ({ ...prev, api: 'passed' }));
      } else {
        setTestResults(prev => ({ ...prev, api: 'failed' }));
      }
    } catch (e) {
      setTestResults(prev => ({ ...prev, api: 'failed' }));
    }
  };

  const runTtsTest = () => {
    setTestResults(prev => ({ ...prev, tts: 'pending' }));
    speakSpanish('Protocolo de diagnóstico completado. Motor de síntesis de voz en español operativo.', 'Atlas', () => {
      setTestResults(prev => ({ ...prev, tts: 'passed' }));
    });
  };

  return (
    <div className="bg-[#00f2ff08] border border-[#00f2ff44] rounded-sm p-6 space-y-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#00f2ff33] pb-4">
        <div>
          <div className="text-[10px] opacity-60 uppercase tracking-[0.2em] text-[#00f2ff] mb-1">
            HARDWARE / SOFTWARE INTERFACE VALIDATION
          </div>
          <h2 className="text-base font-mono font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#00f2ff]" />
            DIAGNÓSTICO INTERACTIVO DE HARDWARE Y SOFTWARE
          </h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">
            Valida los componentes de audio, síntesis de voz y conectividad antes de desplegar en local.
          </p>
        </div>

        <button
          onClick={() => {
            runMicTest();
            runSynthTest();
            runApiTest();
            runTtsTest();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-sm bg-[#00f2ff] text-black hover:bg-[#00d4e0] font-mono text-xs font-bold transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          EJECUTAR TEST COMPLETO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Micrófono */}
        <div className="bg-black/60 border border-[#00f2ff33] rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff44]">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">1. Entrada de Micrófono</div>
              <div className="text-[11px] text-gray-400 font-mono">Acceso a captura de audio local</div>
            </div>
          </div>
          <button
            onClick={runMicTest}
            className="px-3 py-1.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff44] hover:bg-[#00f2ff25] text-xs font-mono text-[#00f2ff] cursor-pointer"
          >
            {testResults.mic === 'passed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Correcto</span>}
            {testResults.mic === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Denegado</span>}
            {testResults.mic === 'pending' && <span className="text-amber-400 animate-pulse">Probando...</span>}
            {testResults.mic === 'idle' && 'PROBAR'}
          </button>
        </div>

        {/* Sonidos Sci-Fi */}
        <div className="bg-black/60 border border-[#00f2ff33] rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff44]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">2. Efectos de Sonido Sci-Fi</div>
              <div className="text-[11px] text-gray-400 font-mono">Generador Web Audio API</div>
            </div>
          </div>
          <button
            onClick={runSynthTest}
            className="px-3 py-1.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff44] hover:bg-[#00f2ff25] text-xs font-mono text-[#00f2ff] cursor-pointer"
          >
            {testResults.synth === 'passed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Correcto</span>}
            {testResults.synth === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Error</span>}
            {testResults.synth === 'pending' && <span className="text-amber-400 animate-pulse">Generando...</span>}
            {testResults.synth === 'idle' && 'PROBAR'}
          </button>
        </div>

        {/* Motor TTS Oral */}
        <div className="bg-black/60 border border-[#00f2ff33] rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff44]">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">3. Síntesis de Voz (TTS)</div>
              <div className="text-[11px] text-gray-400 font-mono">Sintetizador en español</div>
            </div>
          </div>
          <button
            onClick={runTtsTest}
            className="px-3 py-1.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff44] hover:bg-[#00f2ff25] text-xs font-mono text-[#00f2ff] cursor-pointer"
          >
            {testResults.tts === 'passed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Correcto</span>}
            {testResults.tts === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Fallo</span>}
            {testResults.tts === 'pending' && <span className="text-amber-400 animate-pulse">Hablando...</span>}
            {testResults.tts === 'idle' && 'PROBAR'}
          </button>
        </div>

        {/* Backend Endpoint Health */}
        <div className="bg-black/60 border border-[#00f2ff33] rounded-sm p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-sm bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff44]">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold text-white">4. Núcleo Neural Express / API</div>
              <div className="text-[11px] text-gray-400 font-mono">Enlace con /api/health</div>
            </div>
          </div>
          <button
            onClick={runApiTest}
            className="px-3 py-1.5 rounded-sm bg-[#00f2ff15] border border-[#00f2ff44] hover:bg-[#00f2ff25] text-xs font-mono text-[#00f2ff] cursor-pointer"
          >
            {testResults.api === 'passed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> En Línea</span>}
            {testResults.api === 'failed' && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> Fuera de línea</span>}
            {testResults.api === 'pending' && <span className="text-amber-400 animate-pulse">Consultando...</span>}
            {testResults.api === 'idle' && 'PROBAR'}
          </button>
        </div>

      </div>

    </div>
  );
};
