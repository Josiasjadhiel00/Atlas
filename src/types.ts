export type AssistantTheme = 'cyan' | 'gold' | 'emerald';
export type AssistantState = 'idle' | 'listening' | 'thinking' | 'searching' | 'executing' | 'speaking' | 'completed' | 'error' | 'offline';
export type AssistantVoiceName = 'Atlas';

export type AIModelOption = 
  | 'llama-3.3-70b-versatile'
  | 'llama-3.1-8b-instant'
  | 'gpt-4o-mini'
  | 'gpt-4o'
  | 'gemini-3.8-flash'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-flash-latest'
  | string;

export type GeminiModelOption = AIModelOption;

export interface AssistantAction {
  type: string;
  target?: string;
  description?: string;
  label?: string;
  parameters?: Record<string, any>;
}

export interface SmartMemory {
  id: string;
  topic: string;
  title?: string;
  content: string;
  category: 'project' | 'personal' | 'preference' | 'system' | 'general';
  createdAt: string;
  updatedAt?: string;
  confidenceScore?: number;
}

export interface ProjectTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
}

export interface AssistantDiagnostic {
  confidence?: number;
  intent?: string;
  cpu_load_simulated?: string;
  core_temp?: string;
  memory_usage?: string;
  active_model?: string;
  latency_ms?: number;
}

export interface AssistantLogEntry {
  id: string;
  timestamp: string;
  sender: 'USER' | 'SYSTEM' | 'Atlas';
  text: string;
  action?: AssistantAction;
  state?: AssistantState;
  sources?: { title: string; url: string; snippet?: string }[];
  knowledgeSource?: 'model_knowledge' | 'internet_research' | 'system_action';
  recalledMemories?: string[];
  toolDetails?: { name: string; params: any; result?: any };
}

export interface PythonFileDefinition {
  path: string;
  filename: string;
  category: 'core' | 'gui' | 'voice' | 'brain' | 'config' | 'scripts';
  description: string;
  code: string;
  language: string;
}

export interface VoiceSettings {
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.7 to 1.5
  volume: number; // 0 to 1
  voiceURI?: string;
  lang: string;
  autoSpeak: boolean;
  continuousConversation: boolean;
  interruptOnSpeech: boolean;
  wakeWordEnabled?: boolean;
}

export interface SecurityPermissions {
  allowWebSearch: boolean;
  allowOpenApps: boolean;
  allowCreateFiles: boolean;
  allowSystemVolume: boolean;
  allowTerminalExecution: boolean;
  requireConfirmForTerminal: boolean;
  allowedApps: string[];
  allowedDirectories: string[];
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet?: string;
  publishedDate?: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  syncedFrom?: 'PC' | 'PHONE' | 'WEB';
}

export interface CustomApplication {
  id: string;
  name: string; // Identifier & display name (e.g. "Blender", "Discord", "Steam", "Photoshop", "Notion", "Figma", "Spotify", "OBS Studio", "Terminal")
  target: string; // executable or URL (e.g. "blender", "discord", "https://notion.so")
  description: string;
  voiceAliases: string[]; // voice phrases or keywords (e.g. ["abre blender", "modelado 3d"])
  category: 'work' | 'creative' | 'games' | 'dev' | 'system' | 'custom';
  enabled: boolean;
}

export interface CustomFunction {
  id: string;
  name: string; // Action identifier (e.g. "modo_estudio", "backup_proyecto", "alerta_reunion")
  title: string; // Display title
  triggerPhrases: string[]; // Phrases that activate this function (e.g. ["activa modo estudio", "iniciar sesion de concentracion"])
  description: string;
  actionType: 'open_app' | 'macro_sequence' | 'system_command' | 'custom_speech';
  payload: {
    appTarget?: string;
    macroSteps?: string[];
    command?: string;
    customSpeech?: string;
  };
  requireConfirmation: boolean;
  enabled: boolean;
}
