import React, { useState, useEffect, useRef } from 'react';
import { Timer, Bell, Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { AssistantVoiceName } from '../types';
import { sciFiAudio, speakSpanish } from '../utils/audioSynth';

interface MissionTimerAlarmProps {
  assistantName?: AssistantVoiceName;
}

export const MissionTimerAlarm: React.FC<MissionTimerAlarmProps> = ({
  assistantName = 'Atlas'
}) => {
  const [mode, setMode] = useState<'CLOCK' | 'TIMER'>('TIMER');
  const [currentTime, setCurrentTime] = useState<string>('00:00:00');
  const [totalSeconds, setTotalSeconds] = useState<number>(25 * 60); // Default 25m Pomodoro
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isAlarmRinging, setIsAlarmRinging] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Real Current Clock updater
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer Tick
  useEffect(() => {
    if (isRunning && remainingSeconds > 0) {
      timerRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            triggerAlarm();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      triggerAlarm();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, remainingSeconds]);

  const triggerAlarm = () => {
    setIsRunning(false);
    setIsAlarmRinging(true);
    sciFiAudio.playWarning();
    speakSpanish('Señor, el temporizador de misión ha concluido. Fase completada.', assistantName);
  };

  const stopAlarm = () => {
    setIsAlarmRinging(false);
    sciFiAudio.playBlip();
  };

  const startTimer = () => {
    sciFiAudio.playBlip();
    setIsAlarmRinging(false);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    sciFiAudio.playBlip();
    setIsRunning(false);
  };

  const resetTimer = (newMinutes?: number) => {
    sciFiAudio.playBlip();
    setIsRunning(false);
    setIsAlarmRinging(false);
    const secs = (newMinutes !== undefined ? newMinutes : totalSeconds / 60) * 60;
    setTotalSeconds(secs);
    setRemainingSeconds(secs);
  };

  // Format seconds to mm:ss or hh:mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`border rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden transition-colors ${
      isAlarmRinging
        ? 'bg-red-950/80 border-red-500 shadow-[0_0_20px_#ef4444] animate-pulse'
        : 'bg-black/80 border-[#00f2ff44]'
    }`}>
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-red-500/80" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-500/80" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-500/30 pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-red-400">
          <Timer className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>TEMPORIZADOR DE MISIÓN & RELOJ</span>
        </div>

        <div className="flex bg-black/80 border border-red-500/30 p-0.5 rounded-xs font-mono text-[8px]">
          <button
            onClick={() => setMode('TIMER')}
            className={`px-1.5 py-0.5 rounded-xs transition-all cursor-pointer ${
              mode === 'TIMER' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            TIMER
          </button>
          <button
            onClick={() => setMode('CLOCK')}
            className={`px-1.5 py-0.5 rounded-xs transition-all cursor-pointer ${
              mode === 'CLOCK' ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            RELOJ
          </button>
        </div>
      </div>

      {/* Big Digital Display */}
      <div className="flex items-center justify-center py-1">
        <div className="bg-black/90 border border-red-500/40 px-4 py-1.5 rounded-xs shadow-[inset_0_0_10px_rgba(239,68,68,0.2)]">
          <span
            className={`font-mono text-2xl sm:text-3xl font-black tracking-widest ${
              isAlarmRinging ? 'text-white drop-shadow-[0_0_15px_#ff0000]' : 'text-red-500 drop-shadow-[0_0_8px_#ef4444]'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {mode === 'TIMER' ? formatTimer(remainingSeconds) : currentTime}
          </span>
        </div>
      </div>

      {/* Timer Controls & Presets */}
      {mode === 'TIMER' && (
        <div className="space-y-1.5">
          {/* Quick Presets */}
          <div className="flex items-center justify-between gap-1 font-mono text-[8px]">
            {[
              { label: '5M', mins: 5 },
              { label: '15M', mins: 15 },
              { label: '25M (FOCUS)', mins: 25 },
              { label: '45M', mins: 45 }
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => resetTimer(preset.mins)}
                className={`flex-1 py-1 border rounded-xs transition-all cursor-pointer ${
                  totalSeconds === preset.mins * 60
                    ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                    : 'bg-black/60 border-red-500/20 text-gray-400 hover:text-white hover:border-red-500/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 font-mono text-[9px]">
            {!isAlarmRinging ? (
              <>
                {!isRunning ? (
                  <button
                    onClick={startTimer}
                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>INICIAR</span>
                  </button>
                ) : (
                  <button
                    onClick={pauseTimer}
                    className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_8px_rgba(217,119,6,0.4)]"
                  >
                    <Pause className="w-3 h-3" />
                    <span>PAUSAR</span>
                  </button>
                )}

                <button
                  onClick={() => resetTimer()}
                  className="p-1.5 bg-black/80 border border-red-500/30 text-gray-300 hover:text-white rounded-xs cursor-pointer hover:border-red-500"
                  title="Reiniciar temporizador"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                onClick={stopAlarm}
                className="w-full py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_#ff0000] animate-bounce"
              >
                <Bell className="w-3.5 h-3.5 animate-spin" />
                <span>APAGAR ALARMA DE MISIÓN</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
