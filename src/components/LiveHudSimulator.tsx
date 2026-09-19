import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Volume2, Sparkles, Terminal, Activity, 
  Cpu, Thermometer, ShieldCheck, Play, Radio, RotateCcw, AlertTriangle, 
  ExternalLink, Zap, Smartphone, Monitor, ShieldAlert, FolderPlus,
  Search, FileCode, CheckCircle2, XCircle, QrCode, Wifi, Layers, ChevronRight,
  Download, Copy, Check, Power, RefreshCw, Laptop, Globe, Settings, User as UserIcon,
  Maximize2, Minimize2, Eye, Music, Timer, CheckSquare, X
} from 'lucide-react';
import { 
  AssistantState, AssistantTheme, AssistantVoiceName, AssistantLogEntry, 
  AssistantAction, VoiceSettings, SecurityPermissions, WebSearchResult, UserNote,
  SmartMemory, ProjectTask, GeminiModelOption, AssistantDiagnostic,
  CustomApplication, CustomFunction
} from '../types';
import { ArcReactorCanvas } from './ArcReactorCanvas';
import { TacticalHudCanvas } from './TacticalHudCanvas';
import { Holo3DDisc } from './Holo3DDisc';
import { TerrainRadar3D } from './TerrainRadar3D';
import { 
  RadarBadge, TacticalMemoryBox, SegmentedMeter, TelemetryCodeBlock, 
  DatabaseIndicators, RedDigitalClock, AudioSpectrumWave, GyroDial, 
  SciFiTopBrackets, SciFiBottomBrackets 
} from './HudTelemetryPanels';
import { OpticalVisionScanner } from './OpticalVisionScanner';
import { WeatherTacticalRadar } from './WeatherTacticalRadar';
import { FocusMusicPlayer } from './FocusMusicPlayer';
import { MissionTimerAlarm } from './MissionTimerAlarm';
import { StarkProtocolTasks } from './StarkProtocolTasks';
import { SettingsModal } from './SettingsModal';
import { AtlasDashboard } from './AtlasDashboard';
import { sciFiAudio, speakSpanish } from '../utils/audioSynth';
import { useAtlasWebSocket } from '../hooks/useAtlasWebSocket';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, addDoc, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';


interface LiveHudSimulatorProps {
  theme: AssistantTheme;
  assistantName: AssistantVoiceName;
  speechSynthesisActiveProp?: boolean;
  onThemeChange: (theme: AssistantTheme) => void;
  onNameChange: (name: AssistantVoiceName) => void;
}

const PYTHON_BRIDGE_CODE = `#!/usr/bin/env python3
# ATLAS // PUENTE LOCAL DE CONTROL DE WINDOWS / MAC / LINUX
import os, sys, subprocess, webbrowser, platform, json
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 5000

class BridgeHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def do_OPTIONS(self):
        self.send_response(200); self._cors(); self.end_headers()

    def do_GET(self):
        self.send_response(200); self._cors()
        self.send_header('Content-Type', 'application/json'); self.end_headers()
        self.wfile.write(json.dumps({
            "status": "online", "os": platform.system(), "platform": platform.platform(), "user": os.getlogin() if hasattr(os, 'getlogin') else "User"
        }).encode('utf-8'))

    def do_POST(self):
        self._cors()
        length = int(self.headers.get('Content-Length', 0))
        data = json.loads(self.rfile.read(length).decode('utf-8'))
        action = data.get("action", "")
        payload = data.get("payload", {})
        res = {"success": True}
        print(f"[ATLAS PROTOCOL] Ejecutando: {action} -> {payload}")

        try:
            if action in ["open_app", "open_program"]:
                name = payload.get("name", "").lower()
                if "code" in name or "visual studio" in name: subprocess.Popen(["code"], shell=True)
                elif "chrome" in name: subprocess.Popen(["start", "chrome"] if platform.system() == "Windows" else ["open", "-a", "Google Chrome"], shell=True)
                elif "spotify" in name: subprocess.Popen(["start", "spotify"] if platform.system() == "Windows" else ["open", "-a", "Spotify"], shell=True)
                elif "notepad" in name: subprocess.Popen(["notepad.exe"], shell=True)
                elif "calc" in name: subprocess.Popen(["calc.exe"] if platform.system() == "Windows" else ["open", "-a", "Calculator"], shell=True)
                else: subprocess.Popen([name], shell=True)
            elif action == "create_folder":
                target = os.path.join(os.path.expanduser("~"), "Desktop", payload.get("name", "Nueva_Carpeta_Atlas"))
                os.makedirs(target, exist_ok=True)
                res["path"] = target
            elif action == "open_folder":
                target = payload.get("path", "~/Desktop").replace("~", os.path.expanduser("~"))
                os.makedirs(target, exist_ok=True)
                if platform.system() == "Windows": os.startfile(target)
                else: subprocess.Popen(["open" if platform.system() == "Darwin" else "xdg-open", target])
            elif action == "execute_command":
                p = subprocess.Popen(payload.get("command", ""), shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                out, err = p.communicate(timeout=10)
                res = {"success": p.returncode == 0, "stdout": out.strip(), "stderr": err.strip()}
            elif action == "shutdown_pc":
                if platform.system() == "Windows": os.system("shutdown /s /t 60")
        except Exception as e:
            res = {"success": False, "error": str(e)}

        self.send_response(200); self._cors()
        self.send_header('Content-Type', 'application/json'); self.end_headers()
        self.wfile.write(json.dumps(res).encode('utf-8'))

    def log_message(self, format, *args): return

print(f"ATLAS PUENTE ONLINE en http://localhost:{PORT}")
HTTPServer(('0.0.0.0', PORT), BridgeHandler).serve_forever()
`;

const NODE_BRIDGE_CODE = `// ATLAS // PUENTE LOCAL EN NODE.JS
const http = require('http'), { exec } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os');
const PORT = 5000;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', platform: os.platform(), user: os.userInfo().username }));
    return;
  }
  let body = '';
  req.on('data', c => body += c);
  req.on('end', () => {
    try {
      const { action, payload = {} } = JSON.parse(body);
      console.log(\`[ATLAS] \${action}\`, payload);
      if (action === 'open_app') {
        const n = (payload.name || '').toLowerCase();
        let cmd = n.includes('code') ? 'code' : n.includes('chrome') ? (process.platform === 'win32' ? 'start chrome' : 'open -a "Google Chrome"') : payload.name;
        exec(cmd, { shell: true }, err => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: !err }));
        });
      } else if (action === 'create_folder') {
        const p = path.join(os.homedir(), 'Desktop', payload.name || 'Nueva_Carpeta');
        fs.mkdirSync(p, { recursive: true });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, path: p }));
      } else if (action === 'open_folder') {
        const p = (payload.path || '~/Desktop').replace(/^~/, os.homedir());
        fs.mkdirSync(p, { recursive: true });
        exec(process.platform === 'win32' ? \`explorer "\${p}"\` : \`open "\${p}"\`, () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        });
      } else if (action === 'execute_command') {
        exec(payload.command, (err, stdout, stderr) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: !err, stdout: stdout?.trim(), stderr: stderr?.trim() }));
        });
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      }
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: e.message }));
    }
  });
}).listen(PORT, () => console.log(\`ATLAS Puente Node en http://localhost:\${PORT}\`));
`;

export const LiveHudSimulator: React.FC<LiveHudSimulatorProps> = ({
  theme,
  assistantName,
  speechSynthesisActiveProp = true,
  onThemeChange,
  onNameChange
}) => {
  const [state, setState] = useState<AssistantState>('idle');
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [voiceVolume, setVoiceVolume] = useState(0);
  const [speechSynthesisActive, setSpeechSynthesisActive] = useState(speechSynthesisActiveProp);

  useEffect(() => {
    setSpeechSynthesisActive(speechSynthesisActiveProp);
  }, [speechSynthesisActiveProp]);
  const [activeDeviceView, setActiveDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  
  // Pending confirmation dialog state
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    target: string;
    description: string;
  } | null>(null);

  // Active tool execution display
  const [lastExecutedTool, setLastExecutedTool] = useState<{
    name: string;
    args: any;
    description: string;
  } | null>(null);

  const [telemetry, setTelemetry] = useState({
    cpu: 18,
    temp: 42,
    ram: 34,
    link: 'NOMINAL 100%',
    lanIp: '192.168.1.85:8000'
  });

  // User Authentication & Cloud State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Custom Voice Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    pitch: 0.9,
    rate: 1.05,
    volume: 1.0,
    voiceURI: '',
    lang: 'es-ES',
    autoSpeak: true,
    continuousConversation: false,
    interruptOnSpeech: true
  });

  // Granular Security & Capability Permissions
  const [securityPermissions, setSecurityPermissions] = useState<SecurityPermissions>({
    allowWebSearch: true,
    allowOpenApps: true,
    allowCreateFiles: true,
    allowSystemVolume: true,
    allowTerminalExecution: true,
    requireConfirmForTerminal: true,
    allowedApps: ['code', 'vscode', 'chrome', 'google-chrome', 'spotify', 'terminal', 'notepad', 'calculator', 'explorer', 'browser', 'firefox'],
    allowedDirectories: ['Desktop', 'Documents', 'Projects', 'Workspace', 'Stark_Autonomous', 'Atlas_Core']
  });

  // Smart Memories & Project Tasks (ATLAS AI 2.0)
  const [navSection, setNavSection] = useState<'inicio' | 'conversacion' | 'investigacion' | 'proyectos' | 'tareas' | 'memoria' | 'archivos' | 'vision' | 'ajustes'>('inicio');
  const [memories, setMemories] = useState<SmartMemory[]>(() => {
    try {
      const saved = localStorage.getItem('atlas_memories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [tasks, setTasks] = useState<ProjectTask[]>(() => {
    try {
      const saved = localStorage.getItem('atlas_tasks');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [activeModel, setActiveModel] = useState<string>('gpt-4o-mini');
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'console' | 'tasks' | 'memories' | 'search' | 'vision'>('console');
  const [searchResults, setSearchResults] = useState<WebSearchResult[]>([]);

  // Custom Applications & Functions
  const [customApps, setCustomApps] = useState<CustomApplication[]>(() => {
    try {
      const saved = localStorage.getItem('atlas_custom_apps');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error cargando apps personalizadas:', e);
    }
    return [
      {
        id: 'app_vscode',
        name: 'VS Code',
        target: 'code',
        description: 'Editor de código principal de desarrollo.',
        voiceAliases: ['abre vscode', 'abre visual studio', 'abre mi editor', 'abre code'],
        category: 'dev',
        enabled: true
      },
      {
        id: 'app_chrome',
        name: 'Google Chrome',
        target: 'google-chrome',
        description: 'Navegador web para investigación y pruebas.',
        voiceAliases: ['abre chrome', 'abre navegador', 'abre internet', 'abre google'],
        category: 'work',
        enabled: true
      },
      {
        id: 'app_spotify',
        name: 'Spotify',
        target: 'spotify',
        description: 'Reproductor de música y podcasts.',
        voiceAliases: ['abre spotify', 'reproduce musica', 'pon spotify'],
        category: 'creative',
        enabled: true
      },
      {
        id: 'app_discord',
        name: 'Discord',
        target: 'discord',
        description: 'Comunicaciones de voz y texto para equipos y proyectos.',
        voiceAliases: ['abre discord', 'inicia discord', 'comunidad discord'],
        category: 'work',
        enabled: true
      }
    ];
  });

  const [customFunctions, setCustomFunctions] = useState<CustomFunction[]>(() => {
    try {
      const saved = localStorage.getItem('atlas_custom_functions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Error cargando funciones personalizadas:', e);
    }
    return [
      {
        id: 'func_modo_estudio',
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
        id: 'func_modo_desarrollo',
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
        id: 'func_inspeccion_sistema',
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
      }
    ];
  });

  // Local Storage Synchronization
  useEffect(() => {
    try {
      localStorage.setItem('atlas_custom_apps', JSON.stringify(customApps));
    } catch {}
  }, [customApps]);

  useEffect(() => {
    try {
      localStorage.setItem('atlas_custom_functions', JSON.stringify(customFunctions));
    } catch {}
  }, [customFunctions]);

  useEffect(() => {
    try {
      localStorage.setItem('atlas_tasks', JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('atlas_memories', JSON.stringify(memories));
    } catch {}
  }, [memories]);

  // Escuchar estado de usuario Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        addLog('SYSTEM', `☁️ [GOOGLE AUTH]: Sesión activa de ${user.displayName || user.email}. Historial y notas sincronizados en la nube.`);
      }
    });
    return () => unsub();
  }, []);

  // Fetch available AI Models from backend configuration
  useEffect(() => {
    fetch('/api/config/models')
      .then(res => res.json())
      .then(data => {
        if (data.models && Array.isArray(data.models)) {
          setAvailableModels(data.models);
          if (data.activeModel) setActiveModel(data.activeModel);
        }
      })
      .catch(() => {});
  }, []);

  // Sincronización en tiempo real de Memoria Persistente (Firestore + Fallback Local)
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'memories'), orderBy('createdAt', 'desc'));
      const unsubMemories = onSnapshot(q, (snapshot) => {
        const list: SmartMemory[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        if (list.length > 0) {
          setMemories(list);
        }
      }, () => {
        console.warn('Firestore memories offline, using local memory state');
      });
      return () => unsubMemories();
    } catch {
      // Local fallback
    }
  }, [currentUser]);

  // Sincronización en tiempo real de Tareas de Proyectos (Firestore + Fallback Local)
  useEffect(() => {
    if (!currentUser) return;
    try {
      const q = query(collection(db, 'users', currentUser.uid, 'tasks'), orderBy('createdAt', 'desc'));
      const unsubTasks = onSnapshot(q, (snapshot) => {
        const list: ProjectTask[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...(d.data() as any) });
        });
        if (list.length > 0) {
          setTasks(list);
        }
      }, () => {
        console.warn('Firestore tasks offline, using local tasks state');
      });
      return () => unsubTasks();
    } catch {
      // Local fallback
    }
  }, [currentUser]);

  // Local PC Bridge Status & Modal (for real Windows/Mac control)
  const [bridgeStatus, setBridgeStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [bridgeInfo, setBridgeInfo] = useState<{ os?: string; platform?: string; user?: string; isElectron?: boolean }>({});
  const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
  const [copiedCodeType, setCopiedCodeType] = useState<'python' | 'node' | null>(null);

  // Ollama local status & model selection
  const [ollamaOnline, setOllamaOnline] = useState<boolean | null>(null);
  const [ollamaModels, setOllamaModels] = useState<Array<{ name: string; size?: string }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('llama3.2');
  const [isCheckingOllama, setIsCheckingOllama] = useState(false);

  const [logs, setLogs] = useState<AssistantLogEntry[]>([
    {
      id: '1',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      sender: 'SYSTEM',
      text: `[SYSTEM ONLINE]: Núcleo autónomo de ${assistantName} activo en Node.js Express. Diga '${assistantName}' o active el micrófono.`
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const wakeWordRecognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isNeuralRecordingRef = useRef<boolean>(false);
  const [isNeuralRecording, setIsNeuralRecording] = useState(false);
  const [hudMode, setHudMode] = useState<'ALL' | 'VISION' | 'AUDIO' | 'TASKS'>('ALL');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTerminalDrawerOpen, setIsTerminalDrawerOpen] = useState(false);
  const hudContainerRef = useRef<HTMLDivElement | null>(null);

  const toggleFullScreen = () => {
    sciFiAudio.playBlip();
    if (!document.fullscreenElement) {
      if (hudContainerRef.current?.requestFullscreen) {
        hudContainerRef.current.requestFullscreen().catch(() => {});
        setIsFullScreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullScreen(false);
      }
    }
  };

  // Check Local Bridge (Python/Node server on :5000 or Electron window.jarvisDesktopAPI)
  const checkLocalBridge = async () => {
    // 1. Check if running inside native Electron
    if ((window as any).jarvisDesktopAPI?.isElectron) {
      setBridgeStatus('connected');
      try {
        const tele = await (window as any).jarvisDesktopAPI.getTelemetry();
        setBridgeInfo({ isElectron: true, os: tele.platform, user: tele.hostname });
      } catch {
        setBridgeInfo({ isElectron: true, os: 'Desktop Native' });
      }
      return;
    }

    // 2. Check via Node.js Backend Proxy (/api/bridge/status)
    try {
      const proxyRes = await fetch('/api/bridge/status');
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.connected) {
          setBridgeStatus('connected');
          setBridgeInfo(json.data || { os: 'Windows' });
          return;
        }
      }
    } catch {}

    // 3. Fallback direct check (http://localhost:5000/status)
    try {
      const res = await fetch('http://localhost:5000/status', { mode: 'cors' });
      if (res.ok) {
        const data = await res.json();
        setBridgeStatus('connected');
        setBridgeInfo(data);
        return;
      }
    } catch {}

    setBridgeStatus('offline');
  };

  // Dispatch real OS action through Electron or Local Bridge
  const executeRealOSAction = async (action: string, payload: any = {}) => {
    // 1. If running in Electron:
    if ((window as any).jarvisDesktopAPI?.isElectron) {
      const electronAPI = (window as any).jarvisDesktopAPI;
      try {
        if (action === 'open_app') {
          return await electronAPI.openApp(payload.name || payload.target || 'code');
        }
        if (action === 'create_folder') {
          return await electronAPI.createFolder(payload.name || 'Proyectos_JARVIS', payload.parentPath || 'Desktop');
        }
        if (action === 'open_folder') {
          return await electronAPI.openFolder(payload.path || 'Desktop');
        }
        if (action === 'open_url') {
          return await electronAPI.openUrl(payload.url || 'https://google.com');
        }
        if (action === 'set_volume') {
          return await electronAPI.setVolume(payload.level || 50);
        }
        if (action === 'save_note') {
          return await electronAPI.saveNote(payload.title || 'Nota_JARVIS', payload.content || '');
        }
        if (action === 'execute_command') {
          return await electronAPI.executeCommand(payload.command);
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }

    // 2. Try Node backend proxy first (/api/bridge/action)
    try {
      const proxyRes = await fetch('/api/bridge/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (proxyRes.ok) {
        const data = await proxyRes.json();
        return data;
      }
    } catch {}

    // 3. Fallback direct fetch to localhost:5000
    try {
      const res = await fetch('http://localhost:5000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      return { success: false, error: 'No se pudo conectar con el puente local en localhost:5000' };
    }
    return { success: false };
  };

  const handleDownloadBridge = (type: 'python' | 'node') => {
    const code = type === 'python' ? PYTHON_BRIDGE_CODE : NODE_BRIDGE_CODE;
    const filename = type === 'python' ? 'local_bridge.py' : 'local_bridge.js';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    sciFiAudio.playConfirmSound();
  };

  const handleCopyBridgeCode = (type: 'python' | 'node') => {
    const code = type === 'python' ? PYTHON_BRIDGE_CODE : NODE_BRIDGE_CODE;
    navigator.clipboard.writeText(code);
    setCopiedCodeType(type);
    sciFiAudio.playBlip();
    setTimeout(() => setCopiedCodeType(null), 3000);
  };

  // Check Ollama status through Node server
  const checkOllama = async () => {
    setIsCheckingOllama(true);
    try {
      const res = await fetch('/api/ollama/status');
      if (res.ok) {
        const data = await res.json();
        setOllamaOnline(data.online);
        if (data.online) {
          setOllamaModels(data.models || []);
          if (data.models && data.models.length > 0) {
            setSelectedModel(data.models[0].name);
          }
          addLog('SYSTEM', `🦙 [OLLAMA LOCAL ONLINE]: Conectado exitosamente en ${data.endpoint}. Modelos disponibles: ${data.models?.map((m: any) => m.name).join(', ') || 'Ninguno descargado aún'}.`);
        } else {
          addLog('SYSTEM', 'ℹ️ [OLLAMA OFFLINE]: Servidor Ollama no detectado en localhost:11434. Se usará el motor inteligente de fallback.');
        }
      }
    } catch {
      setOllamaOnline(false);
    } finally {
      setIsCheckingOllama(false);
    }
  };

  useEffect(() => {
    checkOllama();
    checkLocalBridge();
    const bridgeInterval = setInterval(() => {
      checkLocalBridge();
    }, 4000);
    return () => clearInterval(bridgeInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll terminal log
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Periodic subtle telemetry fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(prev => ({
        ...prev,
        cpu: Math.min(85, Math.max(12, prev.cpu + Math.floor(Math.random() * 5) - 2)),
        temp: Math.min(58, Math.max(38, prev.temp + (Math.random() > 0.6 ? 1 : -1))),
        ram: Math.min(60, Math.max(30, prev.ram + (Math.random() > 0.7 ? 1 : 0))),
        link: 'NOMINAL 100%'
      }));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const addLog = (
    sender: AssistantLogEntry['sender'], 
    text: string, 
    action?: AssistantAction,
    extra?: {
      knowledgeSource?: 'model_knowledge' | 'internet_research' | 'system_action';
      recalledMemories?: string[];
      sources?: { title: string; url: string; snippet?: string }[];
      toolDetails?: { name: string; params: any; result?: any };
    }
  ) => {
    setLogs(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sender,
        text,
        action,
        knowledgeSource: extra?.knowledgeSource,
        recalledMemories: extra?.recalledMemories,
        sources: extra?.sources,
        toolDetails: extra?.toolDetails
      }
    ]);
  };

  // Real-time WebSocket Protocol & Remote Device Dispatcher
  const { 
    isConnected: isWsConnected, 
    dispatchAction: wsDispatchAction, 
    syncChatLog 
  } = useAtlasWebSocket({
    onRemoteActionReceived: (remoteAction) => {
      sciFiAudio.playConfirmSound();
      addLog('SYSTEM', `⚡ [ORDEN REMOTA RECIBIDA VÍA WEBSOCKET]: Ejecutando "${remoteAction.action}" desde ${remoteAction.sourceDeviceId || 'nodo móvil'}.`);

      if (remoteAction.action === 'open_app' || remoteAction.action === 'abrir_aplicacion') {
        const appName = remoteAction.parameters?.nombre || remoteAction.parameters?.name || 'code';
        executeRealOSAction('open_app', { name: appName });
        setState('speaking');
        if (voiceSettings.autoSpeak && speechSynthesisActiveProp) {
          speakSpanish(`Ejecutando orden remota: Abriendo ${appName}.`, assistantName, voiceSettings);
        }
        setTimeout(() => setState('idle'), 4000);
      } else if (remoteAction.action === 'volumen' || remoteAction.action === 'set_volume') {
        const level = remoteAction.parameters?.level || 60;
        executeRealOSAction('set_volume', { level });
        addLog('SYSTEM', `🔊 Nivel de audio ajustado a ${level}% por enlace remoto.`);
      } else if (remoteAction.action === 'system_health_check') {
        setState('speaking');
        if (voiceSettings.autoSpeak && speechSynthesisActiveProp) {
          speakSpanish('Diagnóstico de subsistemas completado. Enlace de telemetría nominal.', assistantName, voiceSettings);
        }
        setTimeout(() => setState('idle'), 3000);
      }
    },
    onAssistantBroadcast: (broadcast) => {
      if (broadcast && broadcast.speech) {
        addLog(assistantName, broadcast.speech, broadcast.action, {
          sources: broadcast.sources,
          toolDetails: broadcast.parameters ? { name: broadcast.action, params: broadcast.parameters } : undefined
        });
      }
    },
    onChatLogSync: (entry) => {
      if (entry && entry.text) {
        setLogs(prev => [...prev, entry]);
      }
    }
  });

  // Process command through Backend Server & Real OS Bridge
  const processCommand = async (command: string) => {
    if (!command.trim()) return;

    setState('thinking');
    addLog('USER', command);
    sciFiAudio.playBlip();

    const lowerCmd = command.toLowerCase();

    // 1. Detectar si el usuario pide buscar en internet explícitamente
    const isSearchIntent = lowerCmd.includes('busca en internet') || 
                           lowerCmd.includes('buscar en internet') || 
                           lowerCmd.includes('busca en google') || 
                           lowerCmd.includes('investiga sobre') || 
                           lowerCmd.includes('noticias de') ||
                           lowerCmd.includes('que paso hoy') ||
                           lowerCmd.includes('clima en') ||
                           lowerCmd.includes('precio de');

    if (isSearchIntent && securityPermissions.allowWebSearch) {
      try {
        setState('searching');
        sciFiAudio.playConfirmSound();
        addLog('SYSTEM', `🌐 [INVESTIGACIÓN EN TIEMPO REAL]: Conectando con fuentes de Internet...`);

        const searchQuery = command
          .replace(/busca en internet/gi, '')
          .replace(/buscar en internet/gi, '')
          .replace(/busca en google/gi, '')
          .replace(/investiga sobre/gi, '')
          .trim() || command;

        const webRes = await fetch('/api/web/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery })
        });

        if (webRes.ok) {
          const webData = await webRes.json();
          const answer = webData.answer || webData.summary || 'Información obtenida de la red, señor.';
          
          if (webData.sources && Array.isArray(webData.sources)) {
            setSearchResults(webData.sources.map((s: any, idx: number) => ({
              id: `src-${Date.now()}-${idx}`,
              title: s.title || `Fuente ${idx + 1}`,
              snippet: s.snippet || answer.slice(0, 160) + '...',
              url: s.url || '#',
              source: 'Investigación en Red',
              publishedDate: 'Tiempo Real',
              timestamp: 'Ahora'
            })));
          }

          setState('completed');

          addLog(assistantName, answer, {
            type: 'web_search',
            label: `Búsqueda Web: ${searchQuery}`,
            description: webData.quotaFallback ? 'Modo contingencia autónomo' : `Fuentes consultadas: ${webData.sources?.length || 0}`
          }, {
            knowledgeSource: 'internet_research',
            sources: webData.sources && Array.isArray(webData.sources) ? webData.sources : []
          });

          // Sincronizar en Firestore si el usuario está autenticado
          if (currentUser) {
            try {
              await addDoc(collection(db, 'users', currentUser.uid, 'notes'), {
                title: `Búsqueda: ${searchQuery.slice(0, 30)}...`,
                content: answer,
                createdAt: new Date().toISOString(),
                syncedFrom: 'Atlas Cockpit'
              });
            } catch (e) {
              console.error('Error guardando nota de búsqueda en Firestore:', e);
            }
          }

          if (speechSynthesisActive) {
            setState('speaking');
            setVoiceVolume(0.85);
            speakSpanish(answer, assistantName, voiceSettings, () => {
              setState('idle');
              setVoiceVolume(0);
            });
          } else {
            setTimeout(() => setState('idle'), 2000);
          }
          return;
        }
      } catch (searchErr) {
        console.warn('Fallo en búsqueda web, recurriendo a LLM:', searchErr);
      }
    }

    // 2. Detectar si el usuario pide guardar una nota o recordatorio
    if ((lowerCmd.startsWith('guarda una nota') || lowerCmd.startsWith('crea una nota') || lowerCmd.startsWith('anota')) && currentUser) {
      try {
        const noteText = command.replace(/^(guarda una nota|crea una nota|anota)/i, '').replace(/^(llamada|titulada|sobre)?/i, '').trim();
        await addDoc(collection(db, 'users', currentUser.uid, 'notes'), {
          title: noteText.slice(0, 25) || 'Nota Rápida',
          content: noteText,
          createdAt: new Date().toISOString(),
          syncedFrom: 'Voz / Terminal'
        });

        const resp = `He guardado su nota en la nube, señor. Ya está disponible en su teléfono y en este panel.`;
        addLog(assistantName, resp);
        if (speechSynthesisActive) {
          setState('speaking');
          speakSpanish(resp, assistantName, voiceSettings, () => setState('idle'));
        } else {
          setState('idle');
        }
        return;
      } catch (e) {
        console.error('Error guardando nota en Firestore:', e);
      }
    }

    try {
      // Interrupción de voz si ATLAS está hablando
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking && voiceSettings.interruptOnSpeech) {
        window.speechSynthesis.cancel();
      }

      setState('thinking');

      // Intentar identificar menciones de temas guardados en memoria central
      const matchedMemories = memories.filter(m => {
        const t = (m.topic || '').toLowerCase();
        return t.length >= 3 && lowerCmd.includes(t);
      }).map(m => m.topic);

      const res = await fetch('/api/assistant/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: command,
          assistantName,
          preferredModel: activeModel,
          memories: memories.slice(0, 15).map(m => ({ topic: m.topic, content: m.content, category: m.category })),
          tasks: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, priority: t.priority })),
          history: logs.slice(-5).map(l => ({ role: l.sender.toLowerCase(), text: l.text })),
          customApps,
          customFunctions
        })
      });

      const data = await res.json();

      // Tool call detection & real execution
      const toolName = data.action || data.tool_details?.name || 'NONE';
      const toolArgs = data.parameters || data.tool_details?.args || {};

      if (toolName !== 'NONE') {
        setState('executing');
        sciFiAudio.playConfirmSound();
        setLastExecutedTool({
          name: toolName,
          args: toolArgs,
          description: data.message || `Ejecutando ${toolName}`
        });
        addLog('SYSTEM', `⚡ [HERRAMIENTA IA]: ${toolName}`, data.action);

        // A. Guardar Recuerdo en Memoria Persistente
        if (toolName === 'guardar_recuerdo') {
          const topic = toolArgs.topic || toolArgs.tema || command.slice(0, 30);
          const content = toolArgs.content || toolArgs.contenido || command;
          try {
            await addDoc(collection(db, 'memories'), {
              topic,
              content,
              category: toolArgs.category || 'general',
              createdAt: new Date().toISOString()
            });
            addLog('SYSTEM', `🧠 [MEMORIA SINCRONIZADA]: Recuerdo sobre '${topic}' guardado en la nube.`);
          } catch (memErr) {
            // Fallback local memory state
            const newMem: SmartMemory = {
              id: Date.now().toString(),
              topic,
              content,
              category: 'general',
              createdAt: new Date().toISOString()
            };
            setMemories(prev => [newMem, ...prev]);
          }
        }

        // B. Crear Tarea de Proyecto
        else if (toolName === 'crear_tarea') {
          const title = toolArgs.titulo || toolArgs.title || command.slice(0, 40);
          const description = toolArgs.descripcion || toolArgs.description || '';
          try {
            await addDoc(collection(db, 'tasks'), {
              title,
              description,
              status: 'pending',
              priority: 'medium',
              createdAt: new Date().toISOString()
            });
            addLog('SYSTEM', `📋 [TAREA CREADA]: '${title}' añadida a la lista de proyectos.`);
          } catch {
            const newTask: ProjectTask = {
              id: Date.now().toString(),
              title,
              description,
              status: 'pending',
              priority: 'medium',
              createdAt: new Date().toISOString()
            };
            setTasks(prev => [newTask, ...prev]);
          }
        }

        // C. Búsqueda en Internet enriquecida con fuentes
        else if (toolName === 'buscar_en_internet' || toolName === 'buscar_documentacion') {
          if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
            setSearchResults(data.sources.map((s: any, idx: number) => ({
              id: `src-${idx}`,
              title: s.title || 'Fuente Verificada',
              snippet: s.title || '',
              url: s.url || '',
              source: 'Investigación en Red',
              timestamp: 'Reciente'
            })));
            setActiveTab('search');
          }
        }

        // D. Control de Aplicaciones (Personalizadas y del Sistema)
        else if (toolName === 'open_application' || toolName === 'abrir_aplicacion') {
          const targetRaw = toolArgs.target || toolArgs.app_name || toolArgs.nombre || (command.toLowerCase().includes('code') ? 'code' : 'chrome');
          const matchedApp = customApps.find(a => 
            a.name.toLowerCase() === String(targetRaw).toLowerCase() ||
            (a.target && a.target.toLowerCase() === String(targetRaw).toLowerCase()) ||
            (a.voiceAliases && a.voiceAliases.some(alias => command.toLowerCase().includes(alias.toLowerCase())))
          );

          const finalTarget = matchedApp ? matchedApp.target : targetRaw;
          const finalName = matchedApp ? matchedApp.name : targetRaw;

          if (finalTarget && (finalTarget.startsWith('http://') || finalTarget.startsWith('https://'))) {
            addLog('SYSTEM', `🌐 [APLICACIÓN WEB]: Despachando '${finalName}' (${finalTarget}).`);
            try {
              window.open(finalTarget, '_blank', 'noopener,noreferrer');
            } catch {}
          } else if (bridgeStatus === 'connected' && securityPermissions.allowOpenApps) {
            const bridgeRes = await executeRealOSAction('open_app', { name: finalTarget });
            if (bridgeRes?.success) {
              addLog('SYSTEM', `🟢 [WINDOWS REAL]: Programa '${finalName}' ejecutado exitosamente en tu PC.`);
            } else {
              addLog('SYSTEM', `⚠️ [LANZADOR]: No se pudo iniciar '${finalName}' en PC local.`);
            }
          } else {
            addLog('SYSTEM', `🖥️ [LANZADOR ATLAS]: Orden de apertura enviada para '${finalName}'.`);
          }
        }

        // E. Funciones y Rutinas Tácticas Personalizadas
        const matchedCustomFunc = customFunctions.find(f => 
          f.name === toolName || 
          f.title.toLowerCase() === toolName.toLowerCase() ||
          (f.triggerPhrases && f.triggerPhrases.some(tp => command.toLowerCase().includes(tp.toLowerCase())))
        );

        if (matchedCustomFunc) {
          addLog('SYSTEM', `⚡ [RUTINA PERSONALIZADA]: Ejecutando '${matchedCustomFunc.title}'`);
          
          // Ejecutar pasos de macro en secuencia
          if (matchedCustomFunc.payload.macroSteps && matchedCustomFunc.payload.macroSteps.length > 0) {
            matchedCustomFunc.payload.macroSteps.forEach((step, sIdx) => {
              setTimeout(() => {
                sciFiAudio.playBlip();
                addLog('SYSTEM', `  ↳ [Paso ${sIdx + 1}/${matchedCustomFunc.payload.macroSteps!.length}]: ${step}`);
              }, (sIdx + 1) * 350);
            });
          }

          // Si la función abre una app específica
          if (matchedCustomFunc.payload.appTarget && securityPermissions.allowOpenApps) {
            const appTarget = matchedCustomFunc.payload.appTarget;
            if (appTarget.startsWith('http://') || appTarget.startsWith('https://')) {
              window.open(appTarget, '_blank', 'noopener,noreferrer');
            } else if (bridgeStatus === 'connected') {
              executeRealOSAction('open_app', { name: appTarget });
            }
          }
        }

        // F. Archivos y Carpetas del Sistema
        if (bridgeStatus === 'connected') {
          if ((toolName === 'create_directory' || toolName === 'crear_carpeta') && securityPermissions.allowCreateFiles) {
            const folder = toolArgs.dir_name || toolArgs.nombre || 'Proyectos_Atlas';
            const bridgeRes = await executeRealOSAction('create_folder', { name: folder });
            if (bridgeRes?.success) {
              addLog('SYSTEM', `🟢 [WINDOWS REAL]: Carpeta física creada en Escritorio: ${bridgeRes.path || folder}`);
            }
          }
        }
      }

      // Requerimiento de Confirmación de Seguridad
      if (data.requires_confirmation && securityPermissions.requireConfirmForTerminal) {
        setPendingConfirmation({
          target: data.confirmation_target || 'Operación Crítica',
          description: data.message || 'Esta acción requiere confirmación expresa de seguridad.'
        });
      }

      // Respuesta de voz sintetizada natural
      const responseSpeech = data.speech || data.message || `Comprendido. He procesado tu solicitud: ${command}`;
      
      setState('completed');

      addLog(assistantName, responseSpeech, data.action, {
        knowledgeSource: data.tool_details?.name === 'web_search' || (data.sources && data.sources.length > 0) 
          ? 'internet_research' 
          : 'model_knowledge',
        recalledMemories: matchedMemories && matchedMemories.length > 0 ? matchedMemories : undefined,
        sources: data.sources && Array.isArray(data.sources) ? data.sources : undefined,
        toolDetails: toolName !== 'NONE' ? { name: toolName, params: toolArgs } : undefined
      });

      if (speechSynthesisActive) {
        setState('speaking');
        setVoiceVolume(0.85);
        speakSpanish(responseSpeech, assistantName, voiceSettings, () => {
          setState('idle');
          setVoiceVolume(0);
          // Modo de conversación continua: reabrir micrófono si está habilitado
          if (voiceSettings.continuousConversation && !isMicActive) {
            setTimeout(() => toggleMicrophone(), 500);
          }
        });
      } else {
        setTimeout(() => setState('idle'), 2000);
      }

    } catch (err: any) {
      console.error('Error in assistant processing:', err);
      setState('error');
      addLog('SYSTEM', `Fallo de comunicación con la red neural: ${err.message}`);
      setTimeout(() => setState('idle'), 3000);
    }
  };

  // Confirmation resolution
  const handleConfirmation = async (approved: boolean) => {
    if (!pendingConfirmation) return;
    const target = pendingConfirmation.target;
    setPendingConfirmation(null);

    try {
      const res = await fetch('/api/assistant/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target, approved })
      });
      const data = await res.json();
      
      if (approved) {
        sciFiAudio.playConfirmSound();
        addLog('SYSTEM', `🛡️ [CONFIRMADO]: ${data.message}`);
      } else {
        sciFiAudio.playBlip();
        addLog('SYSTEM', `❌ [CANCELADO]: ${data.message}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper: Analizar volumen de audio en vivo para iluminar el Reactor de Arco
  const startAudioAnalyser = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(1, avg / 70);
        setVoiceVolume(normalized);
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (e) {
      console.warn('Could not start audio analyser:', e);
    }
  };

  const stopAudioAnalyser = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setVoiceVolume(0);
  };

  // Helper: Detener todas las fuentes de audio y micrófono
  const stopAllAudioCapture = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort ? recognitionRef.current.abort() : recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (audioStreamRef.current) {
      try {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
      } catch {}
      audioStreamRef.current = null;
    }
    stopAudioAnalyser();
    setIsMicActive(false);
    setIsNeuralRecording(false);
    isNeuralRecordingRef.current = false;
  };

  // Fallback: Grabación directa con MediaRecorder y transcripción con Gemini Audio
  const startAudioRecordingFallback = (stream: MediaStream) => {
    try {
      audioChunksRef.current = [];
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stopAudioAnalyser();
        if (audioStreamRef.current) {
          try {
            audioStreamRef.current.getTracks().forEach(t => t.stop());
          } catch {}
          audioStreamRef.current = null;
        }

        const recordedBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recordedBlob.size < 500) {
          setIsMicActive(false);
          setIsNeuralRecording(false);
          isNeuralRecordingRef.current = false;
          setState('idle');
          return;
        }

        setState('thinking');
        addLog('SYSTEM', '🧠 [RED NEURAL STARK]: Procesando audio HD con Gemini...');

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          try {
            const res = await fetch('/api/assistant/transcribe-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                audioData: base64Data, 
                mimeType: recorder.mimeType || 'audio/webm' 
              })
            });
            const data = await res.json();
            if (data.success && data.transcript && data.transcript.trim()) {
              addLog('SYSTEM', `🎙️ [ORDEN RECONOCIDA]: "${data.transcript}"`);
              processCommand(data.transcript);
            } else {
              addLog('SYSTEM', 'ℹ️ No se detectó una orden clara en el audio. Puedes volver a pulsar el micrófono o escribirla.');
              setState('idle');
            }
          } catch (transErr: any) {
            console.error('Error transcribing audio:', transErr);
            addLog('SYSTEM', `⚠️ Error al procesar audio: ${transErr.message}`);
            setState('idle');
          } finally {
            setIsMicActive(false);
            setIsNeuralRecording(false);
            isNeuralRecordingRef.current = false;
          }
        };
        reader.readAsDataURL(recordedBlob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setIsMicActive(true);
      setIsNeuralRecording(true);
      isNeuralRecordingRef.current = true;
      setState('listening');
      sciFiAudio.playActivationChime();
      addLog('SYSTEM', `[MIC NEURAL ACTIVO]: Grabando orden de voz... (Vuelve a presionar el micrófono para procesar).`);
    } catch (err: any) {
      console.error('Error starting MediaRecorder fallback:', err);
      addLog('SYSTEM', `⚠️ Error de captura de audio: ${err.message}`);
      setIsMicActive(false);
      setIsNeuralRecording(false);
      isNeuralRecordingRef.current = false;
      setState('idle');
    }
  };

  // Speech Recognition & Wake Word Setup
  const toggleMicrophone = async () => {
    if (isMicActive || isNeuralRecording) {
      stopAllAudioCapture();
      return;
    }

    // 1. Solicitar acceso al micrófono de hardware del dispositivo
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        startAudioAnalyser(stream);
      }
    } catch (permErr: any) {
      console.warn('Microphone permission error:', permErr);
      addLog('SYSTEM', '⚠️ [MIC BLOQUEADO]: Permiso de micrófono no concedido. Permite el acceso al micrófono en tu navegador o sistema.');
      return;
    }

    // 2. Intentar Web Speech API nativo
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      if (stream) {
        startAudioRecordingFallback(stream);
      } else {
        addLog('SYSTEM', '⚠️ Micrófono no disponible en este entorno.');
      }
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'es-ES';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsMicActive(true);
        setState('listening');
        try {
          sciFiAudio.playActivationChime();
        } catch {}
        addLog('SYSTEM', `[MIC ACTIVO]: Escuchando orden para ${assistantName}...`);
      };

      recognition.onresult = (event: any) => {
        stopAllAudioCapture();
        try {
          if (event.results && event.results[0] && event.results[0][0]) {
            const transcript = event.results[0][0].transcript.trim();
            addLog('SYSTEM', `🎙️ [VOZ DETECTADA]: "${transcript}"`);
            
            const normalized = transcript.toLowerCase().replace(/[.,!¡?¿]/g, '').trim();
            
            // Flujo de palabra clave: Usuario dice sólo "Atlas" u "Oye Atlas"
            if (normalized === 'atlas' || normalized === 'oye atlas' || normalized === 'hola atlas') {
              sciFiAudio.playConfirmSound();
              const wakeResponse = '¿Sí? Dime en qué puedo ayudarte.';
              addLog(assistantName, wakeResponse);
              if (speechSynthesisActive) {
                setState('speaking');
                speakSpanish(wakeResponse, assistantName, voiceSettings, () => {
                  setState('listening');
                  // Reabrir micrófono para escuchar la orden siguiente
                  setTimeout(() => toggleMicrophone(), 200);
                });
              } else {
                setTimeout(() => toggleMicrophone(), 300);
              }
              return;
            }

            processCommand(transcript);
          }
        } catch (err: any) {
          console.error('Error processing speech transcript:', err);
          setState('idle');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        
        // Si es error de red o bloqueado por Chromium/Electron sin API key, conmutar a grabación neural
        if ((event.error === 'network' || event.error === 'service-not-allowed') && stream) {
          addLog('SYSTEM', '⚡ [CONMUTACIÓN AUTOMÁTICA]: Activando captura neural de audio con Gemini...');
          startAudioRecordingFallback(stream);
          return;
        }

        stopAllAudioCapture();
        setState('idle');
        if (event.error === 'not-allowed') {
          addLog('SYSTEM', '⚠️ [MIC BLOQUEADO]: El navegador o sistema bloqueó el micrófono.');
        } else if (event.error !== 'no-speech') {
          addLog('SYSTEM', `⚠️ Aviso de micrófono (${event.error}). Puedes volver a presionar para reintentar.`);
        }
      };

      recognition.onend = () => {
        if (!isNeuralRecordingRef.current) {
          stopAllAudioCapture();
          if (state === 'listening') {
            setState('idle');
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error('Error starting speech recognition:', e);
      if (stream) {
        startAudioRecordingFallback(stream);
      } else {
        stopAllAudioCapture();
        setState('idle');
        addLog('SYSTEM', `⚠️ Error al iniciar micrófono: ${e?.message || 'Fallo de audio'}`);
      }
    }
  };

  // Continuous Wake Word Listener ("Jarvis" or "Viernes")
  const toggleContinuousWakeWord = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      addLog('SYSTEM', '⚠️ Web Speech API no disponible para escucha continua en segundo plano.');
      return;
    }

    if (isWakeWordListening) {
      try {
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.abort ? wakeWordRecognitionRef.current.abort() : wakeWordRecognitionRef.current.stop();
        }
      } catch {}
      wakeWordRecognitionRef.current = null;
      setIsWakeWordListening(false);
      addLog('SYSTEM', 'Modo de escucha continua de Hotword detenido.');
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsWakeWordListening(true);
        try {
          sciFiAudio.playConfirmSound();
        } catch {}
        addLog('SYSTEM', `[HOTWORD ACTIVO]: Escuchando continuamente la palabra clave '${assistantName.toLowerCase()}'...`);
      };

      recognition.onresult = (event: any) => {
        try {
          const lastIndex = event.results.length - 1;
          const text = event.results[lastIndex][0].transcript.toLowerCase();

          const triggerWord = assistantName.toLowerCase();
          if (
            text.includes(triggerWord) || 
            text.includes('atlas') || 
            text.includes('atla')
          ) {
            try {
              sciFiAudio.playActivationChime();
            } catch {}
            addLog('SYSTEM', `¡Palabra clave reconocida en audio: "${text}"!`);
            const cleanCommand = text.replace(new RegExp(`(oye|hey|por favor|ok)?\\s*(atlas|atla)`, 'gi'), '').trim();
            if (cleanCommand.length > 2) {
              processCommand(cleanCommand);
            } else {
              setState('listening');
              addLog(assistantName, `¿A su servicio, señor? Le escucha ${assistantName}.`);
              speakSpanish(`A su servicio, señor. Le escucha ${assistantName}.`, assistantName, voiceSettings, () => {
                toggleMicrophone();
              });
            }
          }
        } catch (recErr) {
          console.error('Wake word processing error:', recErr);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech') {
          console.warn('Wake word recognition error:', e);
        }
        if (e.error === 'not-allowed') {
          setIsWakeWordListening(false);
          addLog('SYSTEM', '⚠️ [MIC BLOQUEADO]: Permiso de micrófono no concedido.');
        }
      };

      recognition.onend = () => {
        if (isWakeWordListening) {
          try {
            recognition.start();
          } catch {
            setIsWakeWordListening(false);
          }
        }
      };

      wakeWordRecognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setIsWakeWordListening(false);
    }
  };

  const quickPrompts = [
    { label: '🌐 Busca en Internet', prompt: 'Busca en internet las últimas noticias sobre inteligencia artificial' },
    { label: '📝 Guardar Nota en la Nube', prompt: 'Guarda una nota llamada Proyecto Atlas con el estado del sistema actual' },
    { label: '💻 Abre VS Code', prompt: 'Abre Visual Studio Code' },
    { label: '📁 Crea Carpeta Proyectos', prompt: 'Crea una carpeta llamada Proyectos_Atlas' },
    { label: '📊 Diagnóstico de Hardware', prompt: 'Dame el estado del sistema y telemetría de CPU' },
    { label: '⚠️ Borra Carpeta (Seguridad)', prompt: 'Borra la carpeta datos_temporales' }
  ];

  // Image analysis handler from dropzone / upload
  const handleImageSelected = async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setState('thinking');
      addLog('USER', `🖼️ [IMAGEN SELECCIONADA]: ${file.name}`);
      sciFiAudio.playConfirmSound();

      try {
        const res = await fetch('/api/assistant/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageData: base64,
            prompt: 'Analiza detalladamente lo que ves en esta imagen táctica como ATLAS Core.'
          })
        });
        const data = await res.json();
        const analysisText = data.analysis || 'Escaneo óptico procesado con éxito.';
        addLog(assistantName, analysisText);
        setState('speaking');
        if (voiceSettings.autoSpeak && speechSynthesisActiveProp) {
          speakSpanish(analysisText, assistantName, voiceSettings);
        }
      } catch {
        const fallback = `Escaneo de ${file.name} finalizado. Datos visuales procesados por ATLAS.`;
        addLog(assistantName, fallback);
        setState('speaking');
        if (voiceSettings.autoSpeak && speechSynthesisActiveProp) {
          speakSpanish(fallback, assistantName, voiceSettings);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick Action triggers
  const handleQuickAction = (actionType: string) => {
    switch (actionType) {
      case 'investigar':
        processCommand('Busca en internet las últimas tecnologías para desarrollo de software y sistemas SaaS en 2026');
        break;
      case 'programar':
        processCommand('Ayúdame a programar: explícame la arquitectura recomendada para un asistente de IA con frontend en React y backend en Node.js');
        break;
      case 'proyecto':
        processCommand('Dame el estado actual de los proyectos y tareas pendientes registradas en ATLAS Core');
        break;
      case 'tareas':
        setNavSection('tareas');
        break;
      default:
        break;
    }
  };

  // Toggle task completion
  const handleToggleTask = async (taskId: string) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newStatus = t.status === 'completed' ? ('pending' as const) : ('completed' as const);
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTasks(updated);
    try {
      localStorage.setItem('atlas_tasks', JSON.stringify(updated));
    } catch {}

    if (currentUser) {
      try {
        const taskDoc = doc(db, 'users', currentUser.uid, 'tasks', taskId);
        const targetTask = updated.find(t => t.id === taskId);
        if (targetTask) {
          await updateDoc(taskDoc, { status: targetTask.status });
        }
      } catch {
        // Local fallback
      }
    }
  };

  // Add new task
  const handleAddNewTask = async (title: string, priority: 'low' | 'medium' | 'high') => {
    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title,
      priority,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    const updatedTasks = [newTask, ...tasks];
    setTasks(updatedTasks);
    try {
      localStorage.setItem('atlas_tasks', JSON.stringify(updatedTasks));
    } catch {}

    if (currentUser) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'tasks'), {
          title,
          priority,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
      } catch {
        // Local fallback
      }
    }
    addLog('SYSTEM', `📋 [NUEVA TAREA]: '${title}' añadida a la lista.`);
  };

  // Add new memory
  const handleAddMemory = async (title: string, content: string, category: string = 'general') => {
    const validCategory: 'project' | 'personal' | 'preference' | 'system' | 'general' = 
      (['project', 'personal', 'preference', 'system', 'general'].includes(category) ? category : 'general') as any;
    const newMem: SmartMemory = {
      id: `mem-${Date.now()}`,
      topic: title,
      title,
      content,
      category: validCategory,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidenceScore: 1.0
    };
    const updatedMems = [newMem, ...memories];
    setMemories(updatedMems);
    try {
      localStorage.setItem('atlas_memories', JSON.stringify(updatedMems));
    } catch {}

    if (currentUser) {
      try {
        await addDoc(collection(db, 'users', currentUser.uid, 'memories'), {
          title,
          content,
          category: validCategory,
          createdAt: new Date().toISOString()
        });
      } catch {
        // Local fallback
      }
    }
    addLog('SYSTEM', `🧠 [MEMORIA GUARDADA]: '${title}' registrada permanentemente.`);
  };

  // Delete memory
  const handleDeleteMemory = async (id: string) => {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    try {
      localStorage.setItem('atlas_memories', JSON.stringify(updated));
    } catch {}

    if (currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'memories', id));
      } catch {
        // Local fallback
      }
    }
  };

  // Test app or function directly in the HUD
  const handleTestAppOrFunction = (nameOrTitle: string, type: 'app' | 'function') => {
    setIsSettingsOpen(false);
    if (type === 'app') {
      const app = customApps.find(a => a.name === nameOrTitle || a.target === nameOrTitle);
      const cmd = app?.voiceAliases?.[0] || `Abre ${nameOrTitle}`;
      addLog('USER', cmd);
      processCommand(cmd);
    } else {
      const func = customFunctions.find(f => f.name === nameOrTitle || f.title === nameOrTitle);
      const cmd = func?.triggerPhrases?.[0] || func?.title || nameOrTitle;
      addLog('USER', cmd);
      processCommand(cmd);
    }
  };

  // Render unified Atlas HUD for ALL sections (Inicio, Conversación, Investigación, Proyectos, Tareas, Memoria, Archivos, Visión)
  return (
    <div className="w-full h-full relative">
      <AtlasDashboard
        theme={theme}
        assistantName={assistantName}
        state={state}
        voiceVolume={voiceVolume}
        isListening={isMicActive}
        command={inputText}
        onCommandChange={setInputText}
        onExecuteCommand={(cmd) => {
          const finalCmd = cmd || inputText;
          if (finalCmd) {
            processCommand(finalCmd);
            setInputText('');
          }
        }}
        onToggleMic={toggleMicrophone}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBridgeModal={() => {
          setIsBridgeModalOpen(true);
          checkLocalBridge();
        }}
        volumeLevel={voiceSettings.volume}
        onChangeVolume={(vol) => setVoiceSettings(prev => ({ ...prev, volume: vol }))}
        tasks={tasks}
        onToggleTask={handleToggleTask}
        memories={memories}
        logs={logs}
        userName={currentUser?.displayName || 'Josías'}
        activeNav={navSection}
        onSelectNav={(nav) => {
          if (nav === 'ajustes') {
            setIsSettingsOpen(true);
          } else {
            setNavSection(nav as any);
          }
        }}
        onQuickAction={handleQuickAction}
        onSearchSubmit={(q) => {
          processCommand(`Busca en internet información sobre: ${q}`);
        }}
        onImageSelected={handleImageSelected}
        onAddNewTask={handleAddNewTask}
        onAddMemory={handleAddMemory}
        onDeleteMemory={handleDeleteMemory}
        onRunProtocol={(proto) => {
          addLog('USER', `Activando ${proto}`);
          addLog(assistantName, `Protocolo ${proto} activado. Parámetros de seguridad optimizados.`);
        }}
        searchResults={searchResults}
        onExecuteBridgeAction={executeRealOSAction}
        bridgeStatus={bridgeStatus}
        isWsConnected={isWsConnected}
        voiceSettings={voiceSettings}
        activeModel={activeModel}
        onClearLogs={() => setLogs([])}
        customApps={customApps}
        onUpdateCustomApps={setCustomApps}
        customFunctions={customFunctions}
        onUpdateCustomFunctions={setCustomFunctions}
        onTestAppOrFunction={handleTestAppOrFunction}
      />

        {/* Local PC Bridge Modal */}
        {isBridgeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="relative w-full max-w-2xl bg-[#030816] border border-[#00f2ff66] rounded-xl p-6 shadow-[0_0_50px_rgba(0,242,255,0.25)] space-y-4">
              <div className="flex items-center justify-between border-b border-[#00f2ff33] pb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-5 h-5 text-[#00f2ff]" />
                  <h3 className="text-base font-bold text-white">CONTROL LOCAL DE TU PC (WINDOWS / MAC / LINUX)</h3>
                </div>
                <button onClick={() => setIsBridgeModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-3">
                <p>
                  Para que ATLAS ejecute programas reales como VS Code o Google Chrome en tu ordenador local, descarga y corre el puente local:
                </p>
                <div className="bg-black/80 border border-slate-700 p-3 rounded-lg font-mono text-[11px] text-cyan-300">
                  python -m http.server 5000 # o ejecuta el script puente ATLAS
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const res = await executeRealOSAction('open_app', { name: 'code' });
                      if (res?.success) addLog('SYSTEM', '🟢 [TEST REAL]: Visual Studio Code abierto en tu PC.');
                    }}
                    className="flex-1 p-2 rounded-lg bg-[#00f2ff22] border border-[#00f2ff] text-white text-xs font-bold hover:bg-[#00f2ff44] cursor-pointer"
                  >
                    💻 Probar abrir VS Code
                  </button>
                  <button
                    onClick={async () => {
                      const res = await executeRealOSAction('open_app', { name: 'chrome' });
                      if (res?.success) addLog('SYSTEM', '🟢 [TEST REAL]: Google Chrome abierto.');
                    }}
                    className="flex-1 p-2 rounded-lg bg-[#00f2ff22] border border-[#00f2ff] text-white text-xs font-bold hover:bg-[#00f2ff44] cursor-pointer"
                  >
                    🌐 Probar abrir Chrome
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[#00f2ff33] flex justify-end">
                <button
                  onClick={() => setIsBridgeModalOpen(false)}
                  className="px-4 py-2 bg-[#00f2ff] text-black font-bold text-xs rounded-lg cursor-pointer"
                >
                  CERRAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security / Critical Action Confirmation Modal */}
        {pendingConfirmation && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#050b1a] border-2 border-amber-500/80 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Autorización de Seguridad Requerida
                  </h3>
                  <p className="text-[11px] text-amber-400/80 font-mono">
                    PROTOCOL // CRITICAL_OPERATION_INTERCEPT
                  </p>
                </div>
              </div>

              <div className="bg-[#030712] border border-white/10 rounded-xl p-3.5 mb-5 space-y-2">
                <div className="text-xs text-slate-300 font-sans leading-relaxed">
                  {pendingConfirmation.description}
                </div>
                <div className="text-[10px] font-mono text-slate-400 bg-black/50 px-2.5 py-1 rounded border border-white/5">
                  <span className="text-amber-400 font-bold">OBJETIVO: </span>
                  {pendingConfirmation.target}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => handleConfirmation(false)}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => handleConfirmation(true)}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-amber-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer"
                >
                  CONFIRMAR Y AUTORIZAR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          voiceSettings={voiceSettings}
          onUpdateVoiceSettings={setVoiceSettings}
          securityPermissions={securityPermissions}
          onUpdatePermissions={setSecurityPermissions}
          activeModel={activeModel}
          availableModels={availableModels}
          customApps={customApps}
          onUpdateCustomApps={setCustomApps}
          customFunctions={customFunctions}
          onUpdateCustomFunctions={setCustomFunctions}
          onTestAppOrFunction={handleTestAppOrFunction}
          onSelectModel={(mod) => {
            setActiveModel(mod);
            addLog('SYSTEM', `🧠 [NÚCLEO IA CAMBIADO]: Modelo activo ahora es '${mod}'`);
          }}
          onTestVoice={() => {
            speakSpanish('Voz de sintetización de Atlas modulada correctamente, señor.', assistantName, voiceSettings);
          }}
        />
      </div>
    );
};
