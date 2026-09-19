import fs from 'fs';
import path from 'path';
import { MemoryItem, MemoryCategory, ConversationTurn } from '../types';

const MEMORY_STORAGE_FILE = path.join(process.cwd(), 'atlas_central_memory.json');

class AtlasMemoryManager {
  private persistentMemories: Map<string, MemoryItem> = new Map();
  private ephemeralConversations: Map<string, ConversationTurn[]> = new Map(); // session/deviceId -> turns

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (fs.existsSync(MEMORY_STORAGE_FILE)) {
        const raw = fs.readFileSync(MEMORY_STORAGE_FILE, 'utf-8');
        const items: MemoryItem[] = JSON.parse(raw);
        for (const item of items) {
          this.persistentMemories.set(item.id, item);
        }
        console.log(`[ATLAS Memory] Cargadas ${this.persistentMemories.size} memorias centrales.`);
      } else {
        // Inicializar con conocimientos base de Atlas y sus proyectos primarios
        this.seedInitialMemories();
        this.saveToStorage();
      }
    } catch (err) {
      console.error('[ATLAS Memory] Error cargando memoria persistente:', err);
      this.seedInitialMemories();
    }
  }

  private seedInitialMemories() {
    const defaults: MemoryItem[] = [
      {
        id: 'mem_proj_logixt',
        category: 'project',
        key: 'logixt',
        title: 'Proyecto Logixt',
        content: 'Logixt es un sistema de inventario y gestión logística en desarrollo por Josías Lachapelle. Incluye arquitectura full-stack, trazabilidad de stock y automatización de despacho.',
        tags: ['logixt', 'inventario', 'desarrollo', 'proyectos'],
        sourceDevice: 'pc-master',
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'mem_pref_user_title',
        category: 'preference',
        key: 'creador',
        title: 'Identidad del Creador',
        content: 'Creador e ingeniero principal: Josías Lachapelle Martínez. Trato respetuoso, directo, sin servilismo y con alta eficiencia técnica.',
        tags: ['creador', 'josias', 'protocolo'],
        sourceDevice: 'pc-master',
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'mem_know_arch',
        category: 'knowledge',
        key: 'atlas_arch',
        title: 'Arquitectura Atlas Core',
        content: 'Atlas Core es una plataforma multiplataforma desacoplada (PC, Teléfono, Web) con un solo cerebro central y sincronización de memoria.',
        tags: ['atlas', 'arquitectura', 'multiplataforma'],
        sourceDevice: 'core-server',
        isPinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    for (const item of defaults) {
      this.persistentMemories.set(item.id, item);
    }
  }

  public saveToStorage() {
    try {
      const items = Array.from(this.persistentMemories.values());
      fs.writeFileSync(MEMORY_STORAGE_FILE, JSON.stringify(items, null, 2), 'utf-8');
    } catch (err) {
      console.error('[ATLAS Memory] Error guardando memoria en disco:', err);
    }
  }

  // --- RECUERDOS PERSISTENTES ---
  public saveMemory(
    category: MemoryCategory,
    key: string,
    title: string,
    content: string,
    tags: string[] = [],
    sourceDevice = 'current-client'
  ): MemoryItem {
    const normalizedKey = key.toLowerCase().trim();
    
    // Buscar si ya existe una memoria con esta clave
    let existingId: string | null = null;
    for (const [id, item] of this.persistentMemories.entries()) {
      if (item.key.toLowerCase() === normalizedKey && item.category === category) {
        existingId = id;
        break;
      }
    }

    const memoryItem: MemoryItem = {
      id: existingId || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category,
      key: normalizedKey,
      title: title || key,
      content,
      tags: Array.from(new Set([...tags, normalizedKey, category])),
      sourceDevice,
      isPinned: category === 'project' || category === 'preference',
      createdAt: existingId ? this.persistentMemories.get(existingId)!.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.persistentMemories.set(memoryItem.id, memoryItem);
    this.saveToStorage();
    return memoryItem;
  }

  public getMemoryById(id: string): MemoryItem | undefined {
    return this.persistentMemories.get(id);
  }

  public getAllMemories(): MemoryItem[] {
    return Array.from(this.persistentMemories.values()).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public deleteMemory(id: string): boolean {
    const deleted = this.persistentMemories.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  public searchMemories(query: string, category?: MemoryCategory): MemoryItem[] {
    if (!query) return this.getAllMemories();
    const clean = query.toLowerCase().trim();
    const words = clean.split(/\s+/).filter(w => w.length > 2);

    return Array.from(this.persistentMemories.values())
      .filter(item => {
        if (category && item.category !== category) return false;

        const hay = `${item.title} ${item.key} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
        if (hay.includes(clean)) return true;
        return words.some(w => hay.includes(w));
      })
      .slice(0, 10);
  }

  // --- CONTEXTO EFÍMERO DE CONVERSACIÓN (Por dispositivo / sesión) ---
  public addConversationTurn(deviceId: string, turn: ConversationTurn) {
    if (!this.ephemeralConversations.has(deviceId)) {
      this.ephemeralConversations.set(deviceId, []);
    }
    const list = this.ephemeralConversations.get(deviceId)!;
    list.push(turn);
    // Limitar la ventana deslizante a los últimos 30 turnos por dispositivo para evitar desbordar contexto
    if (list.length > 30) {
      list.shift();
    }
  }

  public getConversationHistory(deviceId: string): ConversationTurn[] {
    return this.ephemeralConversations.get(deviceId) || [];
  }

  public clearConversationHistory(deviceId: string) {
    this.ephemeralConversations.delete(deviceId);
  }

  public getStats() {
    const all = Array.from(this.persistentMemories.values());
    return {
      total: all.length,
      projectsCount: all.filter(m => m.category === 'project').length,
      preferencesCount: all.filter(m => m.category === 'preference').length,
      knowledgeCount: all.filter(m => m.category === 'knowledge').length,
      tasksCount: all.filter(m => m.category === 'task').length
    };
  }
}

export const atlasMemory = new AtlasMemoryManager();
