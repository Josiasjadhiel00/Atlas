import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Mic, MicOff, Sparkles, Volume2, Bot, User, Trash2, 
  Copy, Check, Radio, Terminal, ChevronDown, RefreshCw,
  Globe, Cpu, ExternalLink, Brain, Wrench, ShieldAlert
} from 'lucide-react';
import { AssistantLogEntry, AssistantState, AssistantVoiceName, VoiceSettings } from '../../types';
import { sciFiAudio, speakSpanish } from '../../utils/audioSynth';

interface AtlasConversationViewProps {
  logs: AssistantLogEntry[];
  assistantName: AssistantVoiceName;
  state: AssistantState;
  isListening: boolean;
  onToggleMic: () => void;
  onSendCommand: (cmd: string) => void;
  voiceSettings: VoiceSettings;
  activeModel?: string;
  onClearLogs?: () => void;
}

export const AtlasConversationView: React.FC<AtlasConversationViewProps> = ({
  logs,
  assistantName,
  state,
  isListening,
  onToggleMic,
  onSendCommand,
  voiceSettings,
  activeModel = 'gemini-3.8-flash',
  onClearLogs
}) => {
  const [inputText, setInputText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, state]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sciFiAudio.playBlip();
    onSendCommand(inputText.trim());
    setInputText('');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (text: string) => {
    sciFiAudio.playBlip();
    speakSpanish(text, assistantName, voiceSettings);
  };

  const suggestedPrompts = [
    '¿Cómo describirías tu personalidad y estilo de trabajo?',
    '¿Cuál es el estado de mis proyectos y tareas pendientes?',
    'Ayúdame a optimizar una arquitectura de software full-stack',
    'Dame un diagnóstico completo de telemetría y conexión'
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Top Header of Conversation View */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 flex items-center justify-between shadow-[0_0_25px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">CANAL DE COMUNICACIÓN // {assistantName.toUpperCase()}</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00f2ff15] border border-[#00f2ff44] text-[#00f2ff]">
                {activeModel}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interacción directa por lenguaje natural, function calling y transcripción de voz
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            let label = null;
            let badgeClass = '';
            let dotClass = '';

            if (state === 'listening' || isListening) {
              label = 'ATLAS • Escuchando';
              badgeClass = 'bg-amber-500/20 border-amber-400 text-amber-300';
              dotClass = 'bg-amber-400 animate-ping';
            } else if (state === 'thinking') {
              label = 'ATLAS • Procesando';
              badgeClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-300';
              dotClass = 'bg-cyan-400 animate-pulse';
            } else if (state === 'searching') {
              label = 'ATLAS • Investigando';
              badgeClass = 'bg-indigo-500/25 border-indigo-400 text-indigo-300';
              dotClass = 'bg-indigo-400 animate-ping';
            } else if (state === 'executing') {
              label = 'ATLAS • Ejecutando acción';
              badgeClass = 'bg-emerald-500/25 border-emerald-400 text-emerald-300';
              dotClass = 'bg-emerald-400 animate-pulse';
            } else if (state === 'completed') {
              label = 'ATLAS • Completado';
              badgeClass = 'bg-emerald-500/20 border-emerald-400 text-emerald-300';
              dotClass = 'bg-emerald-400';
            } else if (state === 'speaking') {
              label = 'ATLAS • Respondiendo';
              badgeClass = 'bg-cyan-500/15 border-[#00f2ff] text-[#00f2ff]';
              dotClass = 'bg-[#00f2ff] animate-pulse';
            }

            if (!label) return null;

            return (
              <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono transition-all duration-200 ${badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                <span className="font-semibold">{label}</span>
              </div>
            );
          })()}

          {onClearLogs && (
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                onClearLogs();
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
              title="Limpiar conversación"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 bg-[#050b1d]/70 backdrop-blur-xl border border-[#00f2ff22] rounded-2xl p-4 lg:p-5 overflow-y-auto space-y-4 shadow-inner min-h-[400px]">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00f2ff10] border border-[#00f2ff33] flex items-center justify-center text-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.2)]">
              <Bot className="w-8 h-8 animate-pulse" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-base font-bold text-white">A.T.L.A.S. Core listo</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                Educado, inteligente, directo, comprensivo, audaz, relajado, introvertido, divertido y autosuficiente.
              </p>
              <p className="text-[11px] text-slate-400">
                Pregúntame lo que necesites o pídeme ejecutar órdenes en tu PC. Yo me encargo del trabajo pesado sin rodeos.
              </p>
            </div>
          </div>
        ) : (
          logs.map((log) => {
            const isUser = log.sender === 'USER';
            const isSystem = log.sender === 'SYSTEM';

            if (isSystem) {
              return (
                <div key={log.id} className="flex items-center justify-center my-2">
                  <div className="bg-[#03091e]/80 border border-[#00f2ff33] px-3.5 py-1.5 rounded-full text-[11px] font-mono text-[#00f2ff] flex items-center gap-2 max-w-xl shadow-[0_0_10px_rgba(0,242,255,0.1)]">
                    <Terminal className="w-3.5 h-3.5 shrink-0 text-[#00f2ff]" />
                    <span className="truncate">{log.text}</span>
                    <span className="text-[9px] text-slate-500 shrink-0 ml-auto">{log.timestamp}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={log.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isUser 
                    ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-cyan-400/50 text-white' 
                    : 'bg-[#00f2ff15] border-[#00f2ff66] text-[#00f2ff]'
                }`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`rounded-2xl p-4 space-y-2 border relative group transition-all ${
                  isUser
                    ? 'bg-[#0a1738] border-[#00f2ff44] text-white'
                    : 'bg-[#040a1c] border-[#00f2ff33] text-slate-200 shadow-[0_0_20px_rgba(0,242,255,0.05)]'
                }`}>
                  <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-1">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-[#00f2ff]">
                      {isUser ? 'TÚ' : assistantName}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {log.timestamp}
                    </span>
                  </div>

                  {/* Source & Memory Indicators */}
                  {!isUser && (
                    <div className="space-y-1.5 pt-0.5">
                      {/* Recalled Memories Badge */}
                      {log.recalledMemories && log.recalledMemories.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f2ff12] border border-[#00f2ff33] text-[#00f2ff] text-[10px] font-mono">
                          <Brain className="w-3 h-3 text-[#00f2ff] shrink-0" />
                          <span className="font-semibold">MEMORIA CENTRAL RECUPERADA:</span>
                          <span className="text-slate-300 italic truncate">{log.recalledMemories.join(', ')}</span>
                        </div>
                      )}

                      {/* Internet Research vs Model Knowledge distinction */}
                      {(log.knowledgeSource === 'internet_research' || (log.sources && log.sources.length > 0) || log.action?.type === 'web_search') ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-500/15 border border-indigo-400/40 text-indigo-300 text-[10px] font-mono">
                          <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="font-bold tracking-wide">INFORMACIÓN OBTENIDA MEDIANTE INTERNET (TIEMPO REAL)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/30 text-cyan-300/80 text-[9px] font-mono w-fit">
                          <Cpu className="w-2.5 h-2.5 text-cyan-400" />
                          <span>CONOCIMIENTO DEL MODELO // NÚCLEO ATLAS</span>
                        </div>
                      )}

                      {/* Tool Execution Tag */}
                      {log.toolDetails && (
                        <div className="flex items-center justify-between px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                          <div className="flex items-center gap-1.5">
                            <Wrench className="w-3 h-3 text-emerald-400" />
                            <span className="font-semibold">HERRAMIENTA EJECUTADA:</span>
                            <span className="text-white font-bold">{log.toolDetails.name}</span>
                          </div>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 uppercase">Éxito</span>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {log.text}
                  </p>

                  {/* Sources Chips */}
                  {!isUser && log.sources && log.sources.length > 0 && (
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-[#00f2ff]" /> Fuentes de Internet consultadas:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {log.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] bg-slate-900/90 hover:bg-[#00f2ff15] border border-slate-700 hover:border-[#00f2ff55] px-2 py-0.5 rounded text-cyan-300 hover:text-white transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[200px]">{src.title}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions footer for assistant messages */}
                  {!isUser && (
                    <div className="flex items-center justify-end gap-1 pt-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSpeak(log.text)}
                        className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-[#00f2ff] cursor-pointer"
                        title="Escuchar respuesta"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopy(log.text, log.id)}
                        className="p-1 rounded hover:bg-white/5 text-slate-400 hover:text-white cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#00f2ff]" /> Sugerencias:
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => {
              sciFiAudio.playBlip();
              onSendCommand(prompt);
            }}
            className="text-xs font-sans px-3 py-1.5 rounded-xl bg-[#050b1d] hover:bg-[#0c183b] border border-[#00f2ff22] hover:border-[#00f2ff66] text-slate-300 hover:text-[#00f2ff] shrink-0 transition-all cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#050b1d]/90 backdrop-blur-xl border border-[#00f2ff44] rounded-2xl p-2.5 flex items-center gap-2 shadow-[0_0_30px_rgba(0,242,255,0.12)]"
      >
        <button
          type="button"
          onClick={() => {
            sciFiAudio.playBlip();
            onToggleMic();
          }}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            isListening 
              ? 'bg-red-500 text-white border-red-400 shadow-[0_0_20px_#ef4444] animate-pulse' 
              : 'bg-[#00f2ff15] border-[#00f2ff44] text-[#00f2ff] hover:bg-[#00f2ff33]'
          }`}
          title={isListening ? 'Detener micrófono' : 'Hablar por voz'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escribe una instrucción o consulta para ATLAS..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 font-sans focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className={`p-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 ${
            inputText.trim()
              ? 'bg-[#00f2ff] text-black shadow-[0_0_15px_rgba(0,242,255,0.4)] hover:bg-[#38bdf8]'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
