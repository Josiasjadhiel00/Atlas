import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Music, Radio, Disc3 } from 'lucide-react';
import { sciFiAudio } from '../utils/audioSynth';

interface Track {
  id: string;
  title: string;
  artist: string;
  type: 'synth' | 'drone' | 'ambient';
  tempo: number;
}

const TRACK_LIST: Track[] = [
  { id: '1', title: 'CYBERPUNK NEURAL FLOW', artist: 'Stark Lab Synth 120BPM', type: 'synth', tempo: 120 },
  { id: '2', title: 'DEEP SPACE ALPHA DRONE', artist: 'Binaural Focus 432Hz', type: 'drone', tempo: 80 },
  { id: '3', title: 'ARC REACTOR AMBIENT HUM', artist: 'Mark VII Core Resonance', type: 'ambient', tempo: 60 },
  { id: '4', title: 'LO-FI TERMINAL CHILL', artist: 'AI Autonomous Chillhop', type: 'synth', tempo: 90 }
];

export const FocusMusicPlayer: React.FC<{
  onVolumeChange?: (vol: number) => void;
}> = ({ onVolumeChange }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(16).fill(4));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const currentTrack = TRACK_LIST[trackIndex];

  // Generative Web Audio Synthesizer Loop
  const startSynthTrack = (track: Track) => {
    stopSynthTrack();

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isMuted ? 0 : volume * 0.15, ctx.currentTime);
      gain.connect(ctx.destination);
      gainNodeRef.current = gain;

      // Base carrier tone
      const osc = ctx.createOscillator();
      osc.type = track.type === 'synth' ? 'sawtooth' : track.type === 'drone' ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(track.type === 'synth' ? 110 : track.type === 'drone' ? 65 : 82.4, ctx.currentTime);

      // Lowpass filter for smooth sci-fi warm sound
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(track.type === 'synth' ? 800 : 350, ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      osc.start();
      oscillatorRef.current = osc;

      // Note sequencer for Synth
      if (track.type === 'synth') {
        const notes = [110, 130.81, 146.83, 164.81, 196.0, 220.0];
        let step = 0;
        intervalRef.current = window.setInterval(() => {
          if (!oscillatorRef.current || !audioCtxRef.current) return;
          const nextFreq = notes[step % notes.length];
          oscillatorRef.current.frequency.setTargetAtTime(nextFreq, ctx.currentTime, 0.08);
          step++;
        }, (60 / track.tempo) * 500);
      }
    } catch (e) {
      console.warn('Web Audio Synth initialization error:', e);
    }
  };

  const stopSynthTrack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch {}
      oscillatorRef.current = null;
    }
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  };

  const togglePlay = () => {
    sciFiAudio.playBlip();
    if (isPlaying) {
      stopSynthTrack();
      setIsPlaying(false);
    } else {
      startSynthTrack(currentTrack);
      setIsPlaying(true);
    }
  };

  const nextTrack = () => {
    sciFiAudio.playBlip();
    const nextIdx = (trackIndex + 1) % TRACK_LIST.length;
    setTrackIndex(nextIdx);
    if (isPlaying) {
      startSynthTrack(TRACK_LIST[nextIdx]);
    }
  };

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      const targetGain = isMuted ? 0 : volume * 0.15;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.05);
    }
    if (onVolumeChange) onVolumeChange(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynthTrack();
    };
  }, []);

  // Visualizer Animation
  useEffect(() => {
    if (!isPlaying) {
      setWaveHeights(Array(16).fill(3));
      return;
    }
    const id = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * (isMuted ? 2 : 20)) + 3)
      );
    }, 80);
    return () => clearInterval(id);
  }, [isPlaying, isMuted]);

  return (
    <div className="border border-[#00f2ff44] bg-black/80 rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden">
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00f2ff]">
          <Music className="w-3.5 h-3.5 text-cyan-400" />
          <span>REPRODUCTOR // AUDIO FOCUS</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-[8px] font-mono text-gray-400">{isPlaying ? 'TRANSMITIENDO' : 'PAUSA'}</span>
        </div>
      </div>

      {/* Track Info & Visualizer */}
      <div className="bg-black/60 border border-[#00f2ff22] p-2 rounded-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <Disc3 className={`w-5 h-5 text-[#00f2ff] flex-shrink-0 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
            <div className="truncate font-mono">
              <div className="text-[10px] text-white font-bold truncate">{currentTrack.title}</div>
              <div className="text-[8px] text-gray-400 truncate">{currentTrack.artist}</div>
            </div>
          </div>

          <div className="text-[8px] font-mono text-cyan-400 font-bold px-1.5 py-0.5 bg-[#00f2ff11] border border-[#00f2ff33] rounded-xs flex-shrink-0">
            {trackIndex + 1}/{TRACK_LIST.length}
          </div>
        </div>

        {/* Dynamic Frequency Equalizer */}
        <div className="h-6 flex items-end justify-between gap-1 px-1 bg-black/80 border border-[#00f2ff15] rounded-xs">
          {waveHeights.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-xs transition-all duration-75 ${
                isPlaying ? 'bg-gradient-to-t from-[#00f2ff] to-cyan-300 shadow-[0_0_4px_#00f2ff]' : 'bg-[#00f2ff22]'
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex items-center justify-between gap-2 font-mono text-[9px]">
        {/* Play/Pause & Next */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={togglePlay}
            className={`p-2 rounded-xs border transition-all cursor-pointer flex items-center justify-center ${
              isPlaying
                ? 'bg-[#00f2ff] text-black border-[#00f2ff] shadow-[0_0_8px_#00f2ff]'
                : 'bg-[#00f2ff15] text-[#00f2ff] border-[#00f2ff44] hover:bg-[#00f2ff33]'
            }`}
            title={isPlaying ? 'Pausar música' : 'Reproducir música'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 bg-black/80 border border-[#00f2ff33] text-gray-300 hover:text-white rounded-xs cursor-pointer hover:border-[#00f2ff]"
            title="Siguiente pista"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Volume Slider & Mute Toggle */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-[#00f2ff] cursor-pointer"
          >
            {isMuted || volume === 0 ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-[#00f2ff]" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1 bg-black accent-[#00f2ff] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
