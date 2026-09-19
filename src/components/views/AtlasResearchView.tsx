import React, { useState } from 'react';
import { 
  Search, Globe, ExternalLink, Sparkles, Clock, ArrowRight, 
  Bookmark, CheckCircle2, RefreshCw, FileText, Share2 
} from 'lucide-react';
import { WebSearchResult } from '../../types';
import { sciFiAudio } from '../../utils/audioSynth';

interface AtlasResearchViewProps {
  onSearch: (query: string) => void;
  searchResults?: WebSearchResult[];
  isSearching?: boolean;
}

export const AtlasResearchView: React.FC<AtlasResearchViewProps> = ({
  onSearch,
  searchResults = [],
  isSearching = false
}) => {
  const [query, setQuery] = useState('');

  const displayResults = searchResults;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    sciFiAudio.playBlip();
    onSearch(query);
  };

  const researchTopics = [
    'Inteligencia Artificial 2026',
    'Arquitectura SaaS Microservicios',
    'Modelos Ollama Locales',
    'Ciberseguridad y Seguridad de APIs',
    'Bases de Datos Vectoriales'
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header & Query Bar */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 shadow-[0_0_25px_rgba(0,242,255,0.08)] space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">MÓDULO DE INVESTIGACIÓN Y BÚSQUEDA WEB</h2>
              <p className="text-[11px] text-slate-400">
                Extracción de información en vivo de internet mediante Google Grounding & Rastreo Inteligente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              GOOGLE GROUNDING ONLINE
            </span>
          </div>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f2ff]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe el tema que deseas investigar en internet..."
              className="w-full bg-black/70 border border-[#00f2ff33] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-[#00f2ff] shadow-inner font-sans"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#00f2ff] hover:bg-[#38bdf8] text-black font-bold text-xs sm:text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)] flex items-center gap-2 cursor-pointer shrink-0"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>{isSearching ? 'Investigando...' : 'Buscar'}</span>
          </button>
        </form>

        {/* Quick Topic Chips */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#00f2ff]" /> Temas frecuentes:
          </span>
          {researchTopics.map((topic, idx) => (
            <button
              key={idx}
              onClick={() => {
                sciFiAudio.playBlip();
                setQuery(topic);
                onSearch(topic);
              }}
              className="text-xs font-sans px-3 py-1 rounded-xl bg-[#03091e] hover:bg-[#0c183b] border border-[#00f2ff22] hover:border-[#00f2ff66] text-slate-300 hover:text-[#00f2ff] shrink-0 transition-all cursor-pointer"
            >
              {topic}
            </button>
          ))}
        </div>

      </div>

      {/* Main Research Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Side: Telemetry & Satellite Radar */}
        <div className="lg:col-span-4 space-y-4 flex flex-col">
          
          {/* Satellite Map Backdrop */}
          <div className="bg-[#050b1d]/85 border border-[#00f2ff33] rounded-2xl p-4 shadow-[0_0_20px_rgba(0,242,255,0.06)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2 mb-3">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#00f2ff]" />
                RADAR GEO-GLOBAL
              </span>
              <span className="text-[9px] font-mono text-emerald-400">ENLACE SINC</span>
            </div>

            <div className="h-36 rounded-xl overflow-hidden relative border border-[#00f2ff22]">
              <img
                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
                alt="Earth Satellite View"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030816] via-transparent to-transparent" />
              
              {/* Radar Grid overlay */}
              <div className="absolute inset-0 bg-[radial-gradient(#00f2ff33_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[10px] font-mono text-[#00f2ff] bg-black/70 backdrop-blur-md px-2 py-1 rounded-lg border border-[#00f2ff33]">
                <span>LAT: 40.7128° N</span>
                <span>LON: 74.0060° W</span>
              </div>
            </div>
          </div>

          {/* Research Stats Card */}
          <div className="bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Métricas de Investigación
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-[#03091e] border border-[#00f2ff22] rounded-xl p-2.5">
                <div className="text-lg font-bold text-[#00f2ff] font-mono">{displayResults.length}</div>
                <div className="text-[10px] text-slate-400">Fuentes analizadas</div>
              </div>
              <div className="bg-[#03091e] border border-[#00f2ff22] rounded-xl p-2.5">
                <div className="text-lg font-bold text-emerald-400 font-mono">0.42s</div>
                <div className="text-[10px] text-slate-400">Tiempo de respuesta</div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side: Search Results Cards */}
        <div className="lg:col-span-8 flex flex-col space-y-3 overflow-y-auto">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#00f2ff]" />
              Resultados y Fuentes Verificadas ({displayResults.length})
            </h3>
            <span className="text-[10px] font-mono text-[#00f2ff]">INDEXADO CON ÉXITO</span>
          </div>

          {displayResults.length === 0 ? (
            <div className="bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#00f2ff10] border border-[#00f2ff33] flex items-center justify-center text-[#00f2ff]">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Radar de Investigación Inactivo</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  Introduce una consulta o tema arriba para rastrear fuentes en tiempo real, extraer citas y sintetizar conocimiento con ATLAS.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {displayResults.map((result, idx) => (
                <div
                  key={idx}
                  className="bg-[#050b1d]/85 hover:bg-[#071330] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-2xl p-4 transition-all shadow-[0_0_20px_rgba(0,0,0,0.3)] space-y-2.5 group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-[#00f2ff] px-2 py-0.5 rounded-full bg-[#00f2ff10] border border-[#00f2ff33] inline-block mb-1.5">
                        FUENTE {idx + 1} // {result.publishedDate || 'Actualizado'}
                      </span>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#00f2ff] transition-colors leading-snug">
                        {result.title}
                      </h4>
                    </div>

                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-white/5 hover:bg-[#00f2ff22] text-slate-400 hover:text-[#00f2ff] border border-transparent hover:border-[#00f2ff44] transition-all cursor-pointer shrink-0"
                        title="Abrir enlace original"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {result.snippet}
                  </p>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span className="truncate max-w-md text-slate-400">{result.url}</span>
                    <button
                      onClick={() => {
                        sciFiAudio.playBlip();
                        onSearch(`Explícame en detalle: ${result.title}`);
                      }}
                      className="text-[#00f2ff] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <span>Profundizar con ATLAS</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
