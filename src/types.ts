export type AssistantTheme = 'cyan' | 'gold' | 'emerald';
export type AssistantState = 'idle' | 'listening' | 'thinking' | 'searching' | 'executing' | 'speaking' | 'error' | 'offline';
export type AssistantVoiceName = 'Atlas';

export type GeminiModelOption = 'gemini-3.8-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite' | 'gemini-flash-latest';

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
  sources?: { title: string; url: string }[];
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
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  syncedFrom?: 'PC' | 'PHONE' | 'WEB';
}
