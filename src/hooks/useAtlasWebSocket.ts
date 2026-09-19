import { useState, useEffect, useRef, useCallback } from 'react';
import { sciFiAudio } from '../utils/audioSynth';

export interface DeviceActionPayload {
  action: string;
  parameters?: Record<string, any>;
  targetDeviceId?: string;
  sourceDeviceId?: string;
  timestamp: string;
}

export interface WebSocketFleetUpdate {
  devices: any[];
  onlineCount: number;
  memoryStats?: any;
  toolsCount?: number;
}

export interface AtlasWebSocketHookOptions {
  onRemoteActionReceived?: (payload: DeviceActionPayload) => void;
  onAssistantBroadcast?: (payload: any) => void;
  onChatLogSync?: (payload: any) => void;
}

export function useAtlasWebSocket(options: AtlasWebSocketHookOptions = {}) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connId, setConnId] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [fleetData, setFleetData] = useState<WebSocketFleetUpdate | null>(null);
  const [lastRemoteAction, setLastRemoteAction] = useState<DeviceActionPayload | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Determine current device identity
  const getDeviceIdentity = useCallback(() => {
    if (typeof window === 'undefined') {
      return { id: 'device_web_client', name: 'PORTAL WEB', type: 'web' as const };
    }

    const params = new URLSearchParams(window.location.search);
    const isExplicitMobile = params.get('client') === 'mobile';
    const isMobileUA = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth < 768;

    if (isExplicitMobile || (isMobileUA && isSmallScreen)) {
      return {
        id: 'device_phone_mobile',
        name: 'TELÉFONO MÓVIL (PWA)',
        type: 'phone' as const,
        capabilities: ['microfono', 'camara', 'notificaciones', 'audio_remoto'],
        permissions: ['voice.speak', 'notifications.push', 'camera.capture']
      };
    }

    return {
      id: 'device_pc_master',
      name: 'PC PRINCIPAL (HUD)',
      type: 'pc' as const,
      capabilities: ['aplicaciones', 'archivos', 'pantalla', 'microfono', 'terminal'],
      permissions: ['filesystem.read', 'applications.open', 'system.volume']
    };
  }, []);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    // Build ws url based on current location
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/atlas`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        const identity = getDeviceIdentity();
        setDeviceId(identity.id);

        // Register this device with the Atlas Core Hub
        ws.send(JSON.stringify({
          type: 'register_device',
          payload: {
            deviceId: identity.id,
            name: identity.name,
            type: identity.type,
            capabilities: identity.capabilities,
            permissions: identity.permissions
          }
        }));

        // Request initial fleet status
        ws.send(JSON.stringify({ type: 'get_fleet_status' }));

        // Heartbeat interval (every 15s)
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'heartbeat',
              payload: { deviceId: identity.id }
            }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'connection_ack':
              if (data.payload?.connId) setConnId(data.payload.connId);
              break;

            case 'device_registered':
              if (data.payload?.deviceId) setDeviceId(data.payload.deviceId);
              break;

            case 'fleet_status_update':
              if (data.payload) setFleetData(data.payload);
              break;

            case 'execute_device_action': {
              const payload = data.payload as DeviceActionPayload;
              setLastRemoteAction(payload);
              sciFiAudio.playConfirmSound();

              if (optionsRef.current.onRemoteActionReceived) {
                optionsRef.current.onRemoteActionReceived(payload);
              }

              // Acknowledge completion back to hub
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'device_action_completed',
                  payload: {
                    action: payload.action,
                    deviceId: getDeviceIdentity().id,
                    result: 'executed_successfully'
                  }
                }));
              }
              break;
            }

            case 'assistant_processed':
              if (optionsRef.current.onAssistantBroadcast) {
                optionsRef.current.onAssistantBroadcast(data.payload);
              }
              break;

            case 'chat_log_sync':
              if (optionsRef.current.onChatLogSync) {
                optionsRef.current.onChatLogSync(data.payload);
              }
              break;

            case 'hud_action_dispatched':
              // Optional subtle blip
              sciFiAudio.playBlip();
              break;
          }
        } catch (err) {
          console.warn('[ATLAS WS Client] Error parsing incoming WS frame:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

        // Schedule auto-reconnection with 3s backoff
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.warn('[ATLAS WS Client] Socket warning:', err);
        ws.close();
      };
    } catch (err) {
      console.error('[ATLAS WS Client] Connection error:', err);
    }
  }, [getDeviceIdentity]);

  useEffect(() => {
    connect();

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Public helper methods
  const dispatchAction = useCallback((targetDeviceId: string, action: string, parameters: Record<string, any> = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'dispatch_to_device',
        payload: {
          targetDeviceId,
          action,
          parameters,
          sourceDeviceId: deviceId || getDeviceIdentity().id
        }
      }));
      sciFiAudio.playBlip();
      return true;
    }
    return false;
  }, [deviceId, getDeviceIdentity]);

  const syncChatLog = useCallback((logEntry: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'sync_chat_log',
        payload: logEntry
      }));
    }
  }, []);

  const refreshFleet = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'get_fleet_status' }));
    }
  }, []);

  return {
    isConnected,
    connId,
    deviceId,
    fleetData,
    lastRemoteAction,
    dispatchAction,
    syncChatLog,
    refreshFleet
  };
}
