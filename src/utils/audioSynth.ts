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

// =========================================================================
// VOZ DE ATLAS
//
// Voz principal: edge-tts (voces neuronales de Microsoft Edge), generadas por
// el servidor en POST /api/tts. Suena igual de natural en cualquier
// dispositivo, porque no depende de las voces que tenga instaladas el
// sistema operativo (antes se usaba solo el Web Speech API del navegador,
// que en Windows suele caer en voces SAPI5 robóticas).
//
// Respaldo: si el servidor o el servicio de Microsoft no responden (sin
// internet, sesión vencida, etc.), se usa el Web Speech API del navegador
// como antes, para que Atlas nunca se quede mudo.
// =========================================================================

export interface EdgeVoiceOption {
  id: string;
  label: string;
}

// Selección curada de voces en español. No es la lista completa de Microsoft
// (hay cientos); son las más útiles. Si alguna no existiera en el servicio,
// el servidor responde error y se usa la voz del navegador como respaldo.
export const EDGE_SPANISH_VOICES: EdgeVoiceOption[] = [
  { id: 'es-MX-JorgeNeural', label: 'Jorge — México (masculina)' },
  { id: 'es-ES-AlvaroNeural', label: 'Álvaro — España (masculina)' },
  { id: 'es-US-AlonsoNeural', label: 'Alonso — EE.UU. (masculina)' },
  { id: 'es-CO-GonzaloNeural', label: 'Gonzalo — Colombia (masculina)' },
  { id: 'es-DO-EmilioNeural', label: 'Emilio — Rep. Dominicana (masculina)' },
  { id: 'es-MX-DaliaNeural', label: 'Dalia — México (femenina)' },
  { id: 'es-ES-ElviraNeural', label: 'Elvira — España (femenina)' },
  { id: 'es-US-PalomaNeural', label: 'Paloma — EE.UU. (femenina)' },
  { id: 'es-CO-SalomeNeural', label: 'Salomé — Colombia (femenina)' },
  { id: 'es-DO-RamonaNeural', label: 'Ramona — Rep. Dominicana (femenina)' }
];

export const DEFAULT_EDGE_VOICE = 'es-MX-JorgeNeural';

const EDGE_VOICE_PATTERN = /^[a-z]{2,3}-[A-Z]{2}-[A-Za-z0-9]+Neural$/;
export function isEdgeVoiceId(value?: string): boolean {
  return !!value && EDGE_VOICE_PATTERN.test(value);
}

type SpeakSettings = { pitch?: number; rate?: number; volume?: number; voiceURI?: string };

// ---------- Estado de reproducción (una sola voz a la vez) ----------
let sharedAudio: HTMLAudioElement | null = null;
let speakToken = 0;                       // invalida peticiones/reproducciones viejas
let abortController: AbortController | null = null;
let currentObjectUrl: string | null = null;
let currentFinish: (() => void) | null = null; // cierra la frase en curso (llama su onEnd una sola vez)
let browserSpeaking = false;
let settlePlayback: (() => void) | null = null; // libera el await de playBlob si se interrumpe

function getAudio(): HTMLAudioElement {
  if (!sharedAudio) {
    sharedAudio = new Audio();
    sharedAudio.preload = 'auto';
  }
  return sharedAudio;
}

function releaseObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

// Los navegadores móviles (sobre todo iOS/Safari) solo dejan reproducir audio
// si el elemento <audio> ya fue "desbloqueado" por un toque del usuario. Como
// aquí el audio llega tarde (después de pedirlo al servidor), desbloqueamos el
// elemento compartido en el primer toque/tecla y luego solo le cambiamos el src.
function makeSilentWavUrl(): string {
  // 0.1 s de silencio, 8 kHz, 8 bits, mono.
  const samples = 800;
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const writeStr = (off: number, str: string) => { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); };
  writeStr(0, 'RIFF'); view.setUint32(4, 36 + samples, true); writeStr(8, 'WAVE');
  writeStr(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true); view.setUint32(28, 8000, true); view.setUint16(32, 1, true); view.setUint16(34, 8, true);
  writeStr(36, 'data'); view.setUint32(40, samples, true);
  new Uint8Array(buffer, 44).fill(128); // 128 = silencio en PCM de 8 bits
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
}
let audioUnlockInstalled = false;
function installAudioUnlock() {
  if (audioUnlockInstalled || typeof window === 'undefined') return;
  audioUnlockInstalled = true;
  const unlock = () => {
    const a = getAudio();
    if (!a.src) {
      const silentUrl = makeSilentWavUrl();
      a.src = silentUrl;
      const cleanup = () => {
        // Solo limpiar si nadie más tomó el elemento mientras tanto (una frase real).
        if (a.src === silentUrl) { a.pause(); a.removeAttribute('src'); }
        URL.revokeObjectURL(silentUrl);
      };
      a.play().then(cleanup).catch(cleanup);
    }
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
  };
  window.addEventListener('pointerdown', unlock, { once: false });
  window.addEventListener('keydown', unlock, { once: false });
}

// ---------- Respaldo: voces del navegador (Web Speech API) ----------
// Chrome/Edge cargan la lista de voces de forma ASÍNCRONA; si se pide
// demasiado pronto, getVoices() viene vacío y se cae en la voz por defecto.
let cachedVoices: SpeechSynthesisVoice[] = [];
let voicesReadyPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return Promise.resolve([]);
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
    setTimeout(finish, 1200);
  });
  return voicesReadyPromise;
}

// Llamar una vez al arrancar la app: precarga las voces del navegador (para el
// respaldo) y prepara el desbloqueo de audio para móviles.
export function warmUpSpeechVoices() {
  loadVoices();
  installAudioUnlock();
}

function pickBestSpanishVoice(voices: SpeechSynthesisVoice[], voiceURI?: string): SpeechSynthesisVoice | undefined {
  if (voiceURI) {
    const exact = voices.find(v => v.voiceURI === voiceURI);
    if (exact) return exact;
  }
  const esVoices = voices.filter(v => v.lang.toLowerCase().startsWith('es'));
  if (esVoices.length === 0) return undefined;
  const byName = (needle: string) => esVoices.find(v => v.name.toLowerCase().includes(needle));
  return (
    esVoices.find(v => /natural/i.test(v.name)) ||
    esVoices.find(v => /neural/i.test(v.name)) ||
    esVoices.find(v => /online/i.test(v.name)) ||
    esVoices.find(v => v.name.toLowerCase().includes('google')) ||
    byName('jorge') || byName('álvaro') || byName('alvaro') || byName('raúl') || byName('raul') || byName('diego') ||
    esVoices.find(v => v.lang === 'es-ES') ||
    esVoices[0]
  );
}

function speakWithBrowserVoice(text: string, settings: SpeakSettings | undefined, onDone: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onDone();
    return;
  }

  const run = (voices: SpeechSynthesisVoice[]) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.pitch = settings?.pitch !== undefined ? settings.pitch : 0.98;
    utterance.rate = settings?.rate !== undefined ? settings.rate : 1.06;
    utterance.volume = settings?.volume !== undefined ? settings.volume : 1.0;

    // Si en los ajustes quedó guardada una voz de Edge, no es una voz del navegador:
    // se ignora y se elige la mejor voz en español disponible.
    const osVoiceURI = isEdgeVoiceId(settings?.voiceURI) ? undefined : settings?.voiceURI;
    const best = pickBestSpanishVoice(voices, osVoiceURI);
    if (best) {
      utterance.voice = best;
      utterance.lang = best.lang;
    }

    // Bug conocido de Chrome/Edge en Windows: el Web Speech API se "pausa" solo
    // en frases largas (~15 s). Este keep-alive lo evita.
    const keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        clearInterval(keepAlive);
      }
    }, 10000);

    const done = () => {
      clearInterval(keepAlive);
      browserSpeaking = false;
      onDone();
    };
    utterance.onend = done;
    utterance.onerror = done;
    browserSpeaking = true;
    window.speechSynthesis.speak(utterance);
  };

  if (cachedVoices.length > 0) run(cachedVoices);
  else loadVoices().then(run);
}

// ---------- Voz principal: edge-tts vía el servidor ----------

// Quita marcas de formato que suenan mal al leerlas en voz alta.
function cleanForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/[*_`#>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Divide en trozos de ~350 caracteres, cortando en fin de oración. Así las
// respuestas largas no se cortan por el límite del servidor, y mientras suena
// un trozo ya se está generando el siguiente (menos pausas entre frases).
function splitIntoChunks(text: string, max = 350): string[] {
  const sentences = (text.match(/[^.!?…]+[.!?…]*\s*/g) || [text]).map(t => t.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  const push = () => { if (current.trim()) chunks.push(current.trim()); current = ''; };

  for (const sentence of sentences) {
    if (sentence.length > max) {
      push();
      // Oración enorme: partir por comas y, si hace falta, por espacios.
      let rest = sentence;
      while (rest.length > max) {
        let cut = rest.lastIndexOf(',', max);
        if (cut < max * 0.4) cut = rest.lastIndexOf(' ', max);
        if (cut <= 0) cut = max;
        chunks.push(rest.slice(0, cut + 1).trim());
        rest = rest.slice(cut + 1);
      }
      current = rest;
      continue;
    }
    if ((current + ' ' + sentence).trim().length > max) push();
    current = (current + ' ' + sentence).trim();
  }
  push();
  return chunks.filter(Boolean);
}

async function fetchEdgeAudio(text: string, voice: string, settings: SpeakSettings | undefined, signal: AbortSignal): Promise<Blob> {
  // Timeout propio: si el servidor no contesta, no dejamos a Atlas callado
  // esperando — se pasa a la voz del navegador.
  const local = new AbortController();
  const onParentAbort = () => local.abort();
  if (signal.aborted) local.abort();
  else signal.addEventListener('abort', onParentAbort);
  const timer = setTimeout(() => local.abort(), 9000);
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate: settings?.rate, pitch: settings?.pitch }),
      signal: local.signal
    });
    if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
    return await res.blob();
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', onParentAbort);
  }
}

function playBlob(blob: Blob, volume: number, token: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = getAudio();
    releaseObjectUrl();
    currentObjectUrl = URL.createObjectURL(blob);
    audio.src = currentObjectUrl;
    audio.volume = Math.max(0, Math.min(1, volume));
    settlePlayback = () => resolve();
    audio.onended = () => { settlePlayback = null; resolve(); };
    audio.onerror = () => { settlePlayback = null; reject(new Error('audio error')); };
    audio.play().catch((err) => { settlePlayback = null; reject(err); });
    // Si otra frase ya tomó el control, no hay nada que reproducir.
    if (token !== speakToken) { audio.pause(); settlePlayback = null; resolve(); }
  });
}

/**
 * Detiene cualquier voz en curso (edge-tts o del navegador) y descarta lo que
 * estuviera pendiente de generarse. La frase interrumpida sí avisa su onEnd,
 * igual que hacía speechSynthesis.cancel() antes.
 */
export function stopSpeaking() {
  speakToken++;
  if (abortController) { abortController.abort(); abortController = null; }
  if (sharedAudio) { try { sharedAudio.pause(); } catch {} }
  releaseObjectUrl();
  if (settlePlayback) { const settle = settlePlayback; settlePlayback = null; settle(); }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  browserSpeaking = false;
  const finish = currentFinish;
  currentFinish = null;
  if (finish) finish();
}

export function isSpeaking(): boolean {
  const audioPlaying = !!sharedAudio && !sharedAudio.paused && !sharedAudio.ended && !!sharedAudio.src;
  return audioPlaying || currentFinish !== null || browserSpeaking;
}

/**
 * Habla en español. Misma firma de siempre:
 *   speakSpanish(texto, nombre?, ajustes | onEnd?, onEnd?)
 */
export function speakSpanish(
  text: string,
  voiceName: AssistantVoiceName = 'Atlas',
  customSettingsOrOnEnd?: SpeakSettings | (() => void),
  onEndCallback?: () => void
) {
  let customSettings: SpeakSettings | undefined;
  let onEnd: (() => void) | undefined = onEndCallback;

  if (typeof customSettingsOrOnEnd === 'function') {
    onEnd = customSettingsOrOnEnd;
  } else if (customSettingsOrOnEnd) {
    customSettings = customSettingsOrOnEnd;
  }

  // Una sola voz a la vez: lo anterior se corta (y avisa su onEnd).
  stopSpeaking();

  const cleaned = cleanForSpeech(text || '');
  if (!cleaned) {
    if (onEnd) onEnd();
    return;
  }

  const myToken = ++speakToken;
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    if (currentFinish === finish) currentFinish = null;
    if (onEnd) onEnd();
  };
  currentFinish = finish;

  const voice = isEdgeVoiceId(customSettings?.voiceURI) ? (customSettings!.voiceURI as string) : DEFAULT_EDGE_VOICE;
  const volume = customSettings?.volume !== undefined ? customSettings.volume : 1.0;
  const chunks = splitIntoChunks(cleaned);
  const controller = new AbortController();
  abortController = controller;

  const fallbackFrom = (index: number) => {
    if (myToken !== speakToken) return;
    controller.abort(); // ya no hace falta lo que quedara por generar
    const remaining = chunks.slice(index).join(' ');
    speakWithBrowserVoice(remaining, customSettings, finish);
  };

  (async () => {
    // Se pide el primer trozo ya, y el siguiente mientras suena el actual.
    let pending: Promise<Blob> = fetchEdgeAudio(chunks[0], voice, customSettings, controller.signal);
    for (let i = 0; i < chunks.length; i++) {
      let blob: Blob;
      try {
        blob = await pending;
      } catch {
        // Sin servicio de voz (o cancelado): respaldo con la voz del navegador.
        if (myToken === speakToken) fallbackFrom(i);
        return;
      }
      if (myToken !== speakToken) return; // otra frase tomó el control

      pending = i + 1 < chunks.length
        ? fetchEdgeAudio(chunks[i + 1], voice, customSettings, controller.signal)
        : Promise.resolve(new Blob());
      // Evita un "unhandled rejection" si este trozo siguiente se cancela.
      pending.catch(() => {});

      try {
        await playBlob(blob, volume, myToken);
      } catch {
        // El navegador bloqueó la reproducción (típico en móviles sin toque previo).
        if (myToken === speakToken) fallbackFrom(i);
        return;
      }
      if (myToken !== speakToken) return;
    }
    if (myToken === speakToken) {
      releaseObjectUrl();
      abortController = null;
      finish();
    }
  })();
}
