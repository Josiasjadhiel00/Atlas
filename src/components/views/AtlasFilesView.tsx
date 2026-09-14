import React, { useState } from 'react';
import { 
  Folder, Laptop, FileCode, ExternalLink, Plus, HardDrive, 
  Terminal, CheckCircle2, AlertTriangle, ShieldCheck, File, FolderPlus 
} from 'lucide-react';
import { sciFiAudio } from '../../utils/audioSynth';

interface AtlasFilesViewProps {
  onExecuteAction: (action: string, params: any) => Promise<any>;
  onOpenBridgeModal: () => void;
  bridgeStatus: 'checking' | 'connected' | 'offline';
}

export const AtlasFilesView: React.FC<AtlasFilesViewProps> = ({
  onExecuteAction,
  onOpenBridgeModal,
  bridgeStatus
}) => {
  const [activeFolder, setActiveFolder] = useState('Workspace');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const folders = [
    { name: 'Workspace', count: 18, size: '24.5 MB' },
    { name: 'Projects', count: 6, size: '1.2 GB' },
    { name: 'Documents', count: 12, size: '8.4 MB' },
    { name: 'Desktop', count: 8, size: '142 MB' },
    { name: 'Atlas_Core', count: 32, size: '48.1 MB' }
  ];

  const filesInActiveFolder = [
    { name: 'server.ts', type: 'typescript', size: '34.1 KB', modified: 'Hoy a las 11:20' },
    { name: 'LiveHudSimulator.tsx', type: 'react', size: '97.4 KB', modified: 'Hoy a las 11:45' },
    { name: 'AtlasDashboard.tsx', type: 'react', size: '43.6 KB', modified: 'Hoy a las 12:10' },
    { name: 'package.json', type: 'json', size: '1.8 KB', modified: 'Ayer' },
    { name: 'metadata.json', type: 'json', size: '467 B', modified: 'Hoy' },
    { name: 'local_bridge.py', type: 'python', size: '4.2 KB', modified: 'Esta semana' }
  ];

  const handleLaunchApp = async (appName: string) => {
    sciFiAudio.playConfirmSound();
    setActionFeedback(`Ejecutando orden para abrir ${appName}...`);
    try {
      const res = await onExecuteAction('open_app', { name: appName });
      if (res?.success) {
        setActionFeedback(`✔ ${appName} ejecutado con éxito en tu ordenador.`);
      } else {
        setActionFeedback(`⚠️ No se pudo contactar con el puente local para abrir ${appName}.`);
      }
    } catch {
      setActionFeedback(`⚠️ Error al intentar lanzar ${appName}.`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  const handleCreateFolder = async () => {
    sciFiAudio.playConfirmSound();
    const folderName = `Atlas_Proyectos_${Math.floor(Math.random() * 1000)}`;
    setActionFeedback(`Creando carpeta ${folderName} en el disco local...`);
    try {
      const res = await onExecuteAction('create_folder', { name: folderName });
      if (res?.success) {
        setActionFeedback(`✔ Carpeta '${folderName}' creada exitosamente en tu PC.`);
      } else {
        setActionFeedback(`⚠️ Inicia el script local_bridge.py para crear carpetas en tu sistema.`);
      }
    } catch {
      setActionFeedback(`⚠️ Error al crear la carpeta en el sistema local.`);
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      
      {/* Header */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 lg:p-5 flex flex-wrap items-center justify-between gap-4 shadow-[0_0_25px_rgba(0,242,255,0.08)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00f2ff15] border border-[#00f2ff44] flex items-center justify-center text-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.2)]">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">SISTEMA DE ARCHIVOS & PUENTE LOCAL DEL ORDENADOR</h2>
            <p className="text-[11px] text-slate-400">
              Interacción directa con el sistema operativo local con listas blancas de seguridad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              onOpenBridgeModal();
            }}
            className="px-3.5 py-2 bg-[#00f2ff15] hover:bg-[#00f2ff33] border border-[#00f2ff] text-[#00f2ff] text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,242,255,0.2)]"
          >
            <Laptop className="w-4 h-4" />
            <span>Configurar Puente Local</span>
          </button>
        </div>
      </div>

      {/* Quick OS Launcher Actions */}
      <div className="bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Laptop className="w-4 h-4 text-[#00f2ff]" />
            Acciones Rápidas en tu PC Local
          </h3>
          {actionFeedback && (
            <span className="text-xs font-mono text-[#00f2ff] bg-[#00f2ff15] border border-[#00f2ff44] px-2.5 py-0.5 rounded-full animate-pulse">
              {actionFeedback}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          <button
            onClick={() => handleLaunchApp('code')}
            className="p-3 bg-[#03091e] hover:bg-[#091533] border border-[#00f2ff22] hover:border-[#00f2ff] rounded-xl flex items-center gap-3 transition-all cursor-pointer group text-left shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-[#00f2ff15] border border-[#00f2ff44] text-[#00f2ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#00f2ff]">Abrir VS Code</div>
              <div className="text-[10px] text-slate-400">Editor de código</div>
            </div>
          </button>

          <button
            onClick={() => handleLaunchApp('chrome')}
            className="p-3 bg-[#03091e] hover:bg-[#091533] border border-[#00f2ff22] hover:border-[#00f2ff] rounded-xl flex items-center gap-3 transition-all cursor-pointer group text-left shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-[#10b98115] border border-[#10b98144] text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-emerald-400">Abrir Chrome</div>
              <div className="text-[10px] text-slate-400">Navegador web</div>
            </div>
          </button>

          <button
            onClick={handleCreateFolder}
            className="p-3 bg-[#03091e] hover:bg-[#091533] border border-[#00f2ff22] hover:border-[#00f2ff] rounded-xl flex items-center gap-3 transition-all cursor-pointer group text-left shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-[#f59e0b15] border border-[#f59e0b44] text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-amber-300">Crear Carpeta</div>
              <div className="text-[10px] text-slate-400">En disco local</div>
            </div>
          </button>

          <button
            onClick={() => handleLaunchApp('terminal')}
            className="p-3 bg-[#03091e] hover:bg-[#091533] border border-[#00f2ff22] hover:border-[#00f2ff] rounded-xl flex items-center gap-3 transition-all cursor-pointer group text-left shadow-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-[#a855f715] border border-[#a855f744] text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white group-hover:text-purple-400">Abrir Terminal</div>
              <div className="text-[10px] text-slate-400">Línea de comandos</div>
            </div>
          </button>
        </div>
      </div>

      {/* Main File Explorer Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        
        {/* Left Side: Directory Tree */}
        <div className="lg:col-span-4 bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-[#00f2ff]" />
            Directorios del Sistema
          </h3>

          <div className="space-y-1.5">
            {folders.map((f) => {
              const isSelected = activeFolder === f.name;
              return (
                <button
                  key={f.name}
                  onClick={() => {
                    sciFiAudio.playBlip();
                    setActiveFolder(f.name);
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#00f2ff15] border-[#00f2ff] text-white shadow-[0_0_15px_rgba(0,242,255,0.2)]'
                      : 'bg-[#03091e] border-transparent hover:border-[#00f2ff33] text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Folder className={`w-4 h-4 ${isSelected ? 'text-[#00f2ff]' : 'text-slate-500'}`} />
                    <span className="text-xs font-bold font-mono">{f.name}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {f.count} elementos
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: File Items in Selected Directory */}
        <div className="lg:col-span-8 bg-[#050b1d]/85 border border-[#00f2ff22] rounded-2xl p-4 lg:p-5 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#00f2ff] font-bold">RUTA: ~/{activeFolder}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> ACCESO SEGURO
            </span>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto">
            {filesInActiveFolder.map((file, idx) => (
              <div
                key={idx}
                className="p-3 bg-[#03091e] hover:bg-[#071330] border border-white/5 hover:border-[#00f2ff44] rounded-xl flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00f2ff10] border border-[#00f2ff33] flex items-center justify-center text-[#00f2ff]">
                    {file.type === 'typescript' || file.type === 'react' ? <FileCode className="w-4 h-4" /> : <File className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-mono group-hover:text-[#00f2ff] transition-colors">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Modificado: {file.modified}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-slate-300">{file.size}</div>
                  <div className="text-[9px] font-mono text-emerald-400">VERIFICADO</div>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>

    </div>
  );
};
