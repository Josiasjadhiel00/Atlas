import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Radio } from 'lucide-react';
import { AssistantState } from '../types';

interface AtlasAudioDockProps {
  state: AssistantState;
  isListening: boolean;
  voiceVolume: number;
  onToggleMic: () => void;
  onOpenSettings: () => void;
  volumeLevel: number;
  onChangeVolume: (vol: number) => void;
}

export const AtlasAudioDock: React.FC<AtlasAudioDockProps> = ({
  state,
  isListening,
  voiceVolume,
  onToggleMic,
  onOpenSettings,
  volumeLevel,
  onChangeVolume
}) => {
  const [leftFrequencies, setLeftFrequencies] = useState<number[]>([15, 25, 45, 60, 30, 75, 40, 55, 30, 20]);
  const [rightFrequencies, setRightFrequencies] = useState<number[]>([20, 35, 60, 45, 80, 50, 65, 30, 40, 15]);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    let animationTimer: any;

    const updateWaves = () => {
      const active = isListening || state === 'speaking' || state === 'thinking';
      const baseAmp = active ? 35 : 8;
      const volBoost = voiceVolume * 50;

      setLeftFrequencies(
        Array.from({ length: 14 }, (_, i) => {
          const factor = Math.sin(Date.now() / 150 + i * 0.5);
          return Math.max(6, Math.min(85, (baseAmp + volBoost) * (0.4 + 0.6 * Math.abs(factor))));
        })
      );

      setRightFrequencies(
        Array.from({ length: 14 }, (_, i) => {
          const factor = Math.cos(Date.now() / 160 + i * 0.5);
          return Math.max(6, Math.min(85, (baseAmp + volBoost) * (0.4 + 0.6 * Math.abs(factor))));
        })
      );

      animationTimer = setTimeout(updateWaves, 70);
    };

    updateWaves();
    return () => clearTimeout(animationTimer);
  }, [isListening, state, voiceVolume]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-2 select-none">
      
      {/* Floating Status Pill Badge */}
      <div className={`px-4 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider flex items-center gap-2 border transition-all shadow-[0_0_20px_rgba(0,242,255,0.2)] ${
        isListening
          ? 'bg-[#00f2ff15] border-[#00f2ff] text-[#00f2ff] animate-pulse'
          : state === 'speaking'
          ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300'
          : state === 'thinking' || state === 'searching'
          ? 'bg-purple-500/15 border-purple-400 text-purple-300'
          : 'bg-black/70 border-[#00f2ff33] text-gray-400'
      }`}>
        <Radio className={`w-3 h-3 ${isListening || state === 'speaking' ? 'animate-spin text-[#00f2ff]' : 'text-gray-400'}`} />
        <span>
          {isListening
            ? 'ATLAS está escuchando...'
            : state === 'speaking'
            ? 'ATLAS respondiendo...'
            : state === 'thinking'
            ? 'ATLAS procesando orden...'
            : state === 'searching'
            ? 'ATLAS consultando internet...'
            : 'ATLAS en espera • Toca el micrófono para hablar'}
        </span>
      </div>

      {/* Main High-Tech Audio Dock Container */}
      <div className="w-full bg-[#030816]/90 backdrop-blur-xl border border-[#00f2ff44] rounded-2xl p-3 px-6 shadow-[0_0_35px_rgba(0,242,255,0.15)] flex flex-col items-center relative overflow-hidden">
        
        {/* Subtle Ambient Light Strip */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent opacity-80" />

        {/* Waveform & Center Mic Button Row */}
        <div className="w-full flex items-center justify-between gap-4 py-1">
          
          {/* Left Equalizer Spectrum (Cyan/Blue) */}
          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-1.5 h-12 overflow-hidden px-2">
            {leftFrequencies.map((height, i) => (
              <div
                key={`left-${i}`}
                style={{ height: `${height}%` }}
                className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#00f2ff] to-[#3b82f6] transition-all duration-75 shadow-[0_0_8px_rgba(0,242,255,0.4)]"
              />
            ))}
          </div>

          {/* Center Glowing Mic Button */}
          <div className="relative flex items-center justify-center">
            {/* Outer pulsating energy aura */}
            <div
              className={`absolute -inset-2 rounded-full blur-md transition-all ${
                isListening
                  ? 'bg-[#00f2ff] opacity-80 animate-ping'
                  : 'bg-[#00f2ff33] opacity-40 hover:opacity-75'
              }`}
            />

            <button
              onClick={onToggleMic}
              title={isListening ? 'Detener escucha' : 'Hablar con ATLAS'}
              className={`relative z-10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer shadow-[0_0_30px_rgba(0,242,255,0.4)] ${
                isListening
                  ? 'bg-gradient-to-tr from-[#00f2ff] to-[#60a5fa] border-white text-black scale-105'
                  : 'bg-gradient-to-tr from-[#030816] via-[#091e3a] to-[#030816] border-[#00f2ff] text-[#00f2ff] hover:scale-105 hover:border-white'
              }`}
            >
              {isListening ? (
                <MicOff className="w-6 h-6 sm:w-7 sm:h-7 animate-pulse text-black" />
              ) : (
                <Mic className="w-6 h-6 sm:w-7 sm:h-7 text-[#00f2ff]" />
              )}
            </button>
          </div>

          {/* Right Equalizer Spectrum (Purple/Magenta) */}
          <div className="flex-1 flex items-center justify-start gap-1 sm:gap-1.5 h-12 overflow-hidden px-2">
            {rightFrequencies.map((height, i) => (
              <div
                key={`right-${i}`}
                style={{ height: `${height}%` }}
                className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#a855f7] to-[#ec4899] transition-all duration-75 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
              />
            ))}
          </div>

        </div>

        {/* Lower Control Sub-bar */}
        <div className="w-full pt-2 mt-1 border-t border-[#00f2ff15] flex items-center justify-between text-xs text-gray-400 font-mono px-2">
          
          {/* Mute toggle button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:text-[#00f2ff] hover:bg-[#00f2ff15] rounded-full transition-all cursor-pointer"
            title={isMuted ? 'Desmutear audio' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:text-[#00f2ff] hover:bg-[#00f2ff15] rounded-full transition-all cursor-pointer"
            title="Ajustes de voz y sistema"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Audio Volume Slider */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-[#00f2ff]" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumeLevel}
              onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
              className="w-20 sm:w-28 accent-[#00f2ff] cursor-pointer h-1.5 bg-black/80 rounded-lg"
              title="Volumen del sintetizador"
            />
          </div>

        </div>

      </div>

    </div>
  );
};
