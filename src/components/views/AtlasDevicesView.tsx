import React, { useState, useEffect } from 'react';
import { 
  Laptop, Smartphone, Globe, Monitor, Wifi, WifiOff, Shield, 
  Terminal, Play, RefreshCw, Check, AlertCircle, Cpu, Zap, Radio,
  FolderLock, Layers, Activity, QrCode, Download, Send
} from 'lucide-react';
import { sciFiAudio } from '../../utils/audioSynth';
import { PairMobileModal } from '../modals/PairMobileModal';
import { useAtlasWebSocket } from '../../hooks/useAtlasWebSocket';

export interface DeviceData {
  id: string;
  name: string;
  type: 'pc' | 'phone' | 'laptop' | 'web';
  status: 'online' | 'offline' | 'idle';
  isCurrentDevice?: boolean;
  lastSeen: string;
  ip?: string;
  os?: string;
  capabilities: string[];
  permissions: string[];
}

interface AtlasDevicesViewProps {
  onDispatchAction?: (deviceId: string, action: string, params: any) => Promise<any>;
}

export const AtlasDevicesView: React.FC<AtlasDevicesViewProps> = ({ onDispatchAction }) => {
  const [devices, setDevices] = useState<DeviceData[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('device_pc_master');
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [customActionText, setCustomActionText] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState<boolean>(false);

  // Enlace WebSocket en tiempo real
  const { 
    isConnected: isWsConnected, 
    fleetData, 
    dispatchAction: wsDispatchAction 
  } = useAtlasWebSocket();

  // Actualización instantánea cuando el socket emite el estado de la flota
  useEffect(() => {
    if (fleetData && Array.isArray(fleetData.devices) && fleetData.devices.length > 0) {
      setDevices(fleetData.devices);
      setLoading(false);
    }
  }, [fleetData]);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/core/devices');
      const data = await res.json();
      if (data.success && Array.isArray(data.devices)) {
        setDevices(data.devices);
        setFetchError(null);
      }
    } catch (err) {
      // Antes esto rellenaba con 3 dispositivos inventados (IPs falsas,
      // "última vez visto" fija). Ahora, si no se puede hablar con el
      // servidor, se muestra honestamente una lista vacía + aviso — no un
      // estado falso de "todo conectado".
      console.warn('[DevicesView] No se pudo consultar /api/core/devices:', err);
      setFetchError('No se pudo conectar con el núcleo Atlas para listar dispositivos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 12000);
    return () => clearInterval(interval);
  }, []);

  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

  const handleExecuteRemote = async (action: string, params: any = {}) => {
    if (!selectedDevice) return;
    sciFiAudio.playBlip();
    setIsExecuting(true);
    setActionFeedback(`Transmitiendo orden "${action}" a ${selectedDevice.name}...`);

    try {
      if (isWsConnected) {
        wsDispatchAction(selectedDevice.id, action, params);
        sciFiAudio.playConfirmSound();
        setActionFeedback(`⚡ [ENVIADO VÍA WEBSOCKET]: Orden "${action}" transmitida en vivo a ${selectedDevice.name}.`);
      } else {
        const res = await fetch(`/api/core/devices/${selectedDevice.id}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, parameters: params })
        });
        const data = await res.json();
        sciFiAudio.playConfirmSound();
        setActionFeedback(data.message || `Orden despachada a ${selectedDevice.name}.`);
      }
    } catch (err: any) {
      setActionFeedback(`Error comunicando con el dispositivo: ${err.message}`);
    } finally {
      setIsExecuting(false);
      setTimeout(() => setActionFeedback(null), 5000);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'phone': return Smartphone;
      case 'laptop': return Laptop;
      default: return Globe;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header with Multiplatform Topology */}
      <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-5 shadow-[0_0_25px_rgba(0,242,255,0.08)] relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f2ff88] to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-[#00f2ff] animate-pulse" />
              <h2 className="text-lg font-bold text-white tracking-wide">
                TOPOLOGÍA MULTIPLATAFORMA // DISPOSITIVOS REGISTRADOS
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans">
              "Un solo asistente, múltiples dispositivos." Todos conectados al mismo cerebro ATLAS CORE y memoria central.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                sciFiAudio.playBlip();
                setIsPairModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00f2ff22] to-[#0099ff22] hover:from-[#00f2ff35] hover:to-[#0099ff35] border border-[#00f2ff66] text-[#00f2ff] hover:text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(0,242,255,0.2)] transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Vincular Teléfono (QR)</span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 border border-[#00f2ff22] text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-slate-300">Flota:</span>
              <span className="text-[#00f2ff] font-bold">
                {devices.filter(d => d.status === 'online').length}/{devices.length} Online
              </span>
            </div>

            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono ${
              isWsConnected 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                : 'bg-amber-950/40 border-amber-500/40 text-amber-400'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${isWsConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span>{isWsConnected ? 'SOCKET BIDIRECCIONAL: ENLACE ACTIVO' : 'SOCKET: ENLAZANDO...'}</span>
            </div>

            <button
              onClick={() => {
                sciFiAudio.playBlip();
                fetchDevices();
              }}
              className="p-2 rounded-lg bg-[#00f2ff15] hover:bg-[#00f2ff28] border border-[#00f2ff44] text-[#00f2ff] cursor-pointer transition-colors"
              title="Actualizar estado de flota"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tactical Architecture Diagram Bar */}
        <div className="mt-4 pt-4 border-t border-[#00f2ff18] grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-[11px] font-mono">
          <div className="p-2 rounded bg-black/30 border border-[#00f2ff1a] text-slate-300">
            <span className="text-[#00f2ff] font-bold block">1. ATLAS CORE</span>
            Cerebro Gemini & Hub Central
          </div>
          <div className="p-2 rounded bg-black/30 border border-[#00f2ff1a] text-slate-300">
            <span className="text-emerald-400 font-bold block">2. PC PRINCIPAL</span>
            Electron / Ejecución Nativa
          </div>
          <div className="p-2 rounded bg-black/30 border border-[#00f2ff1a] text-slate-300">
            <span className="text-sky-400 font-bold block">3. MÓVIL PWA</span>
            Voz, Cámara & Notificaciones
          </div>
          <div className="p-2 rounded bg-black/30 border border-[#00f2ff1a] text-slate-300">
            <span className="text-amber-400 font-bold block">4. MEMORIA PERSISTENTE</span>
            Sincronización Trans-dispositivo
          </div>
        </div>
      </div>

      {/* Main Grid: Device Cards (Left) & Device Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Device List (cols 1-5) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Nodos Registrados ({devices.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              WebSocket // Auto-discovery
            </span>
          </div>

          <div className="space-y-2.5">
            {fetchError && devices.length === 0 && (
              <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-amber-300 text-xs">
                ⚠️ {fetchError} Verifica que el servidor de Atlas esté corriendo.
              </div>
            )}
            {!fetchError && !loading && devices.length === 0 && (
              <div className="p-4 rounded-2xl border border-[#00f2ff22] bg-[#050c20]/80 text-slate-400 text-xs">
                Todavía no hay ningún dispositivo conectado. Abre Atlas desde otro navegador o dispositivo, o arranca el puente local, para que aparezca aquí en tiempo real.
              </div>
            )}
            {devices.map((device) => {
              const IconComp = getDeviceIcon(device.type);
              const isSelected = selectedDeviceId === device.id;
              const isOnline = device.status === 'online';

              return (
                <div
                  key={device.id}
                  onClick={() => {
                    sciFiAudio.playBlip();
                    setSelectedDeviceId(device.id);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#00f2ff15] to-[#3b82f60a] border-[#00f2ff] shadow-[0_0_20px_rgba(0,242,255,0.18)]'
                      : 'bg-[#050c20]/80 hover:bg-[#071330] border-[#00f2ff22] hover:border-[#00f2ff55]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isOnline 
                          ? 'bg-[#00f2ff15] border-[#00f2ff44] text-[#00f2ff]'
                          : 'bg-white/5 border-white/10 text-slate-500'
                      }`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-wide">
                            {device.name}
                          </h3>
                          {device.isCurrentDevice && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f2ff22] text-[#00f2ff] font-mono border border-[#00f2ff44]">
                              ACTUAL
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {device.os || device.type.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className={`w-2 h-2 rounded-full ${
                        isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                      }`} />
                      <span className={`text-[11px] font-bold ${
                        isOnline ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        {isOnline ? 'En línea' : 'Desconectada'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Capabilities Badges */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1">
                    {device.capabilities.slice(0, 3).map((cap, idx) => (
                      <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-white/5 text-slate-300 font-mono border border-white/5">
                        {cap}
                      </span>
                    ))}
                    {device.capabilities.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00f2ff11] text-[#00f2ff] font-mono">
                        +{device.capabilities.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Device Inspector & Remote Action Dispatcher (cols 6-12) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedDevice ? (
            <div className="bg-[#050b1d]/85 backdrop-blur-xl border border-[#00f2ff33] rounded-2xl p-5 shadow-[0_0_25px_rgba(0,242,255,0.08)] space-y-5">
              
              {/* Device Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[#00f2ff22]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00f2ff22] to-[#3b82f611] border border-[#00f2ff55] flex items-center justify-center text-[#00f2ff]">
                    {React.createElement(getDeviceIcon(selectedDevice.type), { className: 'w-6 h-6' })}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      {selectedDevice.name}
                      <span className="text-[10px] font-mono font-normal text-slate-400">
                        ({selectedDevice.id})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">
                      IP: {selectedDevice.ip || 'Local / LAN'} • Última conexión: {new Date(selectedDevice.lastSeen).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 border ${
                  selectedDevice.status === 'online'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${selectedDevice.status === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                  {selectedDevice.status === 'online' ? 'CONECTADO VÍA HUB' : 'DESCONECTADO'}
                </div>
              </div>

              {/* Feedback alert */}
              {actionFeedback && (
                <div className="p-3 rounded-xl bg-[#00f2ff15] border border-[#00f2ff55] text-xs text-[#00f2ff] flex items-center gap-2 animate-in fade-in">
                  <Activity className="w-4 h-4 animate-spin" />
                  <span>{actionFeedback}</span>
                </div>
              )}

              {/* Capabilities & Permissions Two-Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Capabilities */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-[#00f2ff22] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#00f2ff] font-mono">
                    <Zap className="w-3.5 h-3.5" />
                    CAPACIDADES ACTIVAS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDevice.capabilities.map((cap, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded bg-[#00f2ff11] text-slate-200 border border-[#00f2ff33] font-mono">
                        ✓ {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Permissions */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-[#00f2ff22] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
                    <Shield className="w-3.5 h-3.5" />
                    PERMISOS ASIGNADOS
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedDevice.permissions.map((perm, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-200 border border-amber-500/25 font-mono">
                        • {perm}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Remote Actions Box */}
              <div className="p-4 rounded-xl bg-[#020714] border border-[#00f2ff28] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#00f2ff]" />
                    Despachar Orden Remota a {selectedDevice.name}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    WebSocket Protocol
                  </span>
                </div>

                {/* Quick action buttons for this device */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    disabled={selectedDevice.status === 'offline' || isExecuting}
                    onClick={() => handleExecuteRemote('open_app', { appName: 'code' })}
                    className="p-2 rounded-lg bg-[#00f2ff11] hover:bg-[#00f2ff22] border border-[#00f2ff44] text-[#00f2ff] text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Abrir VS Code
                  </button>

                  <button
                    disabled={selectedDevice.status === 'offline' || isExecuting}
                    onClick={() => handleExecuteRemote('open_app', { appName: 'chrome' })}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3 h-3" />
                    Abrir Chrome
                  </button>

                  <button
                    disabled={selectedDevice.status === 'offline' || isExecuting}
                    onClick={() => handleExecuteRemote('control_volume', { action: 'mute' })}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3 h-3" />
                    Silenciar
                  </button>

                  <button
                    disabled={isExecuting}
                    onClick={() => handleExecuteRemote('ping_presence', {})}
                    className="p-2 rounded-lg bg-[#3b82f615] hover:bg-[#3b82f625] border border-[#3b82f644] text-sky-400 text-xs font-medium transition-all disabled:opacity-30 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Ping Estado
                  </button>
                </div>

                {/* Custom Action Dispatch input */}
                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <input
                    type="text"
                    value={customActionText}
                    onChange={(e) => setCustomActionText(e.target.value)}
                    placeholder={`Ej: "Abre mi proyecto Logixt en ${selectedDevice.name}"`}
                    className="flex-1 bg-black/60 border border-[#00f2ff33] rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#00f2ff]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customActionText.trim()) {
                        handleExecuteRemote('custom_order', { text: customActionText });
                        setCustomActionText('');
                      }
                    }}
                  />
                  <button
                    disabled={!customActionText.trim() || isExecuting}
                    onClick={() => {
                      handleExecuteRemote('custom_order', { text: customActionText });
                      setCustomActionText('');
                    }}
                    className="px-4 py-1.5 bg-[#00f2ff] hover:bg-[#00f2ff]/90 text-black font-bold text-xs rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    Enviar
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 bg-[#050b1d]/40 rounded-2xl border border-dashed border-white/10">
              Selecciona un dispositivo para inspeccionar sus capacidades y permisos.
            </div>
          )}
        </div>

      </div>

      {/* Modal de Vinculación Móvil con Código QR y Guía PWA */}
      <PairMobileModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
      />

    </div>
  );
};
