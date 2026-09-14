import React, { useState } from 'react';
import { 
  FolderArchive, GitBranch, Code, Laptop, ExternalLink, Plus, 
  CheckCircle2, Clock, AlertCircle, Play, FileText, Terminal, Layers
} from 'lucide-react';
import { sciFiAudio } from '../../utils/audioSynth';

interface AtlasProjectsViewProps {
  onOpenVsCode?: () => void;
  onExecuteCommand?: (cmd: string) => void;
}

export const AtlasProjectsView: React.FC<AtlasProjectsViewProps> = ({
  onOpenVsCode,
  onExecuteCommand
}) => {
  const [selectedProject, setSelectedProject] = useState('atlas-core');

  const projects = [
    {
      id: 'atlas-core',
      name: 'A.T.L.A.S. Core // AI Assistant 2.0',
      description: 'Núcleo de inteligencia artificial autónomo con interfaz táctica HUD, Google Gemini, Ollama y control del sistema operativo.',
      techStack: ['React 18', 'TypeScript', 'Node.js', 'Gemini API', 'Tailwind CSS', 'Firebase'],
      progress: 96,
      status: 'active' as const,
      branch: 'main',
      filesCount: 42,
      lastCommit: 'Hace 5 minutos'
    },
    {
      id: 'saas-engine',
      name: 'Plataforma SaaS Microservicios',
      description: 'Backend escalable con API REST, WebSockets en tiempo real y autenticación OAuth para aplicaciones multi-inquilino.',
      techStack: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'Redis'],
      progress: 74,
      status: 'active' as const,
      branch: 'feature/auth-v2',
      filesCount: 88,
      lastCommit: 'Ayer a las 18:30'
    },
    {
      id: 'desktop-bridge',
      name: 'Puente Local de Escritorio (OS Bridge)',
      description: 'Script ligero de Python y FastAPI para enlazar el navegador con el sistema operativo local con listas blancas de seguridad.',
      techStack: ['Python 3.11', 'FastAPI', 'Subprocess', 'Sockets'],
      progress: 88,
      status: 'active' as const,
      branch: 'main',
      filesCount: 14,
      lastCommit: 'Hace 2 horas'
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">GESTIÓN DE PROYECTOS & ENTORNO DE DESARROLLO</h2>
            <p className="text-[11px] text-slate-400">
              Espacio de trabajo para repositorio de código, dependencias y telemetría de compilación
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenVsCode && (
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                onOpenVsCode();
              }}
              className="px-3.5 py-2 bg-[#00f2ff15] hover:bg-[#00f2ff33] border border-[#00f2ff] text-[#00f2ff] text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
            >
              <Laptop className="w-4 h-4" />
              <span>Abrir VS Code</span>
            </button>
          )}

          <button
            onClick={() => {
              sciFiAudio.playBlip();
              if (onExecuteCommand) {
                onExecuteCommand('Crea un nuevo proyecto en la carpeta Proyectos llamado nuevo_proyecto');
              }
            }}
            className="px-4 py-2 bg-[#00f2ff] hover:bg-[#38bdf8] text-black text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(0,242,255,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {projects.map((proj) => {
          const isSelected = selectedProject === proj.id;
          return (
            <div
              key={proj.id}
              onClick={() => {
                sciFiAudio.playBlip();
                setSelectedProject(proj.id);
              }}
              className={`bg-[#050b1d]/85 rounded-2xl p-4 border transition-all cursor-pointer space-y-3 relative group ${
                isSelected
                  ? 'border-[#00f2ff] shadow-[0_0_25px_rgba(0,242,255,0.15)]'
                  : 'border-[#00f2ff22] hover:border-[#00f2ff66]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Activo</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <GitBranch className="w-3 h-3 text-[#00f2ff]" />
                  <span>{proj.branch}</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#00f2ff] transition-colors">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed font-sans">
                  {proj.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-slate-400">Progreso general</span>
                  <span className="text-[#00f2ff] font-bold">{proj.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-[#00f2ff22]">
                  <div
                    className="h-full bg-gradient-to-r from-[#0284c7] to-[#00f2ff] rounded-full transition-all duration-500 shadow-[0_0_10px_#00f2ff]"
                    style={{ width: `${proj.progress}%` }}
                  />
                </div>
              </div>

              {/* Tech stack chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {proj.techStack.map((tech, idx) => (
                  <span
                    key={idx}
                    className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-[#03091e] border border-[#00f2ff22] text-slate-300"
                  >
                    {tech}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>{proj.filesCount} archivos</span>
                <span>{proj.lastCommit}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Project Deep Dive & Terminal */}
      <div className="flex-1 bg-[#050b1d]/85 border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-3">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-[#00f2ff]" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Consola del Proyecto // {selectedProject.toUpperCase()}
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> AMBIENTE SINCRONIZADO
          </span>
        </div>

        <div className="bg-black/80 border border-[#00f2ff33] rounded-xl p-4 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-[#00f2ff] flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>atlas@devbox:~/workspace/projects/{selectedProject}$ npm run dev</span>
          </div>
          <div className="text-slate-400 pl-5 text-[11px] space-y-1">
            <p>✔ Vite v5.4.15 compilado en modo desarrollo con soporte HMR.</p>
            <p>✔ Servidor local activo escuchando en puerto 3000.</p>
            <p>✔ Enlace de inteligencia artificial Gemini 3.8 Flash activo.</p>
            <p className="text-emerald-400">✔ Base de datos Firestore conectada con sincronización en tiempo real.</p>
          </div>
        </div>
      </div>

    </div>
  );
};
