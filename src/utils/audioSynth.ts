import { AssistantVoiceName } from '../types';

/**
 * Sintetizador de audio procedural Web Audio API para efectos Sci-Fi estilo Atlas
 * y controlador de reconocimiento de voz y síntesis oral en español.
 */

class SciFiAudioEngine {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * Tono de activación Sci-Fi al detectar la palabra clave (Arpegio ascendente)
   */
  public playActivationChime() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Oscilador 1 (Tono agudo cristalino)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.25);

      // Oscilador 2 (Armónico resonante)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.08);
      osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.22);

      gain2.gain.setValueAtTime(0.15, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn('Audio Context not available:', e);
    }
  }

  /**
   * Tono de confirmación al ejecutar una acción
   */
  public playConfirmSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046, now); // C6
      osc.frequency.setValueAtTime(1567, now + 0.08); // G6

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.28);
    } catch (e) {
      console.warn('Audio Context not available:', e);
    }
  }

  /**
   * Pulso sutil de tecleo holográfico
   */
  public playBlip() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2200, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Tono de alarma o advertencia Sci-Fi
   */
  public playWarning() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.15);
      osc.frequency.linearRampToValueAtTime(440, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Tono de ejecución de comando o macro
   */
  public playExecution() {
    this.playConfirmSound();
  }

  /**
   * Tono de éxito / completado
   */
  public playSuccess() {
    this.playActivationChime();
  }

  /**
   * Sonido de barrido óptico / escaneo
   */
  public playScan() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(2400, now + 0.2);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      // Ignore
    }
  }
}

export const sciFiAudio = new SciFiAudioEngine();

/**
 * Síntesis de voz en español para el navegador (SpeechSynthesis) con soporte de ajustes personalizados
 */
export function speakSpanish(
  text: string, 
  voiceName: AssistantVoiceName = 'Atlas', 
  customSettingsOrOnEnd?: { pitch?: number; rate?: number; volume?: number; voiceURI?: string } | (() => void),
  onEndCallback?: () => void
) {
  let customSettings: { pitch?: number; rate?: number; volume?: number; voiceURI?: string } | undefined;
  let onEnd: (() => void) | undefined = onEndCallback;

  if (typeof customSettingsOrOnEnd === 'function') {
    onEnd = customSettingsOrOnEnd;
  } else if (customSettingsOrOnEnd) {
    customSettings = customSettingsOrOnEnd;
  }

  if (!('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  
  if (customSettings) {
    utterance.pitch = customSettings.pitch !== undefined ? customSettings.pitch : 0.98;
    utterance.rate = customSettings.rate !== undefined ? customSettings.rate : 1.06;
    utterance.volume = customSettings.volume !== undefined ? customSettings.volume : 1.0;
  } else {
    utterance.pitch = 0.98;
    utterance.rate = 1.06;
  }

  // Buscar voz por voiceURI o por idioma español
  const voices = window.speechSynthesis.getVoices();
  if (customSettings?.voiceURI) {
    const selected = voices.find(v => v.voiceURI === customSettings.voiceURI);
    if (selected) utterance.voice = selected;
  } else {
    const spanishVoice = voices.find(v => v.lang.startsWith('es') && (
      v.name.includes('Male') || v.name.includes('Jorge') || v.name.includes('Alvaro') || v.name.includes('Raul') || v.name.includes('Natural')
    )) || voices.find(v => v.lang.startsWith('es'));

    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

