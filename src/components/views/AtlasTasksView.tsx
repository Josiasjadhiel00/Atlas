import React, { useState } from 'react';
import { 
  CheckSquare, Plus, Zap, CheckCircle2, Clock, AlertTriangle, 
  Trash2, ShieldCheck, Flame, Cpu, Radio, Sparkles
} from 'lucide-react';
import { ProjectTask, AssistantVoiceName } from '../../types';
import { sciFiAudio } from '../../utils/audioSynth';

interface AtlasTasksViewProps {
  tasks: ProjectTask[];
  onToggleTask: (taskId: string) => void;
  assistantName?: AssistantVoiceName;
  onRunProtocol?: (protocolName: string) => void;
  onAddNewTask?: (title: string, priority: 'low' | 'medium' | 'high') => void;
}

export const AtlasTasksView: React.FC<AtlasTasksViewProps> = ({
  tasks,
  onToggleTask,
  assistantName = 'Atlas',
  onRunProtocol,
  onAddNewTask
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'protocols'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const handleAddTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    sciFiAudio.playConfirmSound();
    if (onAddNewTask) {
      onAddNewTask(newTitle.trim(), newPriority);
    }
    setNewTitle('');
  };

  const protocols = [
    {
      id: 'proto-sentinel',
      name: 'PROTOCOLO CENTINELA',
      description: 'Chequeo completo de telemetría, estado de memoria RAM, temperatura y conexión segura con Gemini.',
      level: 'Diagnóstico',
      icon: ShieldCheck,
      color: '#00f2ff'
    },
    {
      id: 'proto-focus',
      name: 'PROTOCOLO DEEP FOCUS',
      description: 'Silencia notificaciones no esenciales, activa música de concentración y bloquea pestañas recreativas.',
      level: 'Productividad',
      icon: Flame,
      color: '#a855f7'
    },
    {
      id: 'proto-backup',
      name: 'PROTOCOLO BACKUP NUBE',
      description: 'Crea una instantánea encriptada de todas las notas, proyectos y tareas en Firebase Firestore.',
      level: 'Seguridad',
      icon: Radio,
      color: '#10b981'
    },
    {
      id: 'proto-clean',
      name: 'PROTOCOLO LIMPIEZA',
      description: 'Libera memoria caché, cierra subprocesos huérfanos y optimiza el consumo energético de la CPU.',
      level: 'Mantenimiento',
      icon: Cpu,
      color: '#f59e0b'
    }
  ];

  const filteredTasks = tasks.filter(t => {
    if (filter === 'pending') return t.status === 'pending';
    if (filter === 'completed') return t.status === 'completed';
    return true;
  });

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">ORGANIZADOR DE TAREAS & PROTOCOLOS STARK</h2>
            <p className="text-[11px] text-slate-400">
              Control táctico de actividades, priorización inteligente y automatizaciones de sistema
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-black/60 p-1 rounded-xl border border-[#00f2ff33] gap-1">
          <button
            onClick={() => { sciFiAudio.playBlip(); setFilter('all'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'all' ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            TODAS ({tasks.length})
          </button>
          <button
            onClick={() => { sciFiAudio.playBlip(); setFilter('pending'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'pending' ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            PENDIENTES ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => { sciFiAudio.playBlip(); setFilter('completed'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'completed' ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]' : 'text-slate-400 hover:text-white'
            }`}
          >
            HECHAS ({tasks.filter(t => t.status === 'completed').length})
          </button>
          <button
            onClick={() => { sciFiAudio.playBlip(); setFilter('protocols'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
              filter === 'protocols' ? 'bg-purple-600 text-white shadow-[0_0_10px_#9333ea]' : 'text-slate-400 hover:text-white'
            }`}
          >
            PROTOCOLOS (4)
          </button>
        </div>
      </div>

      {/* Add Task Input Bar */}
      <form onSubmit={handleAddTaskSubmit} className="bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-2.5 flex items-center gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Escribe una nueva tarea (ej: 'Revisar endpoints de Stripe', 'Diseñar base de datos')..."
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 font-sans focus:outline-none"
        />

        <select
          value={newPriority}
          onChange={(e) => setNewPriority(e.target.value as any)}
          className="bg-black/80 border border-[#00f2ff44] text-[#00f2ff] text-xs font-mono px-3 py-2 rounded-xl focus:outline-none"
        >
          <option value="low">Baja Prioridad</option>
          <option value="medium">Media Prioridad</option>
          <option value="high">Alta Prioridad</option>
        </select>

        <button
          type="submit"
          disabled={!newTitle.trim()}
          className="px-4 py-2 bg-[#00f2ff] hover:bg-[#38bdf8] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,242,255,0.4)] cursor-pointer shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Agregar Tarea</span>
        </button>
      </form>

      {/* Main Content Area */}
      {filter === 'protocols' ? (
        /* Stark Protocols Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {protocols.map((proto) => {
            const Icon = proto.icon;
            return (
              <div
                key={proto.id}
                className="bg-[#050b1d]/85 border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-2xl p-5 space-y-3 transition-all group shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
                      style={{ backgroundColor: `${proto.color}15`, borderColor: `${proto.color}44`, color: proto.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wider group-hover:text-[#00f2ff] transition-colors">
                        {proto.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        Nivel: {proto.level}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      sciFiAudio.playConfirmSound();
                      if (onRunProtocol) onRunProtocol(proto.name);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#00f2ff] hover:bg-[#38bdf8] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,242,255,0.3)] cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>ACTIVAR</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {proto.description}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tasks List */
        <div className="flex-1 bg-[#050b1d]/70 backdrop-blur-xl border border-[#00f2ff22] rounded-2xl p-4 lg:p-5 overflow-y-auto space-y-2.5">
          {filteredTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <CheckSquare className="w-12 h-12 text-[#00f2ff44]" />
              <p className="text-sm text-slate-400">No hay tareas en esta sección.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onToggleTask(task.id);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    isCompleted
                      ? 'bg-black/40 border-slate-800 text-slate-500 opacity-60'
                      : 'bg-[#050b1d]/85 hover:bg-[#071434] border-[#00f2ff22] hover:border-[#00f2ff66] text-white shadow-[0_0_15px_rgba(0,0,0,0.2)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-emerald-500 border-emerald-400 text-black'
                        : 'border-[#00f2ff66] group-hover:border-[#00f2ff] bg-black/50'
                    }`}>
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>

                    <span className={`text-xs sm:text-sm font-sans ${isCompleted ? 'line-through' : 'font-medium'}`}>
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                      task.priority === 'high'
                        ? 'bg-red-950/70 border border-red-500/40 text-red-400'
                        : task.priority === 'medium'
                        ? 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                        : 'bg-cyan-950/70 border border-cyan-500/40 text-cyan-400'
                    }`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Normal'}
                    </span>

                    {task.createdAt && (
                      <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                        {task.createdAt}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
};
