import { atlasBrain } from '../brain/geminiEngine';
import { atlasTools } from '../tools/registry';
import { atlasMemory } from '../memory/memoryManager';
import { atlasDeviceRegistry } from '../devices/deviceRegistry';
import { AgentResponse, AgentExecutionContext, ConversationTurn } from '../types';

export class AtlasAgent {
  public async executePlan(
    userPrompt: string,
    context: AgentExecutionContext
  ): Promise<AgentResponse> {
    const startTime = Date.now();
    const cleanPrompt = userPrompt.trim();

    // 1. Registrar turno en historial efímero
    atlasMemory.addConversationTurn(context.deviceId, {
      id: `turn_${Date.now()}`,
      role: 'user',
      content: cleanPrompt,
      timestamp: new Date().toISOString(),
      deviceId: context.deviceId
    });

    // 2. Consulta al cerebro (Gemini con contexto y memoria)
    const fleet = atlasDeviceRegistry.getAllDevices();
    const reasoning = await atlasBrain.processRequest(cleanPrompt, {
      deviceId: context.deviceId,
      deviceName: context.deviceName,
      registeredDevices: fleet,
      conversationTurns: atlasMemory.getConversationHistory(context.deviceId).map(t => ({ role: t.role, content: t.content }))
    });

    // 3. Caso: Requiere Búsqueda Web
    if (reasoning.requiresWebSearch && reasoning.searchQuery) {
      return {
        type: 'research',
        status: 'researching',
        actionName: 'search_internet',
        parameters: { query: reasoning.searchQuery },
        message: reasoning.responseMessage,
        speechText: reasoning.speechText
      };
    }

    // 4. Caso: No requiere herramienta (Pregunta conversacional normal)
    if (!reasoning.isAction || !reasoning.toolCall) {
      const response: AgentResponse = {
        type: 'answer',
        status: 'success',
        message: reasoning.responseMessage,
        speechText: reasoning.speechText
      };

      atlasMemory.addConversationTurn(context.deviceId, {
        id: `turn_resp_${Date.now()}`,
        role: 'assistant',
        content: reasoning.responseMessage,
        timestamp: new Date().toISOString(),
        deviceId: context.deviceId
      });

      return response;
    }

    // 5. Caso: Solicitud de Acción / Selección de Herramienta
    const toolDef = atlasTools.getTool(reasoning.toolCall.name);
    if (!toolDef) {
      return {
        type: 'answer',
        status: 'failed',
        message: `La herramienta solicitada (${reasoning.toolCall.name}) no está disponible en este momento.`,
        speechText: `Esa herramienta no está registrada actualmente.`
      };
    }

    // 6. Verificación de Seguridad y Permisos
    if (toolDef.isDestructive && toolDef.requiresConfirmation && !context.userConfirmedDestructiveAction) {
      return {
        type: 'confirmation_required',
        status: 'needs_confirmation',
        actionName: toolDef.name,
        target: reasoning.toolCall.params.targetPath || 'sistema',
        parameters: reasoning.toolCall.params,
        message: `ACCIÓN DESTRUIDORA DETECTADA: Se requiere confirmación manual para proceder con ${toolDef.name}.`,
        speechText: `Esta acción es potencialmente destructiva. Necesito tu confirmación antes de proceder.`,
        confirmationDetails: {
          action: toolDef.name,
          target: reasoning.toolCall.params.targetPath || 'recurso del sistema',
          impact: 'Eliminación o modificación permanente en el almacenamiento o configuración.'
        }
      };
    }

    // 7. Ejecución de la herramienta
    try {
      const toolResult = await toolDef.execute(reasoning.toolCall.params, context);

      const response: AgentResponse = {
        type: 'action',
        status: toolResult.success ? 'success' : 'failed',
        actionName: toolDef.name,
        target: toolResult.targetDevice,
        parameters: reasoning.toolCall.params,
        resultData: toolResult.data,
        message: toolResult.message,
        speechText: toolResult.success ? reasoning.speechText : `Ocurrió un error al ejecutar la herramienta.`,
        targetDevice: toolResult.targetDevice 
          ? {
              id: toolResult.targetDevice,
              name: toolResult.targetDevice,
              status: 'online'
            }
          : undefined
      };

      // Guardar turno con ejecución de herramienta
      atlasMemory.addConversationTurn(context.deviceId, {
        id: `turn_resp_${Date.now()}`,
        role: 'assistant',
        content: toolResult.message,
        timestamp: new Date().toISOString(),
        deviceId: context.deviceId,
        toolCalls: [
          {
            name: toolDef.name,
            params: reasoning.toolCall.params,
            result: toolResult
          }
        ]
      });

      return response;
    } catch (err: any) {
      return {
        type: 'action',
        status: 'failed',
        actionName: toolDef.name,
        message: `Fallo en la ejecución de la herramienta: ${err.message}`,
        speechText: `Hubo una interrupción al intentar ejecutar la orden.`
      };
    }
  }
}

export const atlasAgent = new AtlasAgent();
