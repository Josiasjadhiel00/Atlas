import React, { useState } from 'react';
import { 
  AppWindow, Play, Plus, Trash2, Check, Sparkles, Terminal, 
  ExternalLink, Layers, ShieldAlert, Cpu, Wrench, RefreshCw, 
  HelpCircle, CheckCircle2, ChevronRight, Laptop
} from 'lucide-react';
import { CustomApplication, CustomFunction } from '../types';
import { sciFiAudio } from '../utils/audioSynth';

interface CustomAppsAndFunctionsConfigProps {
  customApps: CustomApplication[];
  onUpdateCustomApps: (apps: CustomApplication[]) => void;
  customFunctions: CustomFunction[];
  onUpdateCustomFunctions: (funcs: CustomFunction[]) => void;
  onTestAppOrFunction?: (name: string, type: 'app' | 'function') => void;
  onSaveToCloud?: () => void;
}

// Preset application catalog for 1-click addition
const APP_PRESETS: Omit<CustomApplication, 'id'>[] = [
  {
    name: 'Discord',
    target: 'discord',
    description: 'Comunicaciones de voz y texto para equipos y comunidades.',
    voiceAliases: ['abre discord', 'inicia discord', 'comunidad discord'],
    category: 'work',
    enabled: true
  },
  {
    name: 'Steam',
    target: 'steam',
    description: 'Plataforma de videojuegos y distribución digital.',
    voiceAliases: ['abre steam', 'inicia steam', 'modo juegos', 'biblioteca de juegos'],
    category: 'games',
    enabled: true
  },
  {
    name: 'Photoshop',
    target: 'photoshop',
    description: 'Suite de edición gráfica y retoque fotográfico.',
    voiceAliases: ['abre photoshop', 'inicia photoshop', 'edicion de fotos', 'diseño'],
    category: 'creative',
    enabled: true
  },
  {
    name: 'Blender',
    target: 'blender',
    description: 'Software de renderizado, modelado 3D y animación.',
    voiceAliases: ['abre blender', 'inicia blender', 'render 3d', 'modelado'],
    category: 'creative',
    enabled: true
  },
  {
    name: 'Notion',
    target: 'https://notion.so',
    description: 'Workspace todo-en-uno de notas, proyectos y documentación.',
    voiceAliases: ['abre notion', 'inicia notion', 'mis notas', 'organizador'],
    category: 'work',
    enabled: true
  },
  {
    name: 'Figma',
    target: 'https://figma.com',
    description: 'Herramienta colaborativa de diseño de interfaces y prototipos.',
    voiceAliases: ['abre figma', 'inicia figma', 'diseño ui', 'prototipo'],
    category: 'creative',
    enabled: true
  },
  {
    name: 'OBS Studio',
    target: 'obs64',
    description: 'Software de grabación de pantalla y transmisiones en vivo.',
    voiceAliases: ['abre obs', 'inicia grabacion', 'obs studio', 'streaming'],
    category: 'creative',
    enabled: true
  },
  {
    name: 'PowerShell / Terminal',
    target: 'powershell',
    description: 'Consola de comandos del sistema operativo.',
    voiceAliases: ['abre terminal', 'abre powershell', 'consola', 'linea de comandos'],
    category: 'dev',
    enabled: true
  }
];

// Preset tactical routines for 1-click addition
const FUNCTION_PRESETS: Omit<CustomFunction, 'id'>[] = [
  {
    name: 'modo_estudio',
    title: 'Modo Estudio y Concentración',
    triggerPhrases: ['activa modo estudio', 'iniciar sesion de estudio', 'modo concentracion', 'a estudiar'],
    description: 'Prepara el entorno para alta concentración, silencia alertas y fija temporizador.',
    actionType: 'macro_sequence',
    payload: {
      appTarget: 'spotify',
      macroSteps: ['Abre Spotify con música Lo-Fi', 'Activa temporizador de 25 min', 'Silencia notificaciones'],
      customSpeech: 'Modo estudio y concentración activado, Comandante. Entorno optimizado para máximo enfoque.'
    },
    requireConfirmation: false,
    enabled: true
  },
  {
    name: 'modo_desarrollo',
    title: 'Modo Desarrollo y Programación',
    triggerPhrases: ['modo desarrollo', 'iniciar programacion', 'a programar', 'entorno de codigo'],
    description: 'Abre el editor de código, despliega la consola y prepara telemetría.',
    actionType: 'macro_sequence',
    payload: {
      appTarget: 'code',
      macroSteps: ['Despliega VS Code', 'Abre terminal de desarrollo', 'Inicia monitoreo de CPU'],
      customSpeech: 'Modo desarrollo inicializado. Editor de código y terminal desplegados en pantalla.'
    },
    requireConfirmation: false,
    enabled: true
  },
  {
    name: 'inspeccion_sistema',
    title: 'Diagnóstico Táctico Completo',
    triggerPhrases: ['diagnostico completo', 'analisis general', 'revisa el sistema', 'informe total'],
    description: 'Comprueba el estado del procesador, memorias neuronales y latencia de red.',
    actionType: 'custom_speech',
    payload: {
      customSpeech: 'Ejecutando diagnóstico integral de A.T.L.A.S. Núcleo al 100%, telemetría nominal y protocolos de seguridad en línea.'
    },
    requireConfirmation: false,
    enabled: true
  },
  {
    name: 'modo_descanso',
    title: 'Protocolo de Suspensión / Standby',
    triggerPhrases: ['modo descanso', 'apagar entorno', 'hasta luego atlas', 'buenas noches atlas'],
    description: 'Pone los módulos de escucha en vigilancia pasiva y reduce consumo de energía.',
    actionType: 'custom_speech',
    payload: {
      customSpeech: 'Entrando en protocolo de suspensión. Sistemas en vigilancia pasiva. Que descanse, Comandante.'
    },
    requireConfirmation: true,
    enabled: true
  }
];

export const CustomAppsAndFunctionsConfig: React.FC<CustomAppsAndFunctionsConfigProps> = ({
  customApps,
  onUpdateCustomApps,
  customFunctions,
  onUpdateCustomFunctions,
  onTestAppOrFunction,
  onSaveToCloud
}) => {
  const [subTab, setSubTab] = useState<'apps' | 'functions'>('apps');
  const [showAddAppForm, setShowAddAppForm] = useState(false);
  const [showAddFunctionForm, setShowAddFunctionForm] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form State: New Application
  const [appName, setAppName] = useState('');
  const [appTarget, setAppTarget] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [appAliases, setAppAliases] = useState('');
  const [appCategory, setAppCategory] = useState<CustomApplication['category']>('work');

  // Form State: New Function
  const [funcName, setFuncName] = useState('');
  const [funcTitle, setFuncTitle] = useState('');
  const [funcTriggers, setFuncTriggers] = useState('');
  const [funcDescription, setFuncDescription] = useState('');
  const [funcActionType, setFuncActionType] = useState<CustomFunction['actionType']>('macro_sequence');
  const [funcAppTarget, setFuncAppTarget] = useState('');
  const [funcMacroSteps, setFuncMacroSteps] = useState('');
  const [funcCustomSpeech, setFuncCustomSpeech] = useState('');
  const [funcRequireConfirm, setFuncRequireConfirm] = useState(false);

  const showNotification = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // ==========================================
  // APPLICATION ACTIONS
  // ==========================================
  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim() || !appTarget.trim()) {
      showNotification('⚠️ Nombre y destino ejecutable/URL son requeridos.');
      return;
    }

    const aliases = appAliases
      .split(',')
      .map(a => a.trim().toLowerCase())
      .filter(Boolean);

    // Auto-generate default alias if empty
    if (aliases.length === 0) {
      aliases.push(`abre ${appName.trim().toLowerCase()}`);
      aliases.push(appName.trim().toLowerCase());
    }

    const newApp: CustomApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: appName.trim(),
      target: appTarget.trim(),
      description: appDescription.trim() || `Aplicación personalizada: ${appName.trim()}`,
      voiceAliases: aliases,
      category: appCategory,
      enabled: true
    };

    const updated = [newApp, ...customApps];
    onUpdateCustomApps(updated);
    sciFiAudio.playConfirmSound();
    showNotification(`✅ Aplicación '${newApp.name}' registrada exitosamente.`);

    // Reset Form
    setAppName('');
    setAppTarget('');
    setAppDescription('');
    setAppAliases('');
    setAppCategory('work');
    setShowAddAppForm(false);
  };

  const handleAddAppPreset = (preset: Omit<CustomApplication, 'id'>) => {
    // Check if already exists
    if (customApps.some(a => a.name.toLowerCase() === preset.name.toLowerCase())) {
      showNotification(`ℹ️ '${preset.name}' ya está en tu lista de aplicaciones.`);
      return;
    }

    const newApp: CustomApplication = {
      ...preset,
      id: `app_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    onUpdateCustomApps([newApp, ...customApps]);
    sciFiAudio.playConfirmSound();
    showNotification(`⚡ Preset '${preset.name}' añadido a tus aplicaciones.`);
  };

  const handleDeleteApp = (id: string) => {
    sciFiAudio.playBlip();
    const updated = customApps.filter(a => a.id !== id);
    onUpdateCustomApps(updated);
    showNotification('🗑️ Aplicación eliminada.');
  };

  const handleToggleApp = (id: string) => {
    sciFiAudio.playBlip();
    const updated = customApps.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a);
    onUpdateCustomApps(updated);
  };

  // ==========================================
  // FUNCTION / ROUTINE ACTIONS
  // ==========================================
  const handleAddFunction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!funcTitle.trim() || !funcTriggers.trim()) {
      showNotification('⚠️ Título y frases activadoras son requeridos.');
      return;
    }

    const formattedName = (funcName.trim() || funcTitle.trim())
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_');

    const triggers = funcTriggers
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const macroStepsArray = funcMacroSteps
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const newFunc: CustomFunction = {
      id: `func_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formattedName,
      title: funcTitle.trim(),
      triggerPhrases: triggers,
      description: funcDescription.trim() || `Función personalizada de A.T.L.A.S.: ${funcTitle.trim()}`,
      actionType: funcActionType,
      payload: {
        appTarget: funcAppTarget.trim() || undefined,
        macroSteps: macroStepsArray.length > 0 ? macroStepsArray : undefined,
        customSpeech: funcCustomSpeech.trim() || undefined
      },
      requireConfirmation: funcRequireConfirm,
      enabled: true
    };

    const updated = [newFunc, ...customFunctions];
    onUpdateCustomFunctions(updated);
    sciFiAudio.playConfirmSound();
    showNotification(`✅ Función táctica '${newFunc.title}' creada exitosamente.`);

    // Reset Form
    setFuncName('');
    setFuncTitle('');
    setFuncTriggers('');
    setFuncDescription('');
    setFuncAppTarget('');
    setFuncMacroSteps('');
    setFuncCustomSpeech('');
    setFuncRequireConfirm(false);
    setShowAddFunctionForm(false);
  };

  const handleAddFunctionPreset = (preset: Omit<CustomFunction, 'id'>) => {
    if (customFunctions.some(f => f.name === preset.name)) {
      showNotification(`ℹ️ '${preset.title}' ya está registrada en el sistema.`);
      return;
    }

    const newFunc: CustomFunction = {
      ...preset,
      id: `func_preset_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    onUpdateCustomFunctions([newFunc, ...customFunctions]);
    sciFiAudio.playConfirmSound();
    showNotification(`⚡ Rutina '${preset.title}' integrada.`);
  };

  const handleDeleteFunction = (id: string) => {
    sciFiAudio.playBlip();
    const updated = customFunctions.filter(f => f.id !== id);
    onUpdateCustomFunctions(updated);
    showNotification('🗑️ Función táctica eliminada.');
  };

  const handleToggleFunction = (id: string) => {
    sciFiAudio.playBlip();
    const updated = customFunctions.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    onUpdateCustomFunctions(updated);
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* Header Info Banner */}
      <div className="p-3 bg-[#00f2ff08] border border-[#00f2ff33] rounded-sm space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="font-bold text-[#00f2ff] flex items-center gap-1.5">
            <Cpu className="w-4 h-4" />
            CONTROL DE APLICACIONES Y FUNCIONES PERSONALIZADAS // PROTOCOLO DE EJECUCIÓN
          </div>
          {onSaveToCloud && (
            <button
              onClick={onSaveToCloud}
              className="px-2 py-0.5 bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff66] hover:bg-[#00f2ff44] text-[10px] rounded cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Sincronizar Nube
            </button>
          )}
        </div>
        <p className="text-gray-300 text-[11px] leading-relaxed">
          Define qué <strong>aplicaciones de tu PC</strong> puede abrir A.T.L.A.S. y qué <strong>funciones y rutinas avanzadas</strong> ejecutará ante comandos de voz o texto personalizados.
        </p>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="p-2 bg-[#00f2ff15] border border-[#00f2ff] text-[#00f2ff] text-[11px] rounded flex items-center justify-between animate-fade-in">
          <span>{statusMsg}</span>
          <span className="text-[10px] opacity-70">A.T.L.A.S. Core</span>
        </div>
      )}

      {/* Sub-Tabs: Aplicaciones vs Funciones */}
      <div className="flex items-center justify-between border-b border-[#00f2ff22] pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              sciFiAudio.playBlip();
              setSubTab('apps');
            }}
            className={`px-3 py-1.5 rounded-sm border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'apps'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-400 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <AppWindow className="w-3.5 h-3.5" />
            APLICACIONES DEL SISTEMA ({customApps.length})
          </button>

          <button
            type="button"
            onClick={() => {
              sciFiAudio.playBlip();
              setSubTab('functions');
            }}
            className={`px-3 py-1.5 rounded-sm border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              subTab === 'functions'
                ? 'bg-[#00f2ff] text-black border-[#00f2ff]'
                : 'bg-black/60 text-gray-400 border-[#00f2ff33] hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            FUNCIONES Y MACROS ({customFunctions.length})
          </button>
        </div>

        {subTab === 'apps' ? (
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              setShowAddAppForm(!showAddAppForm);
            }}
            className="px-2.5 py-1 bg-[#00f2ff18] text-[#00f2ff] border border-[#00f2ff66] hover:bg-[#00f2ff33] text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddAppForm ? 'CANCELAR' : 'AÑADIR APLICACIÓN'}
          </button>
        ) : (
          <button
            onClick={() => {
              sciFiAudio.playBlip();
              setShowAddFunctionForm(!showAddFunctionForm);
            }}
            className="px-2.5 py-1 bg-[#00f2ff18] text-[#00f2ff] border border-[#00f2ff66] hover:bg-[#00f2ff33] text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddFunctionForm ? 'CANCELAR' : 'CREAR FUNCIÓN'}
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: APLICACIONES */}
      {/* ========================================================================= */}
      {subTab === 'apps' && (
        <div className="space-y-4">
          {/* Quick Add Presets Bar */}
          <div className="p-2.5 bg-black/40 border border-[#00f2ff22] rounded space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00f2ff]" />
              Añadir Apps Populares en 1 Clic:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {APP_PRESETS.map((preset) => {
                const alreadyAdded = customApps.some(a => a.name.toLowerCase() === preset.name.toLowerCase());
                return (
                  <button
                    key={preset.name}
                    disabled={alreadyAdded}
                    onClick={() => handleAddAppPreset(preset)}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-all flex items-center gap-1 cursor-pointer ${
                      alreadyAdded
                        ? 'opacity-40 border-gray-700 bg-gray-900/50 text-gray-500 cursor-not-allowed'
                        : 'border-[#00f2ff33] bg-[#00f2ff0d] text-gray-200 hover:border-[#00f2ff] hover:text-[#00f2ff]'
                    }`}
                  >
                    {alreadyAdded ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form to Add Custom Application */}
          {showAddAppForm && (
            <form onSubmit={handleAddApplication} className="p-3 bg-[#00f2ff0d] border border-[#00f2ff66] rounded space-y-3 animate-fade-in">
              <div className="font-bold text-[#00f2ff] text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                CONFIGURAR NUEVA APLICACIÓN EJECUTABLE O URL
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Nombre de la Aplicación *</label>
                  <input
                    type="text"
                    required
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Ej: Blender, Telegram, Docker"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Comando Ejecutable o URL Web *</label>
                  <input
                    type="text"
                    required
                    value={appTarget}
                    onChange={(e) => setAppTarget(e.target.value)}
                    placeholder="Ej: blender.exe, https://web.telegram.org"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Comandos de Voz / Alias (separados por coma)</label>
                  <input
                    type="text"
                    value={appAliases}
                    onChange={(e) => setAppAliases(e.target.value)}
                    placeholder="abre blender, inicia modelado, render 3d"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Categoría</label>
                  <select
                    value={appCategory}
                    onChange={(e) => setAppCategory(e.target.value as any)}
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  >
                    <option value="work">Trabajo y Productividad</option>
                    <option value="dev">Desarrollo y Código</option>
                    <option value="creative">Diseño y Creatividad</option>
                    <option value="games">Videojuegos y Entretenimiento</option>
                    <option value="system">Sistema y Utilidades</option>
                    <option value="custom">Personalizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Descripción / Propósito</label>
                <input
                  type="text"
                  value={appDescription}
                  onChange={(e) => setAppDescription(e.target.value)}
                  placeholder="Ej: Suite de renderizado y modelado 3D para proyectos de diseño."
                  className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddAppForm(false)}
                  className="px-3 py-1 bg-black/50 text-gray-400 border border-gray-700 text-xs rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#00f2ff] text-black font-bold text-xs rounded cursor-pointer hover:bg-[#00f2ffcc]"
                >
                  Guardar Aplicación
                </button>
              </div>
            </form>
          )}

          {/* Applications List */}
          <div className="space-y-2">
            {customApps.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#00f2ff33] rounded text-gray-400 space-y-2">
                <AppWindow className="w-8 h-8 text-[#00f2ff] mx-auto opacity-50" />
                <div className="font-bold text-gray-300">No hay aplicaciones registradas</div>
                <p className="text-[11px] max-w-md mx-auto">
                  Añade una aplicación desde los presets arriba o haz clic en "Añadir Aplicación" para enlazar cualquier programa de tu PC o servicio web.
                </p>
              </div>
            ) : (
              customApps.map((app) => (
                <div
                  key={app.id}
                  className={`p-3 rounded border transition-all ${
                    app.enabled
                      ? 'bg-black/60 border-[#00f2ff33] hover:border-[#00f2ff66]'
                      : 'bg-black/30 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{app.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff33] uppercase">
                          {app.category}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                          {app.target.startsWith('http') ? <ExternalLink className="w-2.5 h-2.5" /> : <Laptop className="w-2.5 h-2.5" />}
                          {app.target}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px]">{app.description}</p>
                      
                      {/* Voice Aliases Badges */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-gray-400 mr-1">Voz:</span>
                        {app.voiceAliases.map((alias, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 text-[9px] bg-slate-900 border border-slate-700 text-slate-300 rounded"
                          >
                            "{alias}"
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Test Action */}
                      <button
                        title="Probar ejecución en el HUD"
                        onClick={() => {
                          sciFiAudio.playBlip();
                          if (onTestAppOrFunction) {
                            onTestAppOrFunction(app.name, 'app');
                          }
                          showNotification(`⚡ Probando orden de apertura: '${app.name}'`);
                        }}
                        className="px-2 py-1 bg-[#00f2ff1a] text-[#00f2ff] border border-[#00f2ff44] hover:bg-[#00f2ff33] text-[10px] rounded flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Play className="w-2.5 h-2.5" />
                        PROBAR
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        title={app.enabled ? 'Desactivar aplicación' : 'Activar aplicación'}
                        onClick={() => handleToggleApp(app.id)}
                        className={`px-2 py-1 text-[10px] rounded border cursor-pointer ${
                          app.enabled
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {app.enabled ? 'ACTIVA' : 'INACTIVA'}
                      </button>

                      {/* Delete */}
                      <button
                        title="Eliminar aplicación"
                        onClick={() => handleDeleteApp(app.id)}
                        className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: FUNCIONES Y RUTINAS TÁCTICAS */}
      {/* ========================================================================= */}
      {subTab === 'functions' && (
        <div className="space-y-4">
          {/* Quick Add Presets Bar */}
          <div className="p-2.5 bg-black/40 border border-[#00f2ff22] rounded space-y-1.5">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#00f2ff]" />
              Rutinas Tácticas Recomendadas:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FUNCTION_PRESETS.map((preset) => {
                const alreadyAdded = customFunctions.some(f => f.name === preset.name);
                return (
                  <button
                    key={preset.name}
                    disabled={alreadyAdded}
                    onClick={() => handleAddFunctionPreset(preset)}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-all flex items-center gap-1 cursor-pointer ${
                      alreadyAdded
                        ? 'opacity-40 border-gray-700 bg-gray-900/50 text-gray-500 cursor-not-allowed'
                        : 'border-[#00f2ff33] bg-[#00f2ff0d] text-gray-200 hover:border-[#00f2ff] hover:text-[#00f2ff]'
                    }`}
                  >
                    {alreadyAdded ? <Check className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5" />}
                    {preset.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form to Create Custom Function */}
          {showAddFunctionForm && (
            <form onSubmit={handleAddFunction} className="p-3 bg-[#00f2ff0d] border border-[#00f2ff66] rounded space-y-3 animate-fade-in">
              <div className="font-bold text-[#00f2ff] text-xs flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                CREAR NUEVA FUNCIÓN O RUTINA TÁCTICA
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Título de la Rutina / Función *</label>
                  <input
                    type="text"
                    required
                    value={funcTitle}
                    onChange={(e) => setFuncTitle(e.target.value)}
                    placeholder="Ej: Modo Lectura, Limpieza de Temporales"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Identificador de Acción (Opcional)</label>
                  <input
                    type="text"
                    value={funcName}
                    onChange={(e) => setFuncName(e.target.value)}
                    placeholder="Ej: modo_lectura (autogenerado si vacío)"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Frases de Voz Activadoras (separadas por coma) *</label>
                  <input
                    type="text"
                    required
                    value={funcTriggers}
                    onChange={(e) => setFuncTriggers(e.target.value)}
                    placeholder="activa modo lectura, a leer, hora de estudio"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Tipo de Acción</label>
                  <select
                    value={funcActionType}
                    onChange={(e) => setFuncActionType(e.target.value as any)}
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  >
                    <option value="macro_sequence">Secuencia Macro (Multi-paso)</option>
                    <option value="open_app">Abrir Aplicación Específica</option>
                    <option value="custom_speech">Respuesta e Informe de Voz Personalizado</option>
                    <option value="system_command">Comando de Terminal / Script</option>
                  </select>
                </div>
              </div>

              {funcActionType === 'open_app' && (
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Aplicación o Ejecutable a Abrir</label>
                  <input
                    type="text"
                    value={funcAppTarget}
                    onChange={(e) => setFuncAppTarget(e.target.value)}
                    placeholder="code, chrome, spotify, etc."
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>
              )}

              {funcActionType === 'macro_sequence' && (
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Pasos de la Secuencia Macro (uno por línea)</label>
                  <textarea
                    rows={3}
                    value={funcMacroSteps}
                    onChange={(e) => setFuncMacroSteps(e.target.value)}
                    placeholder="1. Abrir Spotify con música ambiente&#10;2. Minimizar ventanas inactivas&#10;3. Iniciar temporizador de 45 minutos"
                    className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] text-gray-400 mb-1">Respuesta Hablada Personalizada de A.T.L.A.S.</label>
                <input
                  type="text"
                  value={funcCustomSpeech}
                  onChange={(e) => setFuncCustomSpeech(e.target.value)}
                  placeholder="Ej: Modo lectura activado. Pantalla atenuada y música instrumental iniciada, Comandante."
                  className="w-full bg-black/80 border border-[#00f2ff33] text-white p-1.5 text-xs rounded focus:border-[#00f2ff] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="req_confirm"
                  checked={funcRequireConfirm}
                  onChange={(e) => setFuncRequireConfirm(e.target.checked)}
                  className="rounded border-[#00f2ff33] accent-[#00f2ff] cursor-pointer"
                />
                <label htmlFor="req_confirm" className="text-[11px] text-gray-300 cursor-pointer flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-400" />
                  Requiere confirmación de seguridad previa antes de ejecutar
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddFunctionForm(false)}
                  className="px-3 py-1 bg-black/50 text-gray-400 border border-gray-700 text-xs rounded cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-[#00f2ff] text-black font-bold text-xs rounded cursor-pointer hover:bg-[#00f2ffcc]"
                >
                  Registrar Función Táctica
                </button>
              </div>
            </form>
          )}

          {/* Functions List */}
          <div className="space-y-2">
            {customFunctions.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[#00f2ff33] rounded text-gray-400 space-y-2">
                <Wrench className="w-8 h-8 text-[#00f2ff] mx-auto opacity-50" />
                <div className="font-bold text-gray-300">No hay funciones tácticas personalizadas</div>
                <p className="text-[11px] max-w-md mx-auto">
                  Añade una rutina táctica desde las opciones recomendadas arriba o crea tu propia macro con respuestas de voz exclusivas.
                </p>
              </div>
            ) : (
              customFunctions.map((func) => (
                <div
                  key={func.id}
                  className={`p-3 rounded border transition-all ${
                    func.enabled
                      ? 'bg-black/60 border-[#00f2ff33] hover:border-[#00f2ff66]'
                      : 'bg-black/30 border-gray-800 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{func.title}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-500/30 uppercase font-mono">
                          {func.name}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f2ff15] text-[#00f2ff] border border-[#00f2ff33]">
                          {func.actionType === 'macro_sequence' ? 'Macro Multi-Paso' : func.actionType === 'open_app' ? 'Apertura de App' : 'Voz Táctica'}
                        </span>
                        {func.requireConfirmation && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <ShieldAlert className="w-2.5 h-2.5" />
                            Confirmación
                          </span>
                        )}
                      </div>

                      <p className="text-gray-300 text-[11px]">{func.description}</p>

                      {/* Custom Speech preview */}
                      {func.payload.customSpeech && (
                        <div className="text-[10px] text-[#00f2ff] bg-[#00f2ff0d] p-1.5 rounded border border-[#00f2ff22] flex items-center gap-1">
                          <span className="opacity-70 font-bold">Voz de ATLAS:</span> "{func.payload.customSpeech}"
                        </div>
                      )}

                      {/* Macro steps */}
                      {func.payload.macroSteps && func.payload.macroSteps.length > 0 && (
                        <div className="text-[10px] text-slate-400 space-y-0.5 pt-0.5">
                          {func.payload.macroSteps.map((step, sIdx) => (
                            <div key={sIdx} className="flex items-center gap-1">
                              <ChevronRight className="w-2.5 h-2.5 text-[#00f2ff]" />
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Trigger Phrases */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        <span className="text-[10px] text-gray-400 mr-1">Activa con:</span>
                        {func.triggerPhrases.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 text-[9px] bg-slate-900 border border-slate-700 text-slate-300 rounded"
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Test Action */}
                      <button
                        title="Probar ejecución en el HUD"
                        onClick={() => {
                          sciFiAudio.playBlip();
                          if (onTestAppOrFunction) {
                            onTestAppOrFunction(func.name, 'function');
                          }
                          showNotification(`⚡ Ejecutando prueba de rutina: '${func.title}'`);
                        }}
                        className="px-2 py-1 bg-[#00f2ff1a] text-[#00f2ff] border border-[#00f2ff44] hover:bg-[#00f2ff33] text-[10px] rounded flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <Play className="w-2.5 h-2.5" />
                        PROBAR
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button
                        title={func.enabled ? 'Desactivar función' : 'Activar función'}
                        onClick={() => handleToggleFunction(func.id)}
                        className={`px-2 py-1 text-[10px] rounded border cursor-pointer ${
                          func.enabled
                            ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }`}
                      >
                        {func.enabled ? 'ACTIVA' : 'INACTIVA'}
                      </button>

                      {/* Delete */}
                      <button
                        title="Eliminar función"
                        onClick={() => handleDeleteFunction(func.id)}
                        className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-950/30 rounded border border-transparent hover:border-red-500/30 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
