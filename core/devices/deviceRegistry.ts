import { RegisteredDevice, DeviceType, DeviceStatus } from '../types';

class AtlasDeviceRegistry {
  private devices: Map<string, RegisteredDevice> = new Map();

  // NOTA: antes esto arrancaba con 4 dispositivos inventados (IPs falsas,
  // "Cloud Run Ingress" como IP, un timestamp de "última vez visto" fijo
  // para siempre). Se quitó por completo: el registro ahora solo contiene
  // dispositivos que de verdad se conectaron por WebSocket (ver
  // api/websocketServer.ts, evento 'register_device') o que el puente
  // local confirmó que está corriendo (ver server.ts /api/bridge/status).
  // Un registro vacío significa, honestamente, "nada conectado todavía".

  public getAllDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values());
  }

  public getDeviceById(id: string): RegisteredDevice | undefined {
    return this.devices.get(id);
  }

  public findDeviceByNameOrAlias(query: string): RegisteredDevice | undefined {
    const clean = query.toLowerCase().trim();

    // Búsqueda directa por nombre/id entre lo que esté realmente registrado
    for (const dev of this.devices.values()) {
      if (dev.name.toLowerCase().includes(clean) || dev.id.toLowerCase().includes(clean)) {
        return dev;
      }
    }

    // Si no hay match directo, intenta por tipo de dispositivo (el primero
    // online de ese tipo, si existe)
    let wantedType: DeviceType | null = null;
    if (clean.includes('pc') || clean.includes('computadora') || clean.includes('ordenador') || clean.includes('escritorio')) {
      wantedType = 'pc';
    } else if (clean.includes('celular') || clean.includes('teléfono') || clean.includes('telefono') || clean.includes('movil') || clean.includes('móvil')) {
      wantedType = 'phone';
    } else if (clean.includes('laptop') || clean.includes('portátil') || clean.includes('portatil') || clean.includes('macbook')) {
      wantedType = 'laptop';
    }
    if (wantedType) {
      const byType = Array.from(this.devices.values()).filter(d => d.type === wantedType);
      return byType.find(d => d.status === 'online') || byType[0];
    }

    return undefined;
  }

  public updateHeartbeat(id: string, ip?: string, status: DeviceStatus = 'online') {
    const dev = this.devices.get(id);
    if (dev) {
      dev.status = status;
      dev.lastSeen = new Date().toISOString();
      if (ip) dev.ip = ip;
    }
  }

  public registerDevice(device: RegisteredDevice): RegisteredDevice {
    this.devices.set(device.id, {
      ...device,
      lastSeen: new Date().toISOString()
    });
    return device;
  }

  public getOnlineCount(): number {
    return Array.from(this.devices.values()).filter(d => d.status === 'online').length;
  }

  public hasCapability(deviceId: string, capability: string): boolean {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;
    return dev.capabilities.includes(capability);
  }

  public hasPermission(deviceId: string, permission: string): boolean {
    const dev = this.devices.get(deviceId);
    if (!dev) return false;
    return dev.permissions.includes(permission);
  }
}

export const atlasDeviceRegistry = new AtlasDeviceRegistry();
