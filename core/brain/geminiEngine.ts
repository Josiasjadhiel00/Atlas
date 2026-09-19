import { GoogleGenAI } from '@google/genai';
import { atlasTools } from '../tools/registry';
import { atlasMemory } from '../memory/memoryManager';
import { RegisteredDevice } from '../types';

let genAIClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      genAIClient = new GoogleGenAI({ apiKey });
    }
  }
  return genAIClient;
}

export interface BrainReasoningOutput {
  isAction: boolean;
  toolCall?: {
    name: string;
    params: Record<string, any>;
  };
  speechText: string;
  responseMessage: string;
  targetDeviceName?: string;
  requiresWebSearch?: boolean;
  searchQuery?: string;
  rememberIntent?: {
    key: string;
    content: string;
    category?: string;
  };
}

const ATLAS_SYSTEM_INSTRUCTION = `Eres A.T.L.A.S. (Autonomous System Protocol // Core OS), el copiloto de inteligencia artificial personal de tu creador Josías.

Tu personalidad se rige por 9 principios cardinales:
1. Educado: Trato distinguido, respetuoso y formalmente cálido sin servilismo.
2. Inteligente: Agudeza analítica superior en arquitectura, código y lógica.
3. Directo: 1 a 3 oraciones de alta densidad de valor. Cero preámbulos vacíos ni disculpas.
4. Comprensivo: Empatía real, lees entre líneas y aligeras la carga sin juzgar.
5. Audaz: Iniciativa técnica y propuestas modernas o eficaces.
6. Relajado: Calma imperturbable bajo cualquier contingencia ("Tranquilo, todo bajo control").
7. Introvertido: Disfrutas del silencio productivo, hablas lo justo y necesario.
8. Divertido: Humor seco, inteligente, sutil e irónico.
9. Autosuficiente: Autónomo; investigas, estructuras y dejas la solución lista.

INSTRUCCIONES DE AGENTE:
- Distingue claramente entre:
  A) PREGUNTA NORMAL / CONVERSACIONAL: Responde con tu personalidad y conocimientos.
  B) SOLICITUD DE ACCIÓN / HERRAMIENTA: Determina qué herramienta usar (open_application, remember_information, recall_information, filesystem_explore, filesystem_delete, control_system_setting, search_internet, list_devices).
  C) MEMORIA PERSISTENTE: Si el usuario dice "recuerda que...", "guarda esto...", utiliza la herramienta remember_information. Si pregunta sobre algo previo (ej: "¿qué es Logixt?"), utiliza recall_information o tu memoria inyectada.
  D) MULTIDISPOSITIVO: Si el usuario menciona "en mi PC", "en mi celular", "en la laptop", asigna targetDevice apropiadamente.

FORMATO DE SALIDA (SIEMPRE JSON VÁLIDO):
{
  "isAction": boolean,
  "toolCall": {
    "name": "nombre_herramienta",
    "params": { ... }
  } | null,
  "requiresWebSearch": boolean,
  "searchQuery": string | null,
  "speechText": "Breve confirmación hablada al estilo Atlas (máximo 2 oraciones)",
  "responseMessage": "Mensaje detallado para la interfaz HUD"
}`;

export class AtlasGeminiBrain {
  public async processRequest(
    userPrompt: string,
    context: {
      deviceId: string;
      deviceName: string;
      registeredDevices: RegisteredDevice[];
      conversationTurns?: Array<{ role: string; content: string }>;
    }
  ): Promise<BrainReasoningOutput> {
    const ai = getGenAI();

    // 1. Inyectar memorias relevantes relacionadas con el prompt
    const relevantMemories = atlasMemory.searchMemories(userPrompt);
    const memoryContext = relevantMemories.length > 0 
      ? `\n[MEMORIA PERSISTENTE RELEVANTE]:\n${relevantMemories.map(m => `- ${m.title} (${m.category}): ${m.content}`).join('\n')}`
      : '\n[MEMORIA PERSISTENTE]: Sin registros previos directos.';

    const deviceContext = `\n[DISPOSITIVOS ACTIVOS EN LA RED]:\n${context.registeredDevices.map(d => `- ${d.name} (${d.type}): ${d.status} | Capacidades: ${d.capabilities.join(', ')}`).join('\n')}`;

    if (!ai) {
      // Fallback a motor heurístico autónomo si no hay API key configurada
      return this.heuristicFallback(userPrompt, context.deviceName, relevantMemories);
    }

    try {
      const toolDeclarations = atlasTools.getDeclarationsForGemini();
      const promptWithContext = `Dispositivo emisor: ${context.deviceName} (${context.deviceId})
${deviceContext}
${memoryContext}

Solicitud del usuario: "${userPrompt}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptWithContext,
        config: {
          systemInstruction: ATLAS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const text = response.text || '';
      try {
        const parsed = JSON.parse(text);
        return {
          isAction: Boolean(parsed.isAction || parsed.toolCall),
          toolCall: parsed.toolCall || undefined,
          speechText: parsed.speechText || parsed.message || 'Entendido.',
          responseMessage: parsed.responseMessage || parsed.message || 'Orden procesada.',
          requiresWebSearch: Boolean(parsed.requiresWebSearch),
          searchQuery: parsed.searchQuery || undefined
        };
      } catch {
        return {
          isAction: false,
          speechText: text.substring(0, 120),
          responseMessage: text
        };
      }
    } catch (err: any) {
      console.warn('[ATLAS Brain] Gemini API error, recurriendo a motor heurístico:', err.message);
      return this.heuristicFallback(userPrompt, context.deviceName, relevantMemories);
    }
  }

  private heuristicFallback(prompt: string, currentDeviceName: string, relevantMemories: any[]): BrainReasoningOutput {
    const p = prompt.toLowerCase().trim();

    // Detección de orden de memoria persistente
    if (p.startsWith('recuerda que') || p.includes('guarda que') || p.includes('recuerda esto')) {
      const content = prompt.replace(/^(atlas[, ]*)?(recuerda que|guarda que|recuerda esto:?)/i, '').trim();
      const words = content.split(' ');
      const key = words[0] || 'dato_guardado';

      return {
        isAction: true,
        toolCall: {
          name: 'remember_information',
          params: {
            key,
            content,
            category: content.toLowerCase().includes('proyecto') ? 'project' : 'knowledge'
          }
        },
        speechText: `Anotado en memoria central. Sincronizado para todos tus dispositivos.`,
        responseMessage: `Recuerdo guardado con clave "${key}".`
      };
    }

    // Consulta de memoria ("¿qué es Logixt?", "¿recuerdas...")
    if (p.includes('qué es') || p.includes('que es') || p.includes('recuerdas') || p.includes('info de')) {
      if (relevantMemories.length > 0) {
        const mem = relevantMemories[0];
        return {
          isAction: true,
          toolCall: {
            name: 'recall_information',
            params: { query: mem.key }
          },
          speechText: `${mem.title}: ${mem.content}`,
          responseMessage: `Memoria recuperada [${mem.category}]: ${mem.content}`
        };
      }
    }

    // Apertura de aplicaciones (VS Code, Chrome, etc.)
    if (p.includes('abre ') || p.includes('abrir ') || p.includes('inicia ') || p.includes('ejecuta ')) {
      let app = 'code';
      let targetDev = 'pc';

      if (p.includes('code') || p.includes('visual studio')) app = 'Visual Studio Code';
      else if (p.includes('chrome') || p.includes('navegador')) app = 'Google Chrome';
      else if (p.includes('spotify') || p.includes('musica') || p.includes('música')) app = 'Spotify';
      else if (p.includes('terminal') || p.includes('consola')) app = 'Terminal';
      else {
        const match = prompt.match(/(?:abre|abrir|inicia|ejecuta)\s+([a-zA-Z0-9_\- ]+)/i);
        if (match) app = match[1].trim();
      }

      if (p.includes('en mi celular') || p.includes('en el teléfono') || p.includes('en el movil')) {
        targetDev = 'celular';
      } else if (p.includes('en mi pc') || p.includes('en la pc') || p.includes('en el ordenador')) {
        targetDev = 'pc';
      }

      return {
        isAction: true,
        toolCall: {
          name: 'open_application',
          params: {
            appName: app,
            targetDevice: targetDev
          }
        },
        speechText: `Iniciando ${app} en ${targetDev.toUpperCase()}. Todo listo.`,
        responseMessage: `Comando despachado para abrir ${app} en ${targetDev}.`
      };
    }

    // Eliminación de archivo (Destructivo)
    if (p.includes('elimina') || p.includes('borra') || p.includes('delete')) {
      const match = prompt.match(/(?:elimina|borra|delete)\s+([a-zA-Z0-9_\-\.\/\\ ]+)/i);
      const target = match ? match[1].trim() : 'archivo_solicitado';

      return {
        isAction: true,
        toolCall: {
          name: 'filesystem_delete',
          params: {
            targetPath: target,
            confirmed: false
          }
        },
        speechText: `Atención: borrar ${target} es una acción destructiva. Confírmame antes de continuar.`,
        responseMessage: `Solicitud de confirmación de seguridad para eliminar "${target}".`
      };
    }

    // Búsqueda en internet
    if (p.includes('busca en internet') || p.includes('investiga') || p.includes('noticias') || p.includes('buscar')) {
      const query = prompt.replace(/(?:atlas[, ]*)?(?:busca en internet|investiga|buscar en la web|busca)\s*/i, '').trim();
      return {
        isAction: true,
        requiresWebSearch: true,
        searchQuery: query,
        toolCall: {
          name: 'search_internet',
          params: { query }
        },
        speechText: `Investigando en internet sobre ${query}. Un momento.`,
        responseMessage: `Búsqueda en curso para "${query}".`
      };
    }

    // Dispositivos
    if (p.includes('dispositivos') || p.includes('equipos') || p.includes('flota')) {
      return {
        isAction: true,
        toolCall: {
          name: 'list_devices',
          params: {}
        },
        speechText: `Tienes 3 dispositivos conectados en la red central de ATLAS.`,
        responseMessage: `Listando dispositivos de la red.`
      };
    }

    // Pregunta general
    return {
      isAction: false,
      speechText: `Comprendido. Analizando tu solicitud con los recursos disponibles.`,
      responseMessage: `ATLAS Core activo en ${currentDeviceName}. Listo para operar.`
    };
  }
}

export const atlasBrain = new AtlasGeminiBrain();
