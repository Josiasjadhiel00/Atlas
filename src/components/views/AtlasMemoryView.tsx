import React, { useState } from 'react';
import { 
  Brain, Plus, Search, Sparkles, Tag, Clock, Database, 
  Trash2, ShieldCheck, CheckCircle2, CloudUpload
} from 'lucide-react';
import { SmartMemory } from '../../types';
import { sciFiAudio } from '../../utils/audioSynth';

interface AtlasMemoryViewProps {
  memories: SmartMemory[];
  onAddMemory?: (title: string, content: string, category?: string) => void;
  onDeleteMemory?: (id: string) => void;
}

export const AtlasMemoryView: React.FC<AtlasMemoryViewProps> = ({
  memories,
  onAddMemory,
  onDeleteMemory
}) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('preferencia');
  const [isAdding, setIsAdding] = useState(false);

  const categories = [
    { id: 'all', label: 'Todas las Memorias' },
    { id: 'preferencia', label: 'Preferencias de Usuario' },
    { id: 'proyecto', label: 'Proyectos & Arquitectura' },
    { id: 'sistema', label: 'Parámetros del Sistema' }
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    sciFiAudio.playConfirmSound();
    if (onAddMemory) {
      onAddMemory(newTitle.trim(), newContent.trim(), newCategory);
    }
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const filteredMemories = memories.filter(m => {
    const matchesCat = activeCategory === 'all' || (m.category || '').toLowerCase() === activeCategory;
    const titleText = (m.title || m.topic || '').toLowerCase();
    const matchesSearch = !search || 
      titleText.includes(search.toLowerCase()) || 
      m.content.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8b5cf615] border border-[#8b5cf644] flex items-center justify-center text-[#a78bfa] shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">NÚCLEO DE MEMORIA PERSISTENTE & CONTEXTO</h2>
            <p className="text-[11px] text-slate-400">
              Almacén a largo plazo indexado en Firestore con recuperación semántica para Gemini
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              setIsAdding(!isAdding);
            }}
            className="px-4 py-2 bg-[#00f2ff] hover:bg-[#38bdf8] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAdding ? 'Cancelar' : 'Nueva Memoria'}</span>
          </button>
        </div>
      </div>

      {/* Add Memory Modal/Form */}
      {isAdding && (
        <form onSubmit={handleAddSubmit} className="bg-[#050b1d]/90 border border-[#00f2ff55] rounded-2xl p-4 space-y-3 shadow-2xl animate-in fade-in duration-200">
          <h3 className="text-xs font-bold text-[#00f2ff] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Registrar Nuevo Recuerdo Contextual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Título del recuerdo (ej: 'Preferencia de tono formal')..."
              className="bg-black/70 border border-[#00f2ff33] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff]"
              required
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="bg-black/70 border border-[#00f2ff33] rounded-xl px-3 py-2 text-xs text-[#00f2ff] focus:outline-none"
            >
              <option value="preferencia">Preferencia de Usuario</option>
              <option value="proyecto">Proyecto & Código</option>
              <option value="sistema">Sistema & Entorno</option>
            </select>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Detalle o instrucción que ATLAS debe recordar de forma permanente..."
            rows={2}
            className="w-full bg-black/70 border border-[#00f2ff33] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff]"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs text-slate-400 hover:text-white"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-[#00f2ff] text-black font-bold text-xs shadow-[0_0_10px_#00f2ff]"
            >
              Guardar en Nube
            </button>
          </div>
        </form>
      )}

      {/* Search & Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#00f2ff]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar entre recuerdos indexados..."
            className="w-full bg-[#050b1d]/85 border border-[#00f2ff22] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00f2ff]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { sciFiAudio.playBlip(); setActiveCategory(cat.id); }}
              className={`px-3 py-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]'
                  : 'bg-[#050b1d]/85 border border-[#00f2ff22] text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memories Grid */}
      <div className="flex-1 bg-[#050b1d]/70 backdrop-blur-xl border border-[#00f2ff22] rounded-2xl p-4 lg:p-5 overflow-y-auto space-y-3">
        {filteredMemories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
            <Brain className="w-12 h-12 text-[#00f2ff44]" />
            <p className="text-sm text-slate-400">No hay memorias registradas en esta categoría.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredMemories.map((mem) => (
              <div
                key={mem.id}
                className="bg-[#050b1d]/85 hover:bg-[#071330] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-2xl p-4 transition-all shadow-[0_0_15px_rgba(0,0,0,0.25)] space-y-2 group relative"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#00f2ff10] border border-[#00f2ff33] text-[#00f2ff] uppercase font-bold">
                      {mem.category || 'Recuerdo'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {mem.createdAt || 'Permanente'}
                    </span>
                  </div>

                  {onDeleteMemory && (
                    <button
                      onClick={() => onDeleteMemory(mem.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-opacity cursor-pointer"
                      title="Eliminar memoria"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white group-hover:text-[#00f2ff] transition-colors">
                  {mem.title || mem.topic}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {mem.content}
                </p>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-emerald-400">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> SINCRONIZADO EN NUBE
                  </span>
                  <span className="text-slate-500">RELEVANCIA 100%</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
