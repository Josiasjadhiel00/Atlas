import React, { useState, useEffect } from 'react';
import { CheckSquare, Square, Plus, Trash2, ShieldCheck, Zap, Laptop, Lock } from 'lucide-react';
import { AssistantVoiceName } from '../types';
import { sciFiAudio, speakSpanish } from '../utils/audioSynth';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'HIGH' | 'MED' | 'LOW';
}

interface StarkProtocolTasksProps {
  onRunProtocol?: (protocolName: string) => void;
  assistantName?: AssistantVoiceName;
}

export const StarkProtocolTasks: React.FC<StarkProtocolTasksProps> = ({
  onRunProtocol,
  assistantName = 'Atlas'
}) => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('stark_daily_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    return [
      { id: '1', text: 'Revisión de arquitectura y código', completed: true, priority: 'HIGH' },
      { id: '2', text: 'Despliegue de microservicios FastAPI', completed: false, priority: 'HIGH' },
      { id: '3', text: 'Sincronizar telemetría de estación de trabajo', completed: false, priority: 'MED' }
    ];
  });

  const [newTaskText, setNewTaskText] = useState('');
  const [activeTab, setActiveTab] = useState<'TASKS' | 'PROTOCOLS'>('TASKS');

  useEffect(() => {
    localStorage.setItem('stark_daily_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const toggleTask = (id: string) => {
    sciFiAudio.playBlip();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const addTask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    sciFiAudio.playExecution();
    const newTask: Task = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      priority: 'HIGH'
    };
    setTasks((prev) => [newTask, ...prev]);
    setNewTaskText('');
  };

  const deleteTask = (id: string) => {
    sciFiAudio.playBlip();
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const triggerProtocol = (protocol: string, desc: string) => {
    sciFiAudio.playSuccess();
    speakSpanish(`Activando ${protocol}. ${desc}`, assistantName);
    if (onRunProtocol) onRunProtocol(protocol);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="border border-[#00f2ff44] bg-black/80 rounded-sm p-2.5 space-y-2 select-none relative overflow-hidden">
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00f2ff]" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00f2ff]" />

      {/* Header with Tab Switcher */}
      <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-1">
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#00f2ff]">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          <span>OBJETIVOS & PROTOCOLOS</span>
        </div>

        <div className="flex bg-black/80 border border-[#00f2ff33] p-0.5 rounded-xs font-mono text-[8px]">
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
              activeTab === 'TASKS' ? 'bg-[#00f2ff] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            TAREAS ({completedCount}/{tasks.length})
          </button>
          <button
            onClick={() => setActiveTab('PROTOCOLS')}
            className={`px-2 py-0.5 rounded-xs transition-all cursor-pointer ${
              activeTab === 'PROTOCOLS' ? 'bg-[#00f2ff] text-black font-bold' : 'text-gray-400 hover:text-white'
            }`}
          >
            PROTOCOLOS
          </button>
        </div>
      </div>

      {activeTab === 'TASKS' ? (
        <div className="space-y-2">
          {/* Progress Bar */}
          <div className="space-y-1 font-mono text-[8px]">
            <div className="flex justify-between text-gray-400">
              <span>PROGRESO DE MISIÓN</span>
              <span className="text-[#00f2ff] font-bold">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-black border border-[#00f2ff33] rounded-xs overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#00f2ff] to-emerald-400 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Add Task Input */}
          <form onSubmit={addTask} className="flex items-center gap-1">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Nueva tarea / objetivo..."
              className="flex-1 bg-black border border-[#00f2ff33] px-2 py-1 text-[9px] font-mono text-white focus:outline-none focus:border-[#00f2ff] rounded-xs"
            />
            <button
              type="submit"
              className="p-1 bg-[#00f2ff] hover:bg-cyan-300 text-black rounded-xs cursor-pointer"
              title="Añadir tarea"
            >
              <Plus className="w-3.5 h-3.5 font-bold" />
            </button>
          </form>

          {/* Task List */}
          <div className="max-h-32 overflow-y-auto space-y-1 pr-1 font-mono text-[9px] scrollbar-thin scrollbar-thumb-[#00f2ff33]">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-1.5 rounded-xs border transition-all ${
                  task.completed
                    ? 'bg-black/40 border-[#00f2ff15] opacity-60'
                    : 'bg-black/70 border-[#00f2ff33] hover:border-[#00f2ff]'
                }`}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  className="flex items-center gap-1.5 flex-1 cursor-pointer overflow-hidden"
                >
                  {task.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-gray-500 hover:text-[#00f2ff] flex-shrink-0" />
                  )}
                  <span className={`truncate ${task.completed ? 'line-through text-gray-400' : 'text-gray-200'}`}>
                    {task.text}
                  </span>
                </div>

                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-gray-500 hover:text-red-400 ml-1 p-0.5 cursor-pointer"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
            {tasks.length === 0 && (
              <div className="text-center text-gray-500 text-[8px] py-2">
                No hay objetivos activos. Añade uno arriba.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Stark Protocol Macros */
        <div className="space-y-1.5 font-mono text-[9px]">
          <div className="text-[8px] text-gray-400 uppercase">MACROS STARK DE UN TOQUE:</div>
          
          <button
            onClick={() => triggerProtocol('Protocolo Trabajo', 'Abriendo entorno de desarrollo, VS Code y navegador.')}
            className="w-full p-1.5 bg-black/70 border border-[#00f2ff44] hover:border-[#00f2ff] hover:bg-[#00f2ff15] rounded-xs flex items-center justify-between text-left cursor-pointer transition-all text-gray-200 hover:text-white"
          >
            <div className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span className="font-bold">PROTOCOLO TRABAJO</span>
            </div>
            <span className="text-[8px] text-cyan-400">EJECUTAR</span>
          </button>

          <button
            onClick={() => triggerProtocol('Protocolo Focus / Concentración', 'Activando sintetizador de audio de concentración y temporizador Pomodoro.')}
            className="w-full p-1.5 bg-black/70 border border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/10 rounded-xs flex items-center justify-between text-left cursor-pointer transition-all text-gray-200 hover:text-white"
          >
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">MODO FOCUS 25M</span>
            </div>
            <span className="text-[8px] text-emerald-400">ACTIVAR</span>
          </button>

          <button
            onClick={() => triggerProtocol('Protocolo Sigilo / Privacidad', 'Silenciando respuestas de voz y restringiendo telemetría visual.')}
            className="w-full p-1.5 bg-black/70 border border-purple-500/40 hover:border-purple-400 hover:bg-purple-500/10 rounded-xs flex items-center justify-between text-left cursor-pointer transition-all text-gray-200 hover:text-white"
          >
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" />
              <span className="font-bold">MODO SIGILO</span>
            </div>
            <span className="text-[8px] text-purple-400">ACTIVAR</span>
          </button>
        </div>
      )}
    </div>
  );
};
