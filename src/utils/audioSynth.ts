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
 *
 * NOTA IMPORTANTE: esto usa las voces del sistema operativo (Web Speech
 * API), no una IA de voz real — por eso nunca va a sonar tan fluido como
 * ElevenLabs u OpenAI TTS. Lo que SÍ se puede arreglar sin gastar nada es
 * elegir bien, de entre las voces que ya trae Windows/el navegador, la
 * mejor disponible: Windows 11 + Edge traen voces "Online (Natural)" que
 * suenan bastante mejor que las voces SAPI5 clásicas, pero antes esta
 * función ni siquiera esperaba a que la lista de voces terminara de cargar.
 */

// Chrome/Edge cargan la lista de voces de forma ASÍNCRONA. Si se pregunta
// demasiado pronto (por ejemplo, justo al abrir la app), getVoices() todavía
// devuelve un array vacío y Atlas termina usando la voz por defecto del
// sistema — normalmente la peor de todas. Este cache + promesa resuelve eso.
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (!('speechSynthesis' in window)) return Promise.resolve([]);
  if (voicesReadyPromise) return voicesReadyPromise;

  voicesReadyPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices();
    if (existing.length > 0) {
      cachedVoices = existing;
      resolve(existing);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    };

    window.speechSynthesis.onvoiceschanged = finish;
    // Respaldo por si 'voiceschanged' nunca llega (pasa en algunos
    // navegadores/versiones): no dejamos la promesa colgada para siempre.
    setTimeout(finish, 1200);
  });

  return voicesReadyPromise;
}

// Llama a esto una vez, temprano (por ejemplo al montar la app), para que
// cuando el usuario realmente pida algo las voces ya estén cargadas y la
// primera respuesta hablada no caiga en la voz por defecto.
export function warmUpSpeechVoices() {
  loadVoices();
}

// Orden de preferencia: primero voces "Online (Natural)"/"Neural" en
// español (las de mejor calidad que trae Windows 11 + Edge), luego voces
// masculinas conocidas por nombre, luego cualquier voz en español, y solo
// si no hay ninguna, null (el navegador usará su propio default).
function pickBestSpanishVoice(voices: SpeechSynthesisVoice[], voiceURI?: string): SpeechSynthesisVoice | undefined {
  if (voiceURI) {
    const exact = voices.find(v => v.voiceURI === voiceURI);
    if (exact) return exact;
  }

  const esVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
  if (esVoices.length === 0) return undefined;

  const byNameIncludes = (needle: string) => esVoices.find(v => v.name.toLowerCase().includes(needle));

  return (
    // Voces neuronales "Online (Natural)" de Windows 11 / Edge — las mejores disponibles gratis
    esVoices.find(v => /natural/i.test(v.name)) ||
    esVoices.find(v => /neural/i.test(v.name)) ||
    esVoices.find(v => /online/i.test(v.name)) ||
    // Voces de Google (Chrome), buena calidad, generadas en la nube
    esVoices.find(v => v.name.toLowerCase().includes('google')) ||
    // Nombres masculinos conocidos en las voces clásicas de Windows/macOS
    byNameIncludes('jorge') ||
    byNameIncludes('álvaro') ||
    byNameIncludes('alvaro') ||
    byNameIncludes('raúl') ||
    byNameIncludes('raul') ||
    byNameIncludes('diego') ||
    esVoices.find(v => v.lang === 'es-ES') ||
    esVoices[0]
  );
}

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

  const buildAndSpeak = (voices: SpeechSynthesisVoice[]) => {
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

    const bestVoice = pickBestSpanishVoice(voices, customSettings?.voiceURI);
    if (bestVoice) {
      utterance.voice = bestVoice;
      // Si la voz elegida es "es-MX" o similar, usa su propio lang en vez
      // de forzar es-ES — evita que el motor la trate como mal encajada.
      utterance.lang = bestVoice.lang;
    }

    // BUG CONOCIDO de Chrome/Edge en Windows: speechSynthesis se "pausa"
    // sola en frases largas (a partir de ~15s) y el audio se corta a la
    // mitad. Este keep-alive lo evita llamando resume() cada pocos
    // segundos mientras la utterance sigue activa.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    const cleanup = () => {
      clearInterval(keepAlive);
      if (onEnd) onEnd();
    };
    utterance.onend = cleanup;
    utterance.onerror = cleanup;

    window.speechSynthesis.speak(utterance);
  };

  if (cachedVoices.length > 0) {
    buildAndSpeak(cachedVoices);
  } else {
    loadVoices().then(buildAndSpeak);
  }
}

