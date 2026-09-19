import React, { useState } from 'react';
import { 
  Home, MessageSquare, Search, FolderArchive, CheckSquare, Brain, 
  Folder, Eye, Settings, Bell, Minus, Square, X, Maximize2, Minimize2,
  Mic, MicOff, Globe, Code, Image as ImageIcon, Briefcase, ListTodo,
  Terminal, ChevronRight, Check, Sparkles, Radio, Cpu, Wifi,
  Laptop, ExternalLink, RefreshCw, UploadCloud, Layers, User, Bot,
  QrCode, Smartphone
} from 'lucide-react';
import { PairMobileModal } from './modals/PairMobileModal';
import { PWAInstallButton } from './common/PWAInstallButton';
import { 
  AssistantState, AssistantTheme, AssistantVoiceName, 
  SmartMemory, ProjectTask, AssistantLogEntry, WebSearchResult, VoiceSettings,
  CustomApplication, CustomFunction
} from '../types';
import { AtlasHoloSphere } from './AtlasHoloSphere';
import { AtlasAudioDock } from './AtlasAudioDock';
import { sciFiAudio } from '../utils/audioSynth';
import { AtlasConversationView } from './views/AtlasConversationView';
import { AtlasResearchView } from './views/AtlasResearchView';
import { AtlasProjectsView } from './views/AtlasProjectsView';
import { AtlasTasksView } from './views/AtlasTasksView';
import { AtlasMemoryView } from './views/AtlasMemoryView';
import { AtlasFilesView } from './views/AtlasFilesView';
import { AtlasVisionView } from './views/AtlasVisionView';
import { AtlasDevicesView } from './views/AtlasDevicesView';
import { CustomAppsAndFunctionsConfig } from './CustomAppsAndFunctionsConfig';

interface AtlasDashboardProps {
  theme: AssistantTheme;
  assistantName: AssistantVoiceName;
  state: AssistantState;
  voiceVolume: number;
  isListening: boolean;
  command: string;
  onCommandChange: (val: string) => void;
  onExecuteCommand: (cmd?: string) => void;
  onToggleMic: () => void;
  onOpenSettings: () => void;
  onOpenBridgeModal: () => void;
  volumeLevel: number;
  onChangeVolume: (val: number) => void;
  tasks: ProjectTask[];
  onToggleTask: (taskId: string) => void;
  memories: SmartMemory[];
  logs: AssistantLogEntry[];
  userName?: string;
  activeNav: string;
  onSelectNav: (nav: string) => void;
  onQuickAction: (actionType: string) => void;
  onSearchSubmit: (queryText: string) => void;
  onImageSelected: (file: File) => void;
  voiceSettings?: VoiceSettings;
  activeModel?: string;
  searchResults?: WebSearchResult[];
  onExecuteBridgeAction?: (action: string, params: any) => Promise<any>;
  onAddMemory?: (title: string, content: string, category?: string) => void;
  onDeleteMemory?: (id: string) => void;
  onAddNewTask?: (title: string, priority: 'low' | 'medium' | 'high') => void;
  onRunProtocol?: (protocolName: string) => void;
  bridgeStatus?: 'checking' | 'connected' | 'offline';
  isWsConnected?: boolean;
  onClearLogs?: () => void;
  customApps?: CustomApplication[];
  onUpdateCustomApps?: (apps: CustomApplication[]) => void;
  customFunctions?: CustomFunction[];
  onUpdateCustomFunctions?: (funcs: CustomFunction[]) => void;
  onTestAppOrFunction?: (name: string, type: 'app' | 'function') => void;
}

export const AtlasDashboard: React.FC<AtlasDashboardProps> = ({
  theme,
  assistantName,
  state,
  voiceVolume,
  isListening,
  command,
  onCommandChange,
  onExecuteCommand,
  onToggleMic,
  onOpenSettings,
  onOpenBridgeModal,
  volumeLevel,
  onChangeVolume,
  tasks,
  onToggleTask,
  memories,
  logs,
  userName = 'Josías',
  activeNav,
  onSelectNav,
  onQuickAction,
  onSearchSubmit,
  onImageSelected,
  voiceSettings,
  activeModel = 'gemini-3.8-flash',
  searchResults = [],
  onExecuteBridgeAction,
  onAddMemory,
  onDeleteMemory,
  onAddNewTask,
  onRunProtocol,
  bridgeStatus = 'offline',
  isWsConnected = false,
  onClearLogs,
  customApps = [],
  onUpdateCustomApps,
  customFunctions = [],
  onUpdateCustomFunctions,
  onTestAppOrFunction
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [realStatus, setRealStatus] = useState<any>(null);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/core/status');
        const data = await res.json();
        if (data.success && data.status) {
          setRealStatus(data.status);
        }
      } catch {
        // Fallback silencioso
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullScreen = () => {
    sciFiAudio.playBlip();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Extract latest speech message for the greeting bubble
  const latestAssistantMessage = logs
    .filter(l => l.sender === assistantName || l.sender === 'SYSTEM')
    .slice(-1)[0]?.text;

  const displayGreeting = latestAssistantMessage && !latestAssistantMessage.includes('[') 
    ? latestAssistantMessage 
    : `“Hola, ${userName}. Estoy aquí para ayudarte. ¿En qué podemos trabajar hoy?”`;

  // Real tasks and memories (sin datos ficticios de prueba)
  const displayTasks = tasks.slice(0, 4);
  const displayMemories = memories.slice(0, 3);

  // Nav items configuration
  const navItems = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'conversacion', label: 'Conversación', icon: MessageSquare },
    { id: 'investigacion', label: 'Investigación', icon: Search },
    { id: 'proyectos', label: 'Proyectos', icon: FolderArchive },
    { id: 'tareas', label: 'Tareas', icon: CheckSquare },
    { id: 'memoria', label: 'Memoria', icon: Brain },
    { id: 'archivos', label: 'Archivos', icon: Folder },
    { id: 'vision', label: 'Visión', icon: Eye },
    { id: 'dispositivos', label: 'Dispositivos', icon: Laptop },
    { id: 'personalizacion', label: 'Apps & Funciones', icon: Cpu },
    { id: 'ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#030712] text-slate-100 font-sans overflow-hidden select-none relative">
      
      {/* Ambient background light spills */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-[#00f2ff12] via-[#3b82f608] to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-20 right-0 w-80 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden File Input for Image Analysis */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onImageSelected(e.target.files[0]);
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 1. LEFT NAVIGATION SIDEBAR                                                */}
      {/* ========================================================================= */}
      <aside className="w-64 min-w-[256px] h-full bg-[#04091a]/95 border-r border-[#00f2ff22] flex flex-col justify-between p-3.5 z-20 backdrop-blur-xl">
        
        {/* Top: Logo & Nav List */}
        <div className="space-y-4">
          
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 py-1.5">
            {/* Stylized triangular A logo */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00f2ff] via-[#2563eb] to-[#1e1b4b] p-[1.5px] shadow-[0_0_15px_rgba(0,242,255,0.4)] flex items-center justify-center">
              <div className="w-full h-full bg-[#030816] rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-[#00f2ff]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 21h4.5l2-4h7l2 4H22L12 2zm0 6l2.3 4.5h-4.6L12 8z" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1">
                A.T.L.A.S. <span className="text-[#00f2ff]">CORE</span>
              </h1>
              <p className="text-[7.5px] tracking-widest text-slate-400 font-mono uppercase">
                AUTONOMOUS TACTICAL LOGIC & ASSISTANCE
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    sciFiAudio.playBlip();
                    if (item.id === 'ajustes') {
                      onOpenSettings();
                    } else {
                      onSelectNav(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00f2ff1a] to-[#3b82f60a] border border-[#00f2ff66] text-white shadow-[0_0_15px_rgba(0,242,255,0.15)] font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00f2ff]' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

        </div>

        {/* Bottom Sidebar: Status, User & Vision Quote */}
        <div className="space-y-3 pt-3 border-t border-[#00f2ff18]">
          
          {/* Status Card */}
          <div className="bg-[#03091e]/80 border border-[#00f2ff33] rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold text-emerald-400">Conectado</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Todos los sistemas activos</span>
          </div>

          {/* User Profile Row */}
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-all text-left cursor-pointer border border-transparent hover:border-[#00f2ff22]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0284c7] to-[#00f2ff] flex items-center justify-center text-xs font-bold text-black shadow-[0_0_10px_rgba(0,242,255,0.4)]">
                {userName ? userName.charAt(0).toUpperCase() : 'J'}
              </div>
              <div>
                <div className="text-xs font-bold text-white">{userName}</div>
                <div className="text-[10px] text-slate-400">Usuario</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>

          {/* Atlas Personality Matrix Badge */}
          <div 
            onClick={() => {
              sciFiAudio.playBlip();
              onOpenSettings();
            }}
            className="rounded-xl border border-[#00f2ff26] bg-[#020817] p-2.5 space-y-1.5 cursor-pointer hover:border-[#00f2ff66] transition-all group"
            title="Ver Matriz de Personalidad de Atlas"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="font-bold text-[#00f2ff] flex items-center gap-1.5 font-mono">
                <Brain className="w-3 h-3 text-[#00f2ff]" />
                PERSONALIDAD ATLAS
              </span>
              <span className="text-[8.5px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono">
                9 RASGOS
              </span>
            </div>
            <div className="flex flex-wrap gap-1 text-[8px] font-mono">
              {['Educado', 'Inteligente', 'Directo', 'Comprensivo', 'Audaz', 'Relajado', 'Introvertido', 'Divertido', 'Autosuficiente'].map((trait, idx) => (
                <span key={idx} className="px-1 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10 group-hover:border-[#00f2ff33] transition-colors">
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Vision Quote Card with Mountain Wallpaper */}
          <div className="relative overflow-hidden rounded-xl border border-[#00f2ff26] bg-[#020817] p-2.5 flex items-center gap-2.5">
            {/* Cinematic Mountain Thumbnail */}
            <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 border border-[#00f2ff33]">
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=150&q=80"
                alt="Mountain wallpaper"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-[9.5px] italic text-slate-300 leading-tight">
                "La información correcta, en el momento correcto."
              </p>
              <span className="text-[8.5px] text-[#00f2ff] font-mono font-bold mt-0.5 block">
                A.T.L.A.S. Core
              </span>
            </div>
          </div>

        </div>

      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN APPLICATION WORKSPACE (TOP BAR + COCKPIT STAGE + FOOTER)          */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* TOP BAR */}
        <header className="h-16 border-b border-[#00f2ff22] bg-[#030819]/80 backdrop-blur-xl px-5 flex items-center justify-between gap-4 z-10 shrink-0">
          
          {/* Left: Avatar & Assistant Online status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0284c7] via-[#00f2ff] to-[#38bdf8] p-[1.5px] flex items-center justify-center shadow-[0_0_12px_rgba(0,242,255,0.4)]">
                <div className="w-full h-full bg-[#030816] rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-[#00f2ff]">A</span>
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#030816]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">ATLAS</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> En línea
                </span>
              </div>
              <p className="text-[10px] text-slate-400 italic">
                *Siempre listo para ayudarte
              </p>
            </div>

            {/* Dynamic Real-Time Agent State Badge */}
            {(() => {
              let label = 'ATLAS • Listo';
              let badgeClass = 'bg-[#00f2ff10] border-[#00f2ff44] text-[#00f2ff]';
              let dotClass = 'bg-emerald-400 animate-pulse';

              if (state === 'listening' || isListening) {
                label = 'ATLAS • Escuchando';
                badgeClass = 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.3)]';
                dotClass = 'bg-amber-400 animate-ping';
              } else if (state === 'thinking') {
                label = 'ATLAS • Procesando';
                badgeClass = 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(0,242,255,0.3)]';
                dotClass = 'bg-cyan-400 animate-pulse';
              } else if (state === 'searching') {
                label = 'ATLAS • Investigando';
                badgeClass = 'bg-indigo-500/25 border-indigo-400 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.3)]';
                dotClass = 'bg-indigo-400 animate-ping';
              } else if (state === 'executing') {
                label = 'ATLAS • Ejecutando acción';
                badgeClass = 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.3)]';
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

              return (
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono ml-2 transition-all duration-300 ${badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${dotClass}`} />
                  <span className="font-semibold tracking-wide">{label}</span>
                </div>
              );
            })()}
          </div>

          {/* Center: Command & Voice Search Input Bar */}
          <div className="flex-1 max-w-xl">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (command.trim()) {
                  onExecuteCommand(command.trim());
                }
              }}
              className="relative flex items-center"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={command}
                onChange={(e) => onCommandChange(e.target.value)}
                placeholder="Habla o escribe tu solicitud..."
                className="w-full bg-[#060e24]/90 border border-[#00f2ff33] focus:border-[#00f2ff] rounded-full py-2 pl-10 pr-11 text-xs text-white placeholder-slate-400 focus:outline-none focus:shadow-[0_0_20px_rgba(0,242,255,0.25)] transition-all font-sans"
              />
              <button
                type="button"
                onClick={onToggleMic}
                title={isListening ? 'Detener escucha' : 'Activar micrófono'}
                className={`absolute right-2 p-1.5 rounded-full transition-all cursor-pointer ${
                  isListening
                    ? 'bg-[#00f2ff] text-black shadow-[0_0_10px_#00f2ff]'
                    : 'text-slate-400 hover:text-[#00f2ff] hover:bg-[#00f2ff15]'
                }`}
              >
                {isListening ? <MicOff className="w-3.5 h-3.5 animate-pulse" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>

          {/* Right: Notifications, Settings, Fullscreen & Window controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Real-time WebSocket Protocol Status Indicator */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-mono transition-all ${
                isWsConnected 
                  ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                  : 'bg-amber-500/10 border-amber-500/35 text-amber-400'
              }`}
              title={isWsConnected ? 'Enlace WebSocket Bidireccional Activo con ATLAS CORE' : 'Conectando al Hub WebSocket...'}
            >
              <span className={`w-2 h-2 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
              <span className="font-semibold">{isWsConnected ? 'WS: EN VIVO' : 'WS: ENLAZANDO'}</span>
            </div>

            {/* PWA In-App Install Button */}
            <PWAInstallButton variant="badge" />

            {/* Mobile Pairing (QR Code) Button */}
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                setIsPairModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00f2ff15] hover:bg-[#00f2ff28] border border-[#00f2ff44] text-[#00f2ff] text-xs font-mono transition-all cursor-pointer shadow-[0_0_10px_rgba(0,242,255,0.15)]"
              title="Vincular Teléfono con Código QR"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden md:inline font-semibold">Vincular Teléfono</span>
            </button>

            {/* Notifications */}
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                setNotificationOpen(!notificationOpen);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 relative cursor-pointer"
              title="Notificaciones"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#00f2ff]" />
            </button>

            {/* Settings */}
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                onOpenSettings();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              title="Ajustes de ATLAS"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullScreen}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer"
              title="Alternar pantalla completa"
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Window control buttons */}
            <div className="hidden lg:flex items-center ml-2 border-l border-[#00f2ff22] pl-2 gap-1">
              <button className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/5 cursor-pointer" title="Minimizar">
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/5 cursor-pointer" title="Maximizar">
                <Square className="w-3 h-3" />
              </button>
              <button className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer" title="Cerrar">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </header>

        {/* MAIN BODY COCKPIT / SUBVIEWS (UNIFIED SCHEME) */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 relative">
          
          {/* 1. INICIO (DASHBOARD TÁCTICO COCKPIT) */}
          {activeNav === 'inicio' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
          
          {/* ========================================================================= */}
          {/* LEFT COLUMN: GREETING BUBBLE & ACCIONES RÁPIDAS (cols 1-3.5)              */}
          {/* ========================================================================= */}
          <div className="xl:col-span-3 flex flex-col space-y-4">
            
            {/* Speech Greeting Card */}
            <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-4 shadow-[0_0_25px_rgba(0,242,255,0.08)] relative">
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff88] to-transparent" />
              <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium">
                {displayGreeting}
              </p>
            </div>

            {/* Acciones Rápidas */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Sparkles className="w-3.5 h-3.5 text-[#00f2ff]" />
                <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Acciones rápidas
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2">
                
                {/* 1. Investigar en Internet */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onQuickAction('investigar');
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#00f2ff15] border border-[#00f2ff44] text-[#00f2ff] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#00f2ff] transition-colors">
                      Investigar en Internet
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Busca información actualizada
                    </div>
                  </div>
                </button>

                {/* 2. Ayudarme a programar */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onQuickAction('programar');
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#8b5cf615] border border-[#8b5cf644] text-[#a78bfa] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Code className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#a78bfa] transition-colors">
                      Ayudarme a programar
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Código, errores, documentación
                    </div>
                  </div>
                </button>

                {/* 3. Analizar una imagen */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    if (fileInputRef.current) {
                      fileInputRef.current.click();
                    }
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#ec489915] border border-[#ec489944] text-[#f472b6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#f472b6] transition-colors">
                      Analizar una imagen
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Imágenes, capturas, documentos
                    </div>
                  </div>
                </button>

                {/* 4. Revisar un proyecto */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onQuickAction('proyecto');
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0284c715] border border-[#0284c744] text-[#38bdf8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#38bdf8] transition-colors">
                      Revisar un proyecto
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Estado, tareas, avances
                    </div>
                  </div>
                </button>

                {/* 5. Organizar mis tareas */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onQuickAction('tareas');
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#10b98115] border border-[#10b98144] text-[#34d399] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#34d399] transition-colors">
                      Organizar mis tareas
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Crea y gestiona tareas
                    </div>
                  </div>
                </button>

                {/* 6. Abrir una aplicación */}
                <button
                  onClick={() => {
                    sciFiAudio.playBlip();
                    onOpenBridgeModal();
                  }}
                  className="w-full bg-[#050c20]/80 hover:bg-[#0b1836] border border-[#00f2ff22] hover:border-[#00f2ff66] rounded-xl p-3 flex items-center gap-3 text-left transition-all cursor-pointer group shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#f59e0b15] border border-[#f59e0b44] text-[#fbbf24] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white group-hover:text-[#fbbf24] transition-colors">
                      Abrir una aplicación
                    </div>
                    <div className="text-[10.5px] text-slate-400">
                      Ejecuta apps de tu sistema
                    </div>
                  </div>
                </button>

              </div>
            </div>

          </div>

          {/* ========================================================================= */}
          {/* CENTER STAGE: 3D HOLOGRAPHIC SPHERE & AUDIO DOCK (cols 4-8.5)              */}
          {/* ========================================================================= */}
          <div className="xl:col-span-5 flex flex-col items-center justify-between min-h-[460px] relative">
            
            {/* Center Core Header Titles */}
            <div className="text-center pt-1 z-10">
              <div className="text-sm font-mono tracking-[0.5em] text-slate-400 uppercase">
                A T L A S
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white mt-0.5">
                A.T.L.A.S. <span className="text-[#00f2ff] drop-shadow-[0_0_10px_#00f2ff]">CORE</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tu asistente de inteligencia artificial
              </p>
            </div>

            {/* The 3D Holographic Sphere with Pedestal */}
            <div className="w-full flex items-center justify-center my-auto relative">
              <AtlasHoloSphere state={state} voiceVolume={voiceVolume} size={360} />
            </div>

            {/* Bottom Audio & Mic Dock */}
            <div className="w-full z-10 pb-1">
              <AtlasAudioDock
                state={state}
                isListening={isListening}
                voiceVolume={voiceVolume}
                onToggleMic={onToggleMic}
                onOpenSettings={onOpenSettings}
                volumeLevel={volumeLevel}
                onChangeVolume={onChangeVolume}
              />
            </div>

          </div>

          {/* ========================================================================= */}
          {/* CENTER-RIGHT: ESTADO DEL SISTEMA & ACTIVIDAD RECIENTE (cols 9-10)          */}
          {/* ========================================================================= */}
          <div className="xl:col-span-2 flex flex-col space-y-4">
            
            {/* Estado del Sistema */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#00f2ff18]">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  ESTADO DEL SISTEMA
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Modelo IA</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 font-mono text-[10.5px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 
                    {realStatus?.aiModel?.provider === 'gemini' ? 'Gemini 2.5 Flash' : (realStatus?.aiModel?.name || activeModel)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Internet</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Conectado
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Micrófono</span>
                  <span className={`font-semibold flex items-center gap-1 ${isListening ? 'text-amber-400' : 'text-emerald-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} /> 
                    {isListening ? 'Escuchando' : 'Listo (Wake: "Atlas")'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Herramientas</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> 
                    {realStatus?.tools?.totalRegistered || 8} Operativas
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Memoria Central</span>
                  <span className="text-[#00f2ff] font-semibold flex items-center gap-1">
                    {realStatus?.memory?.totalItems || memories.length} registros
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-slate-400">Dispositivos</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    {realStatus?.devices?.onlineCount ?? 3} en línea
                  </span>
                </div>
                <div className="flex items-center justify-between py-0.5 border-t border-[#00f2ff15] pt-1.5">
                  <span className="text-slate-400">Latencia Red</span>
                  <span className="text-[#00f2ff] font-mono font-bold">
                    {realStatus?.latencyMs || 21} ms
                  </span>
                </div>
              </div>
            </div>

            {/* Actividad Reciente */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex-1">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#00f2ff18]">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  ACTIVIDAD RECIENTE
                </span>
                <button
                  onClick={() => onSelectNav('conversacion')}
                  className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer"
                >
                  Ver todo &gt;
                </button>
              </div>

              {logs.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1.5">
                  <MessageSquare className="w-5 h-5 text-slate-600" />
                  <span>Sin actividad registrada aún</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {logs.slice(-4).reverse().map((log) => {
                    const isSystem = log.sender === 'SYSTEM';
                    const isUser = log.sender === 'USER';
                    return (
                      <div key={log.id} className="flex items-start gap-2.5">
                        <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                          isUser 
                            ? 'bg-blue-500/20 text-blue-400' 
                            : isSystem 
                            ? 'bg-[#00f2ff15] text-[#00f2ff]' 
                            : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {isUser ? <User className="w-3 h-3" /> : isSystem ? <Terminal className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-white truncate">
                            {isUser ? 'Comando del Usuario' : isSystem ? 'Acción del Sistema' : assistantName}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{log.text}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{log.timestamp}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: BUSCANDO INFO, TAREAS, MEMORIA & VISIÓN (cols 11-12)         */}
          {/* ========================================================================= */}
          <div className="xl:col-span-2 flex flex-col space-y-4">
            
            {/* 1. Buscando información / Web Search Preview */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)] relative overflow-hidden">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span className="text-[11px] font-bold text-slate-300">Buscando información...</span>
              </div>

              {/* Earth / Satellite thumbnail preview */}
              <div className="relative h-16 rounded-xl overflow-hidden mb-2.5 border border-[#00f2ff33]">
                <img
                  src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80"
                  alt="Earth from space"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent" />
                <div className="absolute bottom-1 left-2 text-[10px] text-cyan-300 font-mono font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f2ff] animate-ping" />
                  RED GLOBAL SATELITAL
                </div>
              </div>

              {/* Search query box */}
              <div className="bg-black/60 border border-[#00f2ff44] rounded-lg px-2 py-1.5 flex items-center justify-between text-[11px] text-slate-200">
                <input
                  type="text"
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchInputValue.trim()) {
                      onSearchSubmit(searchInputValue.trim());
                    }
                  }}
                  placeholder="Investigar en internet..."
                  className="bg-transparent border-none outline-none text-white text-[11px] placeholder:text-slate-500 w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (searchInputValue.trim()) {
                      onSearchSubmit(searchInputValue.trim());
                    }
                  }}
                  className="text-[#00f2ff] hover:text-white cursor-pointer ml-1 text-sm font-bold"
                >
                  »
                </button>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                <div className="bg-gradient-to-r from-[#00f2ff] to-[#3b82f6] h-full w-4/5 rounded-full animate-pulse shadow-[0_0_8px_#00f2ff]" />
              </div>

              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
                <Globe className="w-3 h-3 text-[#00f2ff]" />
                <span>{searchResults.length > 0 ? `${searchResults.length} fuentes consultadas` : 'Listo para investigar'}</span>
              </div>
            </div>

            {/* 2. TAREAS */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#00f2ff18]">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    TAREAS
                  </span>
                </div>
                <button
                  onClick={() => onSelectNav('tareas')}
                  className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer"
                >
                  Ver todo &gt;
                </button>
              </div>

              {displayTasks.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                  <CheckSquare className="w-5 h-5 text-slate-600" />
                  <span>Sin tareas pendientes</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        sciFiAudio.playBlip();
                        onToggleTask(t.id);
                      }}
                      className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/5 transition-all cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          t.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-400 text-black'
                            : 'border-slate-500 bg-black/40'
                        }`}>
                          {t.status === 'completed' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className={`truncate ${t.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {t.title}
                        </span>
                      </div>

                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ml-1 ${
                        t.priority === 'high'
                          ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                          : t.priority === 'medium'
                          ? 'bg-amber-950/80 text-amber-400 border border-amber-500/40'
                          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                      }`}>
                        {t.priority === 'high' ? 'Alta' : t.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. MEMORIA ACTIVA */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-[#00f2ff18]">
                <div className="flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-[#00f2ff]" />
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    MEMORIA ACTIVA
                  </span>
                </div>
                <button
                  onClick={() => onSelectNav('memoria')}
                  className="text-[10px] text-[#00f2ff] hover:underline cursor-pointer"
                >
                  Ver todas &gt;
                </button>
              </div>

              {displayMemories.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-1">
                  <Brain className="w-5 h-5 text-slate-600" />
                  <span>Sin memorias guardadas</span>
                </div>
              ) : (
                <div className="space-y-1.5 text-xs text-slate-300">
                  {displayMemories.map((m) => (
                    <div key={m.id} className="flex items-start gap-1.5">
                      <span className="text-[#00f2ff] font-bold">•</span>
                      <span className="text-[11px] leading-snug">{m.content || m.topic}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. VISIÓN ARTIFICIAL */}
            <div className="bg-[#050c20]/80 border border-[#00f2ff26] rounded-2xl p-3.5 shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-[#00f2ff]" />
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  VISIÓN ARTIFICIAL
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mb-2">
                Analiza imágenes, capturas o documentos
              </p>

              {/* Upload Dropzone */}
              <div
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    onImageSelected(e.dataTransfer.files[0]);
                  }
                }}
                className="border border-dashed border-[#00f2ff55] hover:border-[#00f2ff] rounded-xl p-3 text-center bg-black/40 hover:bg-[#00f2ff0d] transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group"
              >
                <UploadCloud className="w-5 h-5 text-[#00f2ff] group-hover:scale-110 transition-transform" />
                <span className="text-[10px] text-slate-300 font-medium">
                  Arrastra una imagen aquí o haz clic para subir
                </span>
              </div>
            </div>

          </div>
          </div>
          )}

          {/* 2. CONVERSACIÓN */}
          {activeNav === 'conversacion' && (
            <AtlasConversationView
              logs={logs}
              assistantName={assistantName}
              state={state}
              isListening={isListening}
              onToggleMic={onToggleMic}
              onSendCommand={(cmd) => onExecuteCommand(cmd)}
              voiceSettings={voiceSettings || { pitch: 0.9, rate: 1.05, volume: volumeLevel, voiceURI: '', lang: 'es-ES', autoSpeak: true, continuousConversation: false, interruptOnSpeech: true }}
              activeModel={activeModel}
              onClearLogs={onClearLogs}
            />
          )}

          {/* 3. INVESTIGACIÓN */}
          {activeNav === 'investigacion' && (
            <AtlasResearchView
              onSearch={(q) => onSearchSubmit(q)}
              searchResults={searchResults}
              isSearching={state === 'executing'}
            />
          )}

          {/* 4. PROYECTOS */}
          {activeNav === 'proyectos' && (
            <AtlasProjectsView
              onOpenVsCode={() => onExecuteBridgeAction ? onExecuteBridgeAction('open_app', { name: 'code' }) : onOpenBridgeModal()}
              onExecuteCommand={(cmd) => onExecuteCommand(cmd)}
            />
          )}

          {/* 5. TAREAS */}
          {activeNav === 'tareas' && (
            <AtlasTasksView
              tasks={tasks}
              onToggleTask={onToggleTask}
              assistantName={assistantName}
              onRunProtocol={onRunProtocol}
              onAddNewTask={onAddNewTask}
            />
          )}

          {/* 6. MEMORIA */}
          {activeNav === 'memoria' && (
            <AtlasMemoryView
              memories={memories}
              onAddMemory={onAddMemory}
              onDeleteMemory={onDeleteMemory}
            />
          )}

          {/* 7. ARCHIVOS */}
          {activeNav === 'archivos' && (
            <AtlasFilesView
              onExecuteAction={onExecuteBridgeAction || (async () => ({}))}
              onOpenBridgeModal={onOpenBridgeModal}
              bridgeStatus={bridgeStatus}
            />
          )}

          {/* 8. VISIÓN */}
          {activeNav === 'vision' && (
            <AtlasVisionView
              onImageSelected={onImageSelected}
            />
          )}

          {/* 9. DISPOSITIVOS (TOPOLOGÍA MULTIPLATAFORMA) */}
          {activeNav === 'dispositivos' && (
            <AtlasDevicesView
              onDispatchAction={async (deviceId, action, params) => {
                const res = await fetch(`/api/core/devices/${deviceId}/action`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action, parameters: params })
                });
                return res.json();
              }}
            />
          )}

          {/* 10. APPS Y FUNCIONES PERSONALIZADAS */}
          {activeNav === 'personalizacion' && (
            <div className="bg-[#050b1d]/85 border border-[#00f2ff33] rounded-2xl p-4 lg:p-6 shadow-[0_0_30px_rgba(0,242,255,0.08)]">
              <CustomAppsAndFunctionsConfig
                customApps={customApps || []}
                onUpdateCustomApps={onUpdateCustomApps || (() => {})}
                customFunctions={customFunctions || []}
                onUpdateCustomFunctions={onUpdateCustomFunctions || (() => {})}
                onTestAppOrFunction={onTestAppOrFunction}
              />
            </div>
          )}

        </div>

        {/* MOBILE BOTTOM NAVIGATION DOCK (lg:hidden) */}
        <div className="lg:hidden border-t border-[#00f2ff22] bg-[#030819]/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around z-20 shrink-0">
          {[
            { id: 'inicio', label: 'Inicio', icon: Home },
            { id: 'chat', label: 'Voz / Chat', icon: MessageSquare },
            { id: 'tareas', label: 'Tareas', icon: CheckSquare },
            { id: 'proyectos', label: 'Proyectos', icon: FolderArchive },
            { id: 'dispositivos', label: 'Dispositivos', icon: Smartphone },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeNav === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sciFiAudio.playBlip();
                  onSelectNav(tab.id);
                }}
                className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'text-[#00f2ff] font-bold bg-[#00f2ff15]'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#00f2ff]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* BOTTOM STATUS FOOTER */}
        <footer className="h-9 border-t border-[#00f2ff22] bg-[#020617] px-5 flex items-center justify-between text-xs font-mono text-slate-400 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[#00f2ff] font-bold">⚛️ ATLAS v2.0</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Gemini Live
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">Conexión estable</span>
          </div>

          <div className="flex items-center gap-2 text-[11px] tracking-wider text-slate-400">
            <span>Piensa • Investiga • Crea • Avanza</span>
            <span className="w-4 h-4 rounded bg-[#00f2ff22] text-[#00f2ff] flex items-center justify-center font-bold text-[9px]">
              A
            </span>
          </div>
        </footer>

      </div>

      {/* Modal de Vinculación Móvil con Código QR */}
      <PairMobileModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
      />

    </div>
  );
};
