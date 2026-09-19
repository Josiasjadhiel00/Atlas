import { RegisteredDevice, DeviceType, DeviceStatus } from '../types';

class AtlasDeviceRegistry {
  private devices: Map<string, RegisteredDevice> = new Map();

  constructor() {
    this.seedDefaultFleet();
  }

  private seedDefaultFleet() {
    // Dispositivos base de la flota de ATLAS
    const baseFleet: RegisteredDevice[] = [
      {
        id: 'device_pc_master',
        name: 'PC PRINCIPAL',
        type: 'pc',
        status: 'online',
        isCurrentDevice: true,
        lastSeen: new Date().toISOString(),
        ip: '192.168.1.105',
        os: 'Windows 11 Pro 64-bit // Electron Native',
        capabilities: [
          'aplicaciones',
          'archivos',
          'pantalla',
          'microfono',
          'herramientas_desarrollo',
          'terminal',
          'automatizacion_local'
        ],
        permissions: [
          'filesystem.read',
          'filesystem.write',
          'applications.open',
          'applications.close',
          'terminal.execute',
          'system.volume',
          'vision.screen'
        ]
      },
      {
        id: 'device_phone_mobile',
        name: 'TELÉFONO',
        type: 'phone',
        status: 'online',
        isCurrentDevice: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        ip: '192.168.1.142',
        os: 'Android 15 // ATLAS Mobile PWA / Client',
        capabilities: [
          'microfono',
          'camara',
          'notificaciones',
          'geolocalizacion',
          'audio_remoto'
        ],
        permissions: [
          'voice.speak',
          'notifications.push',
          'camera.capture'
        ]
      },
      {
        id: 'device_laptop_work',
        name: 'LAPTOP',
        type: 'laptop',
        status: 'offline',
        isCurrentDevice: false,
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
        ip: '192.168.1.189',
        os: 'macOS Sonoma // Portable Workstation',
        capabilities: [
          'aplicaciones',
          'archivos',
          'pantalla',
          'microfono',
          'herramientas_desarrollo'
        ],
        permissions: [
          'filesystem.read',
          'applications.open'
        ]
      },
      {
        id: 'device_web_remote',
        name: 'PORTAL WEB REMOTO',
        type: 'web',
        status: 'online',
        isCurrentDevice: false,
        lastSeen: new Date().toISOString(),
        ip: 'Cloud Run Ingress',
        os: 'Chrome / Web HUD Standard',
        capabilities: [
          'chat_seguro',
          'telemetria_remota',
          'administracion_memoria',
          'supervision_flota'
        ],
        permissions: [
          'memory.read',
          'memory.write',
          'devices.view'
        ]
      }
    ];

    for (const dev of baseFleet) {
      this.devices.set(dev.id, dev);
    }
  }

  public getAllDevices(): RegisteredDevice[] {
    return Array.from(this.devices.values());
  }

  public getDeviceById(id: string): RegisteredDevice | undefined {
    return this.devices.get(id);
  }

  public findDeviceByNameOrAlias(query: string): RegisteredDevice | undefined {
    const clean = query.toLowerCase().trim();
    if (clean.includes('pc') || clean.includes('computadora') || clean.includes('ordenador') || clean.includes('escritorio')) {
      return this.devices.get('device_pc_master');
    }
    if (clean.includes('celular') || clean.includes('teléfono') || clean.includes('telefono') || clean.includes('movil') || clean.includes('móvil')) {
      return this.devices.get('device_phone_mobile');
    }
    if (clean.includes('laptop') || clean.includes('portátil') || clean.includes('portatil') || clean.includes('macbook')) {
      return this.devices.get('device_laptop_work');
    }
    
    // Búsqueda directa
    for (const dev of this.devices.values()) {
      if (dev.name.toLowerCase().includes(clean) || dev.id.toLowerCase().includes(clean)) {
        return dev;
      }
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
