import React, { useState } from 'react';
import { 
  Cpu, Radio, Mic, Volume2, ShieldCheck, Terminal, 
  Layers, CheckCircle2, ChevronRight, AlertCircle, Sparkles,
  Server, Monitor, Code, Zap, Smartphone, QrCode, Wifi, Globe, ShieldAlert,
  FolderTree, PlayCircle
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      id: 1,
      title: '1. Arquitectura Multiplataforma (Cliente - Servidor)',
      icon: Server,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Para permitir que controles tu PC desde tu ordenador principal, una <strong>tablet en tu escritorio</strong> o tu <strong>teléfono móvil por Wi-Fi</strong>, el sistema se desacopla en dos subsistemas principales:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="bg-[#00f2ff08] border border-[#00f2ff44] rounded-sm p-4 relative">
              <div className="flex items-center gap-2 text-[#00f2ff] font-mono font-bold text-xs mb-2">
                <Server className="w-4 h-4" /> BACKEND SERVIDOR (PC PRINCIPAL)
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Desarrollado en <strong>Python con FastAPI y WebSockets</strong>. Corre en la máquina anfitriona, tiene acceso nativo al sistema de archivos, ejecución de procesos, GPU, micrófonos locales y modelos IA (Ollama / Gemini).
              </p>
              <ul className="text-[11px] text-gray-400 font-mono mt-2 space-y-1">
                <li>• Endpoint WebSocket dúplex: <code>/ws/hud</code></li>
                <li>• Agente Autónomo con Function Calling</li>
                <li>• Sistema de tokens de seguridad para borrados</li>
              </ul>
            </div>

            <div className="bg-[#00f2ff08] border border-[#00f2ff44] rounded-sm p-4 relative">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs mb-2">
                <Smartphone className="w-4 h-4 text-[#00f2ff]" /> FRONTEND MULTIPLATAFORMA (TABLET / MÓVIL)
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Interfaz web futurista Sci-Fi HUD ultra-ligera (PWA / WebSockets). Se abre desde cualquier navegador en la red local (Safari, Chrome móvil, Brave).
              </p>
              <ul className="text-[11px] text-gray-400 font-mono mt-2 space-y-1">
                <li>• Captura de voz mediante Web Speech / MediaRecorder</li>
                <li>• Reactor Arc reactivo renderizado en Canvas HTML5</li>
                <li>• Telemetría de PC en tiempo real (CPU, RAM, temp)</li>
              </ul>
            </div>
          </div>

          <div className="bg-black/60 border border-[#00f2ff33] rounded-sm p-3.5 font-mono text-xs text-gray-300">
            <span className="text-[#00f2ff] font-bold">📡 Diagrama de Flujo:</span>
            <div className="mt-1 text-[11px] text-gray-400">
              Tablet (Voz / Texto) ➔ WebSocket ➔ FastAPI ➔ Agente (Ollama / Gemini Function Calling) ➔ Ejecución de Tool en SO ➔ Respuesta TTS ➔ Retorno a HUD.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: '2. Cerebro Autónomo & Function Calling (Tools)',
      icon: Cpu,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            El modelo de lenguaje no solo responde texto; está alimentado con esquemas de <strong>Function Calling</strong> en JSON que le permiten invocar código Python en el sistema operativo automáticamente:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-black/50 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-xs font-mono font-bold text-[#00f2ff] mb-1.5 flex items-center gap-1.5">
                <FolderTree className="w-3.5 h-3.5" /> 1. Sistema de Archivos
              </div>
              <p className="text-[11px] text-gray-300">
                <code>create_directory</code>, <code>search_files</code>, <code>read_file</code> y <code>delete_path</code> (con solicitud de confirmación previa).
              </p>
            </div>

            <div className="bg-black/50 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-xs font-mono font-bold text-[#00f2ff] mb-1.5 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" /> 2. Control de Aplicaciones
              </div>
              <p className="text-[11px] text-gray-300">
                <code>open_application</code> (Chrome, VS Code, Spotify), <code>close_process</code>, <code>system_control</code> (bloqueo, suspensión, apagado).
              </p>
            </div>

            <div className="bg-black/50 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-xs font-mono font-bold text-[#00f2ff] mb-1.5 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> 3. Automatización de Código
              </div>
              <p className="text-[11px] text-gray-300">
                <code>write_code_file</code> para guardar código y <code>scaffold_project</code> para generar arquitecturas FastAPI / React en segundos.
              </p>
            </div>
          </div>

          {/* Seguridad */}
          <div className="bg-red-950/20 border border-red-500/40 rounded-sm p-3.5 text-xs">
            <div className="font-mono font-bold text-red-400 flex items-center gap-2 mb-1">
              <ShieldAlert className="w-4 h-4" /> Protocolo de Confirmación de Seguridad (Zero-Risk)
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              Si la IA decide invocar una herramienta destructiva (como borrar archivos o apagar el equipo), el Agente genera un <strong>token temporal</strong> y pausa la ejecución. En la pantalla del móvil y la PC aparece un diálogo modal emergente para que apruebes o rechaces la acción.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: '3. Pipeline de Voz y Escucha Activa',
      icon: Mic,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            El sistema de voz opera con latencia ultrabaja y procesamiento local:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-black/60 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-[#00f2ff] font-bold mb-1">🎙️ 1. Detección Wake Word (Picovoice / Local)</div>
              <p className="text-gray-300 text-[11px]">
                Escucha continua en segundo plano de la palabra <strong>"Jarvis"</strong> o <strong>"Viernes"</strong> con consumo de CPU menor al 0.8% usando Porcupine o umbral de energía.
              </p>
            </div>

            <div className="bg-black/60 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-purple-300 font-bold mb-1">⚡ 2. STT (Faster-Whisper Local)</div>
              <p className="text-gray-300 text-[11px]">
                Convierte los segundos de voz tras la activación en texto con alta precisión en español utilizando el modelo Whisper <code>base</code> o <code>small</code> optimizado en INT8.
              </p>
            </div>

            <div className="bg-black/60 border border-[#00f2ff33] p-3 rounded-sm">
              <div className="text-emerald-300 font-bold mb-1">🔊 3. TTS Neural (Edge-TTS)</div>
              <p className="text-gray-300 text-[11px]">
                Sintetiza la respuesta del Agente con entonación natural de IA usando las voces <code>es-ES-AlvaroNeural</code> (JARVIS) o <code>es-ES-ElviraNeural</code> (VIERNES).
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: '4. Conexión desde Móvil / Tablet en Wi-Fi',
      icon: Wifi,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Para controlar la PC a distancia desde cualquier dispositivo en la misma red Wi-Fi:
          </p>

          <div className="space-y-3 font-mono text-xs">
            <div className="bg-black/60 border border-[#00f2ff33] p-3.5 rounded-sm">
              <div className="text-[#00f2ff] font-bold mb-1.5">Paso A: Ejecutar el lanzador en la PC</div>
              <div className="bg-[#020617] p-2 border border-[#00f2ff22] text-gray-200">
                <code>python run_server.py</code>
              </div>
              <p className="text-[11px] text-gray-400 mt-2">
                El script detecta automáticamente tu IP privada (ej: <code>192.168.1.50</code>) y abre el puerto <code>8000</code>.
              </p>
            </div>

            <div className="bg-black/60 border border-[#00f2ff33] p-3.5 rounded-sm">
              <div className="text-[#00f2ff] font-bold mb-1.5">Paso B: Abrir en el navegador de la Tablet o Móvil</div>
              <p className="text-gray-300 text-[11px]">
                En el navegador (Chrome / Safari) de tu móvil, escribe:
              </p>
              <div className="bg-[#020617] p-2 border border-[#00f2ff22] text-emerald-400 mt-1">
                <code>http://192.168.1.X:8000</code>
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/40 p-3 rounded-sm text-[11px] text-gray-300">
              <span className="text-amber-400 font-bold">💡 Permiso de Micrófono en Móviles HTTP:</span><br />
              Chrome en Android requiere habilitar permisos de audio para IPs locales. Entra a <code>chrome://flags/#unsafely-treat-insecure-origin-as-secure</code>, agrega <code>http://192.168.1.X:8000</code> y pulsa Relaunch.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: '5. Configurar Cerebro: Ollama Local vs Gemini API',
      icon: Sparkles,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            Puedes configurar el agente para funcionar 100% offline y privado mediante <strong>Ollama</strong>, o conectado a la nube con <strong>Gemini</strong>:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/60 border border-[#00f2ff33] p-3.5 rounded-sm">
              <div className="text-xs font-mono font-bold text-[#00f2ff] mb-2 flex items-center gap-1.5">
                <Cpu className="w-4 h-4" /> Opción A: Ollama Local (100% Offline)
              </div>
              <ol className="text-[11px] text-gray-300 font-mono space-y-1.5 list-decimal pl-4">
                <li>Descarga Ollama desde <code>ollama.com</code></li>
                <li>Ejecuta: <code>ollama run llama3:8b</code></li>
                <li>En <code>.env</code> establece: <code>AI_PROVIDER=ollama</code></li>
              </ol>
            </div>

            <div className="bg-black/60 border border-[#00f2ff33] p-3.5 rounded-sm">
              <div className="text-xs font-mono font-bold text-purple-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Opción B: Google Gemini API (Alta Velocidad)
              </div>
              <ol className="text-[11px] text-gray-300 font-mono space-y-1.5 list-decimal pl-4">
                <li>Obtén tu clave en Google AI Studio</li>
                <li>En <code>.env</code> coloca tu <code>GEMINI_API_KEY=AIzaSy...</code></li>
                <li>Establece: <code>AI_PROVIDER=gemini</code></li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: '6. Puesta en Marcha en 1 Clic (Despliegue)',
      icon: PlayCircle,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-300">
            Resumen rápido para poner en marcha el proyecto completo:
          </p>

          <div className="bg-[#020617] border border-[#00f2ff44] p-4 rounded-sm font-mono text-xs text-gray-200 space-y-2">
            <div className="text-[#00f2ff] font-bold"># 1. Descarga el código ZIP desde la pestaña "Código Fuente"</div>
            <div className="text-gray-400"># 2. Descomprime en tu PC (ej: C:\jarvis_assistant)</div>
            <div className="text-gray-400"># 3. Ejecuta el instalador automático:</div>
            <div className="text-emerald-400">setup.bat (Windows) o ./setup.sh (Linux/macOS)</div>
            <div className="text-gray-400"># 4. Inicia el servidor:</div>
            <div className="text-[#00f2ff]">python run_server.py</div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="w-full flex flex-col space-y-6">
      
      {/* Header */}
      <div className="bg-[#00f2ff08] border border-[#00f2ff44] p-5 rounded-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />
        
        <div className="text-[10px] opacity-60 uppercase tracking-[0.2em] text-[#00f2ff] mb-1">
          OPERATIONAL BLUEPRINT & MULTIPLATFORM SPEC
        </div>
        <h2 className="text-lg font-mono font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#00f2ff]" />
          MANUAL DE ARQUITECTURA AUTÓNOMA Y DESPLIEGUE MULTIPLATAFORMA
        </h2>
        <p className="text-xs text-gray-300 mt-1 font-mono">
          Guía técnica para orquestar el servidor FastAPI con Function Calling, escucha activa por voz y cliente web HUD para Tablets y Móviles.
        </p>
      </div>

      {/* Step Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = s.id === activeStep;
          return (
            <button
              key={s.id}
              id={`arch-step-${s.id}-btn`}
              onClick={() => setActiveStep(s.id)}
              className={`p-3 rounded-sm border text-left flex flex-col items-start gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#00f2ff22] text-[#00f2ff] border-[#00f2ff] shadow-[0_0_15px_rgba(0,242,255,0.25)]'
                  : 'bg-black/40 text-gray-400 border-[#00f2ff22] hover:text-white hover:bg-[#00f2ff0a]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00f2ff]' : 'text-gray-500'}`} />
              <span className="text-[11px] font-mono font-semibold line-clamp-2 leading-tight">
                {s.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Step Content Display */}
      <div className="bg-black border border-[#00f2ff44] rounded-sm p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#00f2ff] opacity-40 pointer-events-none" />

        <div className="border-b border-[#00f2ff33] pb-3 mb-4 flex items-center justify-between">
          <h3 className="font-mono text-base font-bold text-white flex items-center gap-2">
            <span className="w-6 h-6 rounded-sm bg-[#00f2ff22] text-[#00f2ff] border border-[#00f2ff] flex items-center justify-center text-xs">
              {activeStep}
            </span>
            {steps.find(s => s.id === activeStep)?.title}
          </h3>
          <span className="text-xs font-mono text-gray-400">PASO {activeStep} DE 6</span>
        </div>

        {steps.find(s => s.id === activeStep)?.content}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#00f2ff22]">
          <button
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="px-4 py-2 rounded-sm bg-black/60 border border-[#00f2ff33] text-xs font-mono text-gray-300 hover:bg-[#00f2ff11] hover:text-white disabled:opacity-30 cursor-pointer"
          >
            ← ANTERIOR
          </button>

          <button
            onClick={() => setActiveStep(Math.min(6, activeStep + 1))}
            disabled={activeStep === 6}
            className="px-4 py-2 rounded-sm bg-[#00f2ff22] border border-[#00f2ff] text-xs font-mono font-bold text-white hover:bg-[#00f2ff33] disabled:opacity-30 flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,255,0.2)] cursor-pointer"
          >
            SIGUIENTE PASO →
          </button>
        </div>
      </div>

    </div>
  );
};
