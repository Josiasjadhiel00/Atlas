import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { atlasDeviceRegistry } from '../core/devices/deviceRegistry';
import { atlasMemory } from '../core/memory/memoryManager';
import { atlasTools } from '../core/tools/registry';

interface ConnectedClient {
  connId: string;
  ws: WebSocket;
  deviceId: string;
  deviceName: string;
  deviceType: 'pc' | 'phone' | 'laptop' | 'web';
}

class AtlasWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();

  public init(httpServer: Server) {
    this.wss = new WebSocketServer({ server: httpServer, path: '/ws/atlas' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const clientIp = req.socket.remoteAddress || '127.0.0.1';
      const connId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      let currentDeviceId = `device_client_${Date.now()}`;

      // Saludo inicial y confirmación de enlace
      ws.send(JSON.stringify({
        type: 'connection_ack',
        payload: {
          connId,
          message: 'Enlace WebSocket con ATLAS CORE establecido.',
          timestamp: new Date().toISOString()
        }
      }));

      ws.on('message', (data: string) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(connId, ws, msg, clientIp, (devId) => {
            currentDeviceId = devId;
          });
        } catch (err) {
          console.error('[ATLAS WS] Error parseando mensaje WebSocket:', err);
        }
      });

      ws.on('close', () => {
        if (this.clients.has(connId)) {
          const client = this.clients.get(connId)!;
          // Check if there are other connections for this deviceId
          const hasOtherConns = Array.from(this.clients.values()).some(
            c => c.connId !== connId && c.deviceId === client.deviceId
          );
          if (!hasOtherConns) {
            atlasDeviceRegistry.updateHeartbeat(client.deviceId, undefined, 'offline');
          }
          this.clients.delete(connId);
          this.broadcastFleetStatus();
        }
      });

      ws.on('error', (err) => {
        console.warn('[ATLAS WS] Error en socket:', err.message);
      });
    });

    console.log('[ATLAS WS] Servidor WebSocket táctico montado en /ws/atlas');
  }

  private handleMessage(
    connId: string,
    ws: WebSocket,
    msg: any,
    clientIp: string,
    setDeviceId: (id: string) => void
  ) {
    switch (msg.type) {
      case 'register_device': {
        const { deviceId, name, type, capabilities, permissions } = msg.payload || {};
        const finalId = deviceId || `device_${type || 'client'}_${Date.now()}`;
        setDeviceId(finalId);

        this.clients.set(connId, {
          connId,
          ws,
          deviceId: finalId,
          deviceName: name || 'Dispositivo Cliente',
          deviceType: type || 'web'
        });

        atlasDeviceRegistry.registerDevice({
          id: finalId,
          name: name || 'Dispositivo Cliente',
          type: type || 'web',
          status: 'online',
          lastSeen: new Date().toISOString(),
          ip: clientIp,
          capabilities: capabilities || ['chat_seguro', 'control_remoto'],
          permissions: permissions || []
        });

        ws.send(JSON.stringify({
          type: 'device_registered',
          payload: { 
            connId, 
            deviceId: finalId, 
            status: 'online', 
            timestamp: new Date().toISOString() 
          }
        }));

        this.broadcastFleetStatus();
        break;
      }

      case 'heartbeat': {
        const { deviceId } = msg.payload || {};
        if (deviceId) {
          atlasDeviceRegistry.updateHeartbeat(deviceId, clientIp, 'online');
        }
        ws.send(JSON.stringify({
          type: 'heartbeat_ack',
          payload: { timestamp: new Date().toISOString() }
        }));
        break;
      }

      case 'dispatch_to_device': {
        const { targetDeviceId, action, parameters, sourceDeviceId } = msg.payload || {};
        const sent = this.sendActionToDevice(targetDeviceId, action, parameters, sourceDeviceId);
        
        ws.send(JSON.stringify({
          type: 'dispatch_result',
          payload: {
            targetDeviceId,
            action,
            dispatched: sent,
            timestamp: new Date().toISOString()
          }
        }));
        break;
      }

      case 'device_action_completed': {
        // Un dispositivo notifica que completó una orden
        const { action, target, deviceId, result } = msg.payload || {};
        this.broadcastEvent('device_action_notification', {
          action,
          target,
          deviceId,
          result,
          timestamp: new Date().toISOString()
        });
        break;
      }

      case 'sync_chat_log': {
        // Sincronizar logs y mensajes entre todas las pantallas
        this.broadcastEvent('chat_log_sync', msg.payload);
        break;
      }

      case 'get_fleet_status': {
        ws.send(JSON.stringify({
          type: 'fleet_status_update',
          payload: {
            devices: atlasDeviceRegistry.getAllDevices(),
            onlineCount: atlasDeviceRegistry.getOnlineCount(),
            memoryStats: atlasMemory.getStats(),
            toolsCount: atlasTools.getAllTools().length
          }
        }));
        break;
      }
    }
  }

  public sendActionToDevice(
    targetDeviceId: string, 
    action: string, 
    parameters: any, 
    sourceDeviceId?: string
  ): boolean {
    const targetDev = atlasDeviceRegistry.findDeviceByNameOrAlias(targetDeviceId);
    const targetKey = targetDev ? targetDev.id : targetDeviceId;

    let dispatchedCount = 0;
    const actionPayload = JSON.stringify({
      type: 'execute_device_action',
      payload: {
        action,
        parameters,
        targetDeviceId: targetKey,
        sourceDeviceId: sourceDeviceId || 'remote_client',
        timestamp: new Date().toISOString()
      }
    });

    for (const client of this.clients.values()) {
      const matchExact = client.deviceId === targetKey;
      const matchType = targetDev && client.deviceType === targetDev.type;
      const matchAll = targetDeviceId.toLowerCase() === 'all';

      if ((matchExact || matchType || matchAll) && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(actionPayload);
        dispatchedCount++;
      }
    }

    // Also broadcast notification to other clients so everyone's HUD sees the order
    if (dispatchedCount > 0) {
      this.broadcastEvent('hud_action_dispatched', {
        action,
        parameters,
        targetDeviceId: targetKey,
        targetDeviceName: targetDev ? targetDev.name : targetDeviceId,
        sourceDeviceId: sourceDeviceId || 'remote_client'
      });
    }

    return dispatchedCount > 0;
  }

  public broadcastEvent(eventType: string, payload: any) {
    if (!this.wss) return;
    const msg = JSON.stringify({
      type: eventType,
      payload
    });

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg);
      }
    }
  }

  public broadcastFleetStatus() {
    if (!this.wss) return;
    const payload = JSON.stringify({
      type: 'fleet_status_update',
      payload: {
        devices: atlasDeviceRegistry.getAllDevices(),
        onlineCount: atlasDeviceRegistry.getOnlineCount(),
        memoryStats: atlasMemory.getStats(),
        toolsCount: atlasTools.getAllTools().length
      }
    });

    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    }
  }
}

export const atlasWebSocketServer = new AtlasWebSocketServer();
