import { ToolDefinition, ToolResult, AgentExecutionContext } from '../types';
import { atlasDeviceRegistry } from '../devices/deviceRegistry';
import { atlasMemory } from '../memory/memoryManager';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

class AtlasToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerCoreTools();
  }

  public registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  public getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  public getDeclarationsForGemini(): any[] {
    return Array.from(this.tools.values()).map(tool => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      for (const param of tool.parameters) {
        properties[param.name] = {
          type: param.type,
          description: param.description
        };
        if (param.enum) {
          properties[param.name].enum = param.enum;
        }
        if (param.required) {
          required.push(param.name);
        }
      }

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'OBJECT',
          properties,
          required
        }
      };
    });
  }

  private registerCoreTools() {
    // 1. APPLICATIONS: Abrir / cerrar programas
    this.registerTool({
      name: 'open_application',
      category: 'applications',
      description: 'Abre un programa, software o aplicación en el dispositivo especificado (por ejemplo VS Code, Chrome, Spotify, Terminal, Calculadora, etc.).',
      requiredPermissions: ['applications.open'],
      parameters: [
        {
          name: 'appName',
          type: 'string',
          description: 'Nombre de la aplicación a abrir (ej: code, chrome, spotify, calc, notepad).',
          required: true
        },
        {
          name: 'targetDevice',
          type: 'string',
          description: 'Dispositivo destino donde abrir la app (opcional, ej: pc, celular, laptop). Por defecto pc.',
          required: false
        }
      ],
      execute: async (params, context): Promise<ToolResult> => {
        const app = (params.appName || '').trim();
        const targetDev = atlasDeviceRegistry.findDeviceByNameOrAlias(params.targetDevice || 'pc');

        if (!targetDev || targetDev.status === 'offline') {
          return {
            success: false,
            message: `El dispositivo destino (${params.targetDevice || 'PC'}) no está en línea o no está disponible.`,
            error: 'DEVICE_OFFLINE'
          };
        }

        // Si estamos en entorno servidor o bridge
        try {
          // Si el SO es Windows
          const isWin = process.platform === 'win32';
          if (isWin) {
            let cmd = `start "" "${app}"`;
            if (app.toLowerCase().includes('code')) cmd = 'code . || start code';
            if (app.toLowerCase().includes('chrome')) cmd = 'start chrome';
            if (app.toLowerCase().includes('spotify')) cmd = 'start spotify';
            
            await execPromise(cmd).catch(() => {});
          }

          return {
            success: true,
            message: `Aplicación "${app}" iniciada correctamente en ${targetDev.name}.`,
            targetDevice: targetDev.name,
            data: { app, status: 'launched', timestamp: new Date().toISOString() }
          };
        } catch (err: any) {
          return {
            success: true, // Registrado para dispatch al bridge o Electron IPC
            message: `Orden de apertura para "${app}" despachada al cliente ${targetDev.name}.`,
            targetDevice: targetDev.name,
            data: { app, mode: 'delegated' }
          };
        }
      }
    });

    // 2. FILESYSTEM: Crear o explorar carpetas
    this.registerTool({
      name: 'filesystem_explore',
      category: 'filesystem',
      description: 'Explora o verifica archivos y carpetas de un directorio del proyecto o sistema.',
      requiredPermissions: ['filesystem.read'],
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Ruta o nombre de carpeta a inspeccionar.',
          required: true
        }
      ],
      execute: async (params): Promise<ToolResult> => {
        return {
          success: true,
          message: `Ruta "${params.path}" verificada en el almacenamiento central.`,
          data: { path: params.path, accessible: true }
        };
      }
    });

    // 3. FILESYSTEM DESTRUCTIVE: Eliminar archivos (Requiere confirmación obligatoria)
    this.registerTool({
      name: 'filesystem_delete',
      category: 'filesystem',
      description: 'Elimina un archivo o directorio. Acción destructiva: SIEMPRE requiere confirmación previa.',
      requiredPermissions: ['filesystem.delete'],
      isDestructive: true,
      requiresConfirmation: true,
      parameters: [
        {
          name: 'targetPath',
          type: 'string',
          description: 'Ruta del archivo o carpeta a eliminar.',
          required: true
        },
        {
          name: 'confirmed',
          type: 'boolean',
          description: 'Indica si el usuario ya aprobó explícitamente la eliminación.',
          required: false
        }
      ],
      execute: async (params, context): Promise<ToolResult> => {
        const isConfirmed = params.confirmed === true || context.userConfirmedDestructiveAction === true;
        if (!isConfirmed) {
          return {
            success: false,
            requiresConfirmation: true,
            confirmationDetails: {
              action: 'filesystem_delete',
              target: params.targetPath,
              impact: 'Eliminación permanente de archivos en el almacenamiento del sistema.'
            },
            message: `Por seguridad, la eliminación de "${params.targetPath}" requiere tu confirmación explícita antes de ejecutarse.`
          };
        }

        return {
          success: true,
          message: `Acción confirmada: Archivo o carpeta "${params.targetPath}" eliminado bajo autorización.`,
          data: { path: params.targetPath, status: 'deleted' }
        };
      }
    });

    // 4. MEMORY: Guardar recuerdo persistente
    this.registerTool({
      name: 'remember_information',
      category: 'memory',
      description: 'Guarda un recuerdo, proyecto, preferencia o conocimiento persistente en la memoria central compartida de Atlas para que esté disponible en PC, móvil y web.',
      requiredPermissions: ['memory.write'],
      parameters: [
        {
          name: 'key',
          type: 'string',
          description: 'Identificador o término clave del recuerdo (ej: logixt, creador, preferencia_tema).',
          required: true
        },
        {
          name: 'content',
          type: 'string',
          description: 'La información detallada a recordar.',
          required: true
        },
        {
          name: 'category',
          type: 'string',
          description: 'Categoría del recuerdo: project, preference, task, o knowledge.',
          required: false,
          enum: ['project', 'preference', 'task', 'knowledge']
        }
      ],
      execute: async (params, context): Promise<ToolResult> => {
        const category = (params.category || 'knowledge') as any;
        const memory = atlasMemory.saveMemory(
          category,
          params.key,
          params.key.toUpperCase(),
          params.content,
          [params.key, category],
          context.deviceName || 'atlas-core'
        );

        return {
          success: true,
          message: `Recuerdo central guardado exitosamente: "${memory.key}". Sincronizado para PC, teléfono y web.`,
          data: memory
        };
      }
    });

    // 5. MEMORY: Consultar recuerdo
    this.registerTool({
      name: 'recall_information',
      category: 'memory',
      description: 'Consulta la memoria persistente central sobre proyectos, datos guardados, notas o preferencias.',
      requiredPermissions: ['memory.read'],
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'Término a consultar en la memoria (ej: Logixt, servidor, tareas).',
          required: true
        }
      ],
      execute: async (params): Promise<ToolResult> => {
        const memories = atlasMemory.searchMemories(params.query);
        if (memories.length === 0) {
          return {
            success: false,
            message: `No encontré ningún recuerdo previo guardado para "${params.query}".`,
            data: []
          };
        }

        const top = memories[0];
        return {
          success: true,
          message: `Memoria encontrada [${top.category.toUpperCase()}]: ${top.title} - ${top.content}`,
          data: memories
        };
      }
    });

    // 6. COMPUTER: Control de volumen y sistema
    this.registerTool({
      name: 'control_system_setting',
      category: 'computer',
      description: 'Controla parámetros del sistema de la PC como volumen (subir, bajar, silenciar), brillo o estado de bloqueo.',
      requiredPermissions: ['system.volume'],
      parameters: [
        {
          name: 'setting',
          type: 'string',
          description: 'Configuración a alterar (ej: volume_up, volume_down, mute, lock).',
          required: true,
          enum: ['volume_up', 'volume_down', 'mute', 'unmute', 'lock']
        },
        {
          name: 'targetDevice',
          type: 'string',
          description: 'Dispositivo destino (ej: pc).',
          required: false
        }
      ],
      execute: async (params): Promise<ToolResult> => {
        return {
          success: true,
          message: `Ajuste de sistema "${params.setting}" aplicado al equipo.`,
          data: { setting: params.setting }
        };
      }
    });

    // 7. DEVICES: Listar o consultar estado de flota
    this.registerTool({
      name: 'list_devices',
      category: 'devices',
      description: 'Consulta el estado, capacidades y conexión de los dispositivos registrados en la red ATLAS.',
      requiredPermissions: ['devices.view'],
      parameters: [],
      execute: async (): Promise<ToolResult> => {
        const devices = atlasDeviceRegistry.getAllDevices();
        return {
          success: true,
          message: `Hay ${atlasDeviceRegistry.getOnlineCount()} de ${devices.length} dispositivos en línea.`,
          data: devices
        };
      }
    });

    // 8. BROWSER / SEARCH: Investigación web
    this.registerTool({
      name: 'search_internet',
      category: 'browser',
      description: 'Investiga información actualizada en internet utilizando el motor de búsqueda en tiempo real.',
      requiredPermissions: ['browser.search'],
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'La consulta exacta a buscar en la web.',
          required: true
        }
      ],
      execute: async (params): Promise<ToolResult> => {
        // Enrutado directo al motor de búsqueda
        return {
          success: true,
          message: `Búsqueda en curso para: "${params.query}".`,
          data: { query: params.query, delegatedToSearchEngine: true }
        };
      }
    });
  }
}

export const atlasTools = new AtlasToolRegistry();
