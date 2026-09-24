export type DeviceType = 'pc' | 'phone' | 'laptop' | 'web';
export type DeviceStatus = 'online' | 'offline' | 'idle';

export interface DeviceCapability {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

export interface RegisteredDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  isCurrentDevice?: boolean;
  lastSeen: string;
  ip?: string;
  os?: string;
  capabilities: string[];
  permissions: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  targetDevice?: string;
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    action: string;
    target: string;
    impact: string;
  };
}

export interface ToolDefinition {
  name: string;
  category: 'applications' | 'filesystem' | 'computer' | 'terminal' | 'browser' | 'vision' | 'devices' | 'memory';
  description: string;
  parameters: ToolParameter[];
  requiredPermissions: string[];
  isDestructive?: boolean;
  requiresConfirmation?: boolean;
  execute: (params: Record<string, any>, context: AgentExecutionContext) => Promise<ToolResult>;
}

export type MemoryCategory = 'preference' | 'project' | 'task' | 'knowledge' | 'action_history';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  key: string;
  title: string;
  content: string;
  tags: string[];
  sourceDevice?: string;
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationTurn {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  deviceId?: string;
  toolCalls?: Array<{
    name: string;
    params: Record<string, any>;
    result?: ToolResult;
  }>;
}

export interface AgentExecutionContext {
  deviceId: string;
  deviceName: string;
  userConfirmedDestructiveAction?: boolean;
  authToken?: string;
  isElectronNative?: boolean;
}

export interface AgentResponse {
  type: 'answer' | 'action' | 'research' | 'confirmation_required';
  status: 'success' | 'executing' | 'researching' | 'failed' | 'needs_confirmation';
  actionName?: string;
  target?: string;
  parameters?: Record<string, any>;
  resultData?: any;
  message: string;
  speechText: string;
  memoriesRetrieved?: MemoryItem[];
  memoriesSaved?: MemoryItem[];
  targetDevice?: {
    id: string;
    name: string;
    status: DeviceStatus;
  };
  confirmationDetails?: {
    action: string;
    target: string;
    impact: string;
  };
}

export interface RealSystemStatus {
  aiModel: {
    status: 'connected' | 'degraded' | 'offline';
    name: string;
    provider: 'gemini' | 'ollama' | 'openai' | 'heuristic';
    // Opcional: solo se reporta si de verdad se midió una llamada real al
    // modelo. Antes era obligatorio y se rellenaba con Math.random().
    latencyMs?: number;
  };
  internet: {
    status: 'connected' | 'disconnected';
    searchEngineAvailable: boolean;
  };
  microphone: {
    status: 'ready' | 'active' | 'unavailable';
    wakeWordActive: boolean;
  };
  tools: {
    status: 'operational' | 'restricted';
    totalRegistered: number;
    activeCategories: string[];
  };
  memory: {
    status: 'synchronized' | 'local_only';
    totalItems: number;
    projectsCount: number;
  };
  devices: {
    status: 'active';
    totalRegistered: number;
    onlineCount: number;
    devices: RegisteredDevice[];
  };
  latencyMs: number;
  lastUpdated: string;
}
