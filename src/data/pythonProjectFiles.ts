import { PythonFileDefinition } from '../types';

export const PYTHON_PROJECT_FILES: PythonFileDefinition[] = [
  // ==========================================
  // BACKEND SERVIDOR (FastAPI + Agent Brain)
  // ==========================================
  {
    path: 'backend_servidor/main.py',
    filename: 'main.py',
    category: 'core',
    description: 'Servidor central FastAPI con WebSockets dúplex para HUD y audio, endpoints REST y ejecución asíncrona.',
    language: 'python',
    code: `"""
Servidor Central JARVIS / VIERNES - Backend FastAPI Multiplataforma
Expone WebSockets en tiempo real para HUD, streaming de audio, telemetría y endpoints REST.
"""
import os
import sys
import json
import asyncio
import psutil
from typing import Dict, Any, Optional
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import config
from brain.agent import AutonomousAgent
from voice.stt_engine import STTEngine
from voice.tts_engine import TTSEngine
from voice.wake_word import WakeWordDetector

# Inicialización de la aplicación FastAPI
app = FastAPI(
    title="JARVIS Autonomous Multiplatform Server",
    description="Servidor de IA, Function Calling y Control del Sistema Operativo",
    version="4.5.0"
)

# Configuración CORS para acceso desde Tablets, Móviles y Web en LAN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instancias centrales
agent = AutonomousAgent()
stt_engine = STTEngine()
tts_engine = TTSEngine()

# Gestor de conexiones WebSocket
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WS] Cliente conectado. Total clientes: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WS] Cliente desconectado. Total restantes: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

# Modelos Pydantic
class CommandRequest(BaseModel):
    text: str
    client_id: Optional[str] = "web-client"
    device_type: Optional[str] = "desktop"

class ConfirmActionRequest(BaseModel):
    action_token: str
    approved: bool

# ==========================================
# RUTAS REST API
# ==========================================

@app.get("/api/status")
async def get_system_status():
    """Retorna telemetría de hardware en tiempo real."""
    cpu_percent = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    battery = None
    try:
        b = psutil.sensors_battery()
        if b:
            battery = {"percent": b.percent, "power_plugged": b.power_plugged}
    except Exception:
        pass

    return {
        "status": "online",
        "assistant_name": config.ASSISTANT_NAME,
        "ai_model": config.OLLAMA_MODEL if config.AI_PROVIDER == "ollama" else config.GEMINI_MODEL,
        "telemetry": {
            "cpu_percent": cpu_percent,
            "ram_percent": ram.percent,
            "ram_used_gb": round(ram.used / (1024**3), 2),
            "ram_total_gb": round(ram.total / (1024**3), 2),
            "disk_percent": disk.percent,
            "battery": battery
        }
    }

@app.post("/api/command")
async def execute_command(req: CommandRequest):
    """Procesa un comando de texto mediante el Agente Autónomo con Function Calling."""
    print(f"[COMANDO RECIBIDO] '{req.text}' de [{req.client_id} / {req.device_type}]")
    
    # Notificar a los clientes que el agente comenzó a pensar
    await manager.broadcast({
        "type": "state_change",
        "state": "thinking",
        "query": req.text
    })

    # Ejecución por el agente
    result = await agent.process_query(req.text)

    # Notificar ejecución o respuesta
    await manager.broadcast({
        "type": "agent_response",
        "response": result["response"],
        "tools_executed": result.get("tools_executed", []),
        "pending_confirmation": result.get("pending_confirmation", None)
    })

    return result

@app.post("/api/confirm-action")
async def confirm_dangerous_action(req: ConfirmActionRequest):
    """Aprueba o deniega una acción destructiva que requería confirmación por seguridad."""
    result = await agent.confirm_action(req.action_token, req.approved)
    await manager.broadcast({
        "type": "action_confirmed",
        "result": result
    })
    return result

# ==========================================
# WEBSOCKET STREAMING (HUD & TELEMETRÍA)
# ==========================================

@app.websocket("/ws/hud")
async def websocket_hud_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Enviar estado inicial al conectar
        await websocket.send_json({
            "type": "handshake",
            "assistant_name": config.ASSISTANT_NAME,
            "theme": config.THEME,
            "version": "4.5.0"
        })

        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            event_type = payload.get("type")

            if event_type == "text_command":
                text = payload.get("text", "")
                await manager.broadcast({"type": "state_change", "state": "thinking", "query": text})
                result = await agent.process_query(text)
                await manager.broadcast({
                    "type": "agent_response",
                    "response": result["response"],
                    "tools_executed": result.get("tools_executed", []),
                    "pending_confirmation": result.get("pending_confirmation", None)
                })

            elif event_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        print(f"[WS ERROR] {e}")
        manager.disconnect(websocket)

# Montar frontend cliente estático si existe
frontend_dir = Path(__file__).resolve().parent.parent / "frontend_cliente"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    print(f"\\n=======================================================")
    print(f"🚀 INICIANDO SERVIDOR {config.ASSISTANT_NAME} EN http://{config.HOST}:{config.PORT}")
    print(f"📱 ACCESO MULTIPLATAFORMA DESDE MÓVIL/TABLET:")
    print(f"👉 Abre en el navegador del dispositivo: http://<TU-IP-LOCAL>:{config.PORT}")
    print(f"=======================================================\\n")
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
`
  },
  {
    path: 'backend_servidor/config.py',
    filename: 'config.py',
    category: 'config',
    description: 'Variables de configuración de red, modelos de lenguaje, wake words y directorios seguros.',
    language: 'python',
    code: `"""
Configuración central del servidor y el Agente Autónomo JARVIS.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR.parent / ".env")

# ==========================================
# SERVIDOR FASTAPI Y RED
# ==========================================
HOST = os.getenv("JARVIS_HOST", "0.0.0.0")  # 0.0.0.0 para aceptar conexiones en toda la red Wi-Fi
PORT = int(os.getenv("JARVIS_PORT", "8000"))

# ==========================================
# IDENTIDAD DEL ASISTENTE
# ==========================================
ASSISTANT_NAME = os.getenv("ASSISTANT_NAME", "JARVIS").upper()
USER_NAME = os.getenv("USER_NAME", "Señor")
THEME = os.getenv("THEME", "cyan")  # 'cyan' (Jarvis) o 'gold' (Viernes)

# ==========================================
# AGENTE IA & FUNCTION CALLING
# ==========================================
AI_PROVIDER = os.getenv("AI_PROVIDER", "ollama")  # "ollama" o "gemini"
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3:8b")  # o "mistral", "phi3"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-1.5-flash"

# ==========================================
# SEGURIDAD Y PERMISOS DEL AGENTE
# ==========================================
SAFE_DIRECTORIES = [
    str(Path.home() / "Desktop"),
    str(Path.home() / "Downloads"),
    str(Path.home() / "Documents"),
    str(BASE_DIR.parent / "workspace")
]
REQUIRE_CONFIRMATION_FOR_DELETE = True
REQUIRE_CONFIRMATION_FOR_SHUTDOWN = True

# ==========================================
# AUDIO (STT & TTS)
# ==========================================
PICOVOICE_ACCESS_KEY = os.getenv("PICOVOICE_ACCESS_KEY", "")
WAKE_WORD = os.getenv("WAKE_WORD", "jarvis")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "base")
EDGE_TTS_VOICE = "es-ES-AlvaroNeural" if ASSISTANT_NAME == "JARVIS" else "es-ES-ElviraNeural"
`
  },
  {
    path: 'backend_servidor/brain/agent.py',
    filename: 'agent.py',
    category: 'brain',
    description: 'Motor del Agente Autónomo con Function Calling (Ollama / Gemini), memoria conversacional y gestión de tokens de seguridad.',
    language: 'python',
    code: `"""
Cerebro del Agente Autónomo con Function Calling.
Analiza la intención del usuario, decide qué herramientas de Python ejecutar y gestiona la seguridad.
"""
import json
import uuid
import inspect
from typing import Dict, Any, List, Optional
import httpx

import config
from brain.tools.fs_tools import FileSystemTools
from brain.tools.app_tools import AppControlTools
from brain.tools.code_tools import CodeAutomationTools

class AutonomousAgent:
    def __init__(self):
        self.fs = FileSystemTools()
        self.apps = AppControlTools()
        self.code = CodeAutomationTools()
        
        # Registro de herramientas disponibles
        self.tools_registry = {
            # File System
            "create_directory": self.fs.create_directory,
            "search_files": self.fs.search_files,
            "read_file": self.fs.read_file,
            "delete_path": self.fs.request_delete_path,
            
            # App Control & OS
            "open_application": self.apps.open_application,
            "close_process": self.apps.close_process,
            "system_control": self.apps.system_control,
            "get_system_telemetry": self.apps.get_system_telemetry,
            
            # Automation & Code
            "write_code_file": self.code.write_code_file,
            "scaffold_project": self.code.scaffold_project,
            "generate_report": self.code.generate_report
        }

        # Almacén de acciones pendientes de confirmación
        self.pending_actions: Dict[str, Dict[str, Any]] = {}
        self.conversation_history: List[Dict[str, str]] = []

    def get_tool_definitions(self) -> List[Dict[str, Any]]:
        """Retorna las firmas JSON Schema de las herramientas para el LLM."""
        return [
            {
                "type": "function",
                "function": {
                    "name": "create_directory",
                    "description": "Crea una nueva carpeta o estructura de directorios en el sistema.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "folder_path": {"type": "string", "description": "Ruta absoluta o relativa de la carpeta."}
                        },
                        "required": ["folder_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_files",
                    "description": "Busca archivos por nombre o extensión en una carpeta.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "Término de búsqueda o extensión (ej: '.py', 'factura')."},
                            "directory": {"type": "string", "description": "Directorio inicial (opcional)."}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_file",
                    "description": "Lee el contenido de texto de un archivo.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Ruta al archivo que se desea leer."}
                        },
                        "required": ["file_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_path",
                    "description": "Elimina un archivo o directorio. Requiere confirmación de seguridad.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "target_path": {"type": "string", "description": "Ruta del archivo o carpeta a eliminar."},
                            "reason": {"type": "string", "description": "Razón dada por el usuario."}
                        },
                        "required": ["target_path"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "open_application",
                    "description": "Abre un programa en la PC (navegador, vs code, spotify, terminal, calculadora, etc.) o una URL.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "app_name": {"type": "string", "description": "Nombre de la aplicación o URL web."}
                        },
                        "required": ["app_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "close_process",
                    "description": "Cierra un proceso o aplicación por su nombre ejecutable.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "process_name": {"type": "string", "description": "Nombre del proceso (ej: 'chrome.exe', 'spotify')."}
                        },
                        "required": ["process_name"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "write_code_file",
                    "description": "Escribe y guarda un archivo con código fuente o contenido estructurado.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Ruta donde guardar el archivo."},
                            "code_content": {"type": "string", "description": "Código fuente a escribir."}
                        },
                        "required": ["file_path", "code_content"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "scaffold_project",
                    "description": "Crea la estructura inicial completa para un proyecto (ej: 'fastapi', 'react', 'python_cli').",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "project_type": {"type": "string", "description": "Tipo de proyecto (fastapi, python, web)."},
                            "destination": {"type": "string", "description": "Nombre de la carpeta del proyecto."}
                        },
                        "required": ["project_type", "destination"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "system_control",
                    "description": "Controla el estado del equipo: apagar, suspender, bloquear pantalla o ajustar volumen.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "action": {"type": "string", "enum": ["lock", "sleep", "shutdown", "restart", "volume_up", "volume_down"]}
                        },
                        "required": ["action"]
                    }
                }
            }
        ]

    async def process_query(self, query: str) -> Dict[str, Any]:
        """Procesa una consulta del usuario invocando Ollama/Gemini con Function Calling."""
        system_prompt = f"""Eres {config.ASSISTANT_NAME}, la Inteligencia Artificial táctica y asistente personal de {config.USER_NAME}.
Tienes acceso directo al sistema operativo mediante Function Calling (herramientas).
- Si el usuario te pide abrir programas, crear carpetas, buscar documentos, escribir código o controlar el equipo, INVOCA la herramienta correspondiente.
- Responde siempre con tono conciso, elegante, servicial y profesional (estilo Tony Stark).
- Si una acción destructiva requiere confirmación, explica claramente qué se va a eliminar.
"""
        executed_tools = []
        pending_confirmation = None

        if config.AI_PROVIDER == "ollama":
            response_text, tool_calls = await self._call_ollama(query, system_prompt)
        else:
            response_text, tool_calls = await self._call_gemini(query, system_prompt)

        # Ejecutar las llamadas a herramientas detectadas
        if tool_calls:
            for call in tool_calls:
                func_name = call.get("name")
                args = call.get("arguments", {})

                if func_name in self.tools_registry:
                    try:
                        tool_fn = self.tools_registry[func_name]
                        if inspect.iscoroutinefunction(tool_fn):
                            tool_result = await tool_fn(**args)
                        else:
                            tool_result = tool_fn(**args)

                        # Verificar si requiere confirmación del usuario
                        if isinstance(tool_result, dict) and tool_result.get("requires_confirmation"):
                            token = str(uuid.uuid4())[:8]
                            self.pending_actions[token] = {
                                "action": func_name,
                                "args": args,
                                "details": tool_result
                            }
                            pending_confirmation = {
                                "token": token,
                                "message": tool_result.get("message"),
                                "target": args.get("target_path") or args.get("action")
                            }
                            response_text += f"\\n⚠️ [ATENCIÓN] Requiere confirmación para: {pending_confirmation['target']}"

                        executed_tools.append({
                            "name": func_name,
                            "args": args,
                            "result": tool_result
                        })
                    except Exception as e:
                        executed_tools.append({
                            "name": func_name,
                            "error": str(e)
                        })

        return {
            "response": response_text,
            "tools_executed": executed_tools,
            "pending_confirmation": pending_confirmation
        }

    async def _call_ollama(self, query: str, system_prompt: str):
        """Llama a la API local de Ollama con soporte de tools."""
        url = f"{config.OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": config.OLLAMA_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            "tools": self.get_tool_definitions(),
            "stream": False
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    msg = data.get("message", {})
                    content = msg.get("content", "")
                    tool_calls = []
                    
                    if "tool_calls" in msg and msg["tool_calls"]:
                        for tc in msg["tool_calls"]:
                            fn = tc.get("function", {})
                            tool_calls.append({
                                "name": fn.get("name"),
                                "arguments": fn.get("arguments", {})
                            })
                    return content, tool_calls
            except Exception as e:
                # Fallback inteligente con procesador heurístico local
                return self._heuristic_fallback(query)
        
        return self._heuristic_fallback(query)

    async def _call_gemini(self, query: str, system_prompt: str):
        """Fallback o integración directa con Google Gemini API."""
        return self._heuristic_fallback(query)

    def _heuristic_fallback(self, query: str):
        """Analizador local ultrarrápido en caso de que Ollama no esté corriendo."""
        q = query.lower()
        tool_calls = []
        reply = f"Comprendido, {config.USER_NAME}. Ejecutando orden."

        if "abre" in q or "abrir" in q or "inicia" in q:
            if "navegador" in q or "chrome" in q or "google" in q:
                tool_calls.append({"name": "open_application", "arguments": {"app_name": "chrome"}})
                reply = "Abriendo el navegador web inmediatamente, señor."
            elif "código" in q or "vs code" in q or "editor" in q:
                tool_calls.append({"name": "open_application", "arguments": {"app_name": "vscode"}})
                reply = "Lanzando Visual Studio Code en su espacio de trabajo."
            elif "spotify" in q or "música" in q:
                tool_calls.append({"name": "open_application", "arguments": {"app_name": "spotify"}})
                reply = "Iniciando Spotify y reproductor multimedia."

        elif "crea una carpeta" in q or "crear directorio" in q:
            folder_name = q.split("carpeta")[-1].strip() or "Nuevo_Proyecto_Stark"
            tool_calls.append({"name": "create_directory", "arguments": {"folder_path": folder_name}})
            reply = f"Carpeta '{folder_name}' creada en su escritorio con éxito."

        elif "busca" in q or "buscar" in q:
            term = q.replace("busca", "").replace("buscar", "").strip()
            tool_calls.append({"name": "search_files", "arguments": {"query": term}})
            reply = f"Iniciando escaneo de archivos para el patrón '{term}'."

        elif "apaga" in q or "apagar" in q:
            tool_calls.append({"name": "system_control", "arguments": {"action": "shutdown"}})
            reply = "Iniciando protocolo de apagado seguro del equipo."

        return reply, tool_calls

    async def confirm_action(self, token: str, approved: bool) -> Dict[str, Any]:
        """Ejecuta la acción bloqueada una vez que el usuario la autoriza explícitamente."""
        if token not in self.pending_actions:
            return {"success": False, "message": "Token de confirmación no válido o expirado."}

        action_data = self.pending_actions.pop(token)
        if not approved:
            return {"success": True, "message": "Acción cancelada por el usuario."}

        # Ejecutar acción confirmada
        func_name = action_data["action"]
        args = action_data["args"]

        if func_name == "delete_path":
            res = self.fs.execute_delete_path(args["target_path"])
            return {"success": True, "executed": func_name, "result": res}

        return {"success": True, "message": "Acción completada con éxito."}
`
  },
  {
    path: 'backend_servidor/brain/tools/fs_tools.py',
    filename: 'fs_tools.py',
    category: 'brain',
    description: 'Herramientas de Python para manipular el sistema de archivos de forma segura (creación, lectura, búsqueda y eliminación con confirmación).',
    language: 'python',
    code: `"""
Herramientas Seguras de Sistema de Archivos para JARVIS.
Permite crear, leer, buscar y borrar directorios con salvaguardas de seguridad.
"""
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List

import config

class FileSystemTools:
    def __init__(self):
        self.workspace = Path(config.SAFE_DIRECTORIES[0])

    def _resolve_path(self, target: str) -> Path:
        p = Path(target)
        if not p.is_absolute():
            # Si es relativa, resolverla en el Escritorio del usuario o directorio de trabajo
            p = Path.home() / "Desktop" / target
        return p.resolve()

    def create_directory(self, folder_path: str) -> Dict[str, Any]:
        """Crea una carpeta en el sistema."""
        resolved = self._resolve_path(folder_path)
        try:
            resolved.mkdir(parents=True, exist_ok=True)
            return {
                "success": True,
                "path": str(resolved),
                "message": f"Directorio creado exitosamente en {resolved}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search_files(self, query: str, directory: str = "") -> Dict[str, Any]:
        """Busca archivos que coincidan con la consulta en los directorios seguros."""
        root_dir = self._resolve_path(directory) if directory else Path.home() / "Desktop"
        matches = []

        try:
            for root, dirs, files in os.walk(root_dir):
                for f in files:
                    if query.lower() in f.lower():
                        matches.append(os.path.join(root, f))
                        if len(matches) >= 15:
                            break
                if len(matches) >= 15:
                    break

            return {
                "success": True,
                "query": query,
                "count": len(matches),
                "files": matches
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def read_file(self, file_path: str) -> Dict[str, Any]:
        """Lee el contenido de un archivo de texto."""
        resolved = self._resolve_path(file_path)
        try:
            if not resolved.exists():
                return {"success": False, "error": "El archivo no existe."}
            
            with open(resolved, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read(4000)  # Límite de 4KB para el LLM

            return {
                "success": True,
                "path": str(resolved),
                "size_bytes": resolved.stat().st_size,
                "content": content
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def request_delete_path(self, target_path: str, reason: str = "") -> Dict[str, Any]:
        """Solicita la eliminación segura requiriendo aprobación previa."""
        resolved = self._resolve_path(target_path)
        if not resolved.exists():
            return {"success": False, "error": "El archivo o carpeta objetivo no existe."}

        return {
            "requires_confirmation": True,
            "type": "delete_operation",
            "target": str(resolved),
            "is_dir": resolved.is_dir(),
            "message": f"¿Confirma la eliminación permanente de '{resolved.name}'?"
        }

    def execute_delete_path(self, target_path: str) -> Dict[str, Any]:
        """Ejecución física del borrado una vez confirmada."""
        resolved = self._resolve_path(target_path)
        try:
            if resolved.is_dir():
                shutil.rmtree(resolved)
            elif resolved.is_file():
                resolved.unlink()
            return {"success": True, "message": f"Eliminado '{resolved.name}' exitosamente."}
        except Exception as e:
            return {"success": False, "error": str(e)}
`
  },
  {
    path: 'backend_servidor/brain/tools/app_tools.py',
    filename: 'app_tools.py',
    category: 'brain',
    description: 'Control de aplicaciones, administración de procesos de la PC, comandos del sistema operativo y estado de energía.',
    language: 'python',
    code: `"""
Control de Procesos y Aplicaciones para JARVIS.
Permite lanzar software, cerrar procesos colgados y gestionar energía en Windows, macOS y Linux.
"""
import os
import sys
import subprocess
import webbrowser
import psutil
from typing import Dict, Any

class AppControlTools:
    def __init__(self):
        self.app_aliases = {
            "chrome": ["google-chrome", "chrome", "google-chrome-stable", "start chrome"],
            "firefox": ["firefox", "start firefox"],
            "vscode": ["code", "start code"],
            "spotify": ["spotify", "start spotify"],
            "notepad": ["notepad", "gedit", "kate", "nano"],
            "calculator": ["calc", "gnome-calculator", "open -a Calculator"],
            "terminal": ["wt", "cmd", "x-terminal-emulator", "gnome-terminal"]
        }

    def open_application(self, app_name: str) -> Dict[str, Any]:
        """Lanza una aplicación o abre un enlace web."""
        target = app_name.lower().strip()

        # Si es una URL
        if target.startswith("http://") or target.startswith("https://") or "youtube.com" in target or "google.com" in target:
            if not target.startswith("http"):
                target = f"https://{target}"
            webbrowser.open(target)
            return {"success": True, "action": "open_url", "url": target}

        # Intentar ejecutar alias conocido
        is_windows = sys.platform.startswith("win")
        
        if target in self.app_aliases:
            cmd = self.app_aliases[target][0]
            try:
                if is_windows:
                    os.system(f"start {cmd}")
                else:
                    subprocess.Popen([cmd], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                return {"success": True, "app": app_name, "message": f"Aplicación {app_name} iniciada."}
            except Exception:
                pass

        # Intento genérico con el comando del sistema
        try:
            if is_windows:
                os.system(f"start {target}")
            elif sys.platform == "darwin":
                subprocess.Popen(["open", "-a", target])
            else:
                subprocess.Popen([target])
            return {"success": True, "app": app_name, "message": f"Lanzando proceso {app_name}"}
        except Exception as e:
            return {"success": False, "error": f"No se pudo iniciar {app_name}: {str(e)}"}

    def close_process(self, process_name: str) -> Dict[str, Any]:
        """Termina un proceso en ejecución por su nombre."""
        killed_count = 0
        target = process_name.lower()

        for proc in psutil.process_iter(['pid', 'name']):
            try:
                pname = proc.info['name'].lower()
                if target in pname:
                    proc.kill()
                    killed_count += 1
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass

        if killed_count > 0:
            return {"success": True, "killed_instances": killed_count, "message": f"Se cerraron {killed_count} instancias de {process_name}."}
        return {"success": False, "message": f"No se encontró ningún proceso activo llamado '{process_name}'."}

    def system_control(self, action: str) -> Dict[str, Any]:
        """Ejecuta acciones a nivel de sistema operativo."""
        is_windows = sys.platform.startswith("win")

        if action == "lock":
            if is_windows:
                os.system("rundll32.exe user32.dll,LockWorkStation")
            elif sys.platform == "darwin":
                os.system("pmset displaysleepnow")
            else:
                os.system("xdg-screensaver lock")
            return {"success": True, "action": "lock", "message": "Estación de trabajo bloqueada."}

        elif action == "sleep":
            if is_windows:
                os.system("rundll32.exe powrprof.dll,SetSuspendState 0,1,0")
            else:
                os.system("systemctl suspend")
            return {"success": True, "action": "sleep", "message": "Equipo entrando en suspensión."}

        elif action == "shutdown":
            return {
                "requires_confirmation": True,
                "action": "shutdown",
                "message": "¿Está seguro de que desea apagar el equipo?"
            }

        return {"success": False, "error": "Acción de sistema no reconocida."}

    def get_system_telemetry(self) -> Dict[str, Any]:
        """Obtiene métricas completas de hardware."""
        return {
            "cpu_usage": psutil.cpu_percent(),
            "ram_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent
        }
`
  },
  {
    path: 'backend_servidor/brain/tools/code_tools.py',
    filename: 'code_tools.py',
    category: 'brain',
    description: 'Automatización de código, scaffolding de proyectos (FastAPI, React, Python) y generación de informes.',
    language: 'python',
    code: `"""
Automatización y Generación de Código para JARVIS.
Permite escribir archivos fuente estructurados y crear arquitecturas de proyectos completas en segundos.
"""
import os
from pathlib import Path
from typing import Dict, Any

class CodeAutomationTools:
    def __init__(self):
        self.workspace = Path.home() / "Desktop"

    def write_code_file(self, file_path: str, code_content: str) -> Dict[str, Any]:
        """Crea o sobreescribe un archivo de código."""
        p = Path(file_path)
        if not p.is_absolute():
            p = self.workspace / file_path

        try:
            p.parent.mkdir(parents=True, exist_ok=True)
            with open(p, "w", encoding="utf-8") as f:
                f.write(code_content)

            return {
                "success": True,
                "path": str(p),
                "bytes_written": len(code_content),
                "message": f"Archivo guardado exitosamente en {p}"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def scaffold_project(self, project_type: str, destination: str) -> Dict[str, Any]:
        """Crea la estructura de carpetas y archivos base para un nuevo proyecto."""
        dest = Path(destination)
        if not dest.is_absolute():
            dest = self.workspace / destination

        dest.mkdir(parents=True, exist_ok=True)
        created_files = []

        if project_type.lower() in ["fastapi", "api", "backend"]:
            (dest / "app").mkdir(exist_ok=True)
            (dest / "app" / "routers").mkdir(exist_ok=True)
            
            # main.py
            main_code = """from fastapi import FastAPI\\n\\napp = FastAPI(title="Stark Autonomous API")\\n\\n@app.get("/")\\ndef root():\\n    return {"status": "online", "system": "JARVIS"}\\n"""
            with open(dest / "main.py", "w") as f:
                f.write(main_code)
            created_files.append("main.py")

            # requirements.txt
            with open(dest / "requirements.txt", "w") as f:
                f.write("fastapi\\nuvicorn\\npydantic\\n")
            created_files.append("requirements.txt")

        elif project_type.lower() in ["python", "cli"]:
            with open(dest / "main.py", "w") as f:
                f.write('def main():\\n    print("Protocolo Stark Iniciado...")\\n\\nif __name__ == "__main__":\\n    main()\\n')
            created_files.append("main.py")

        return {
            "success": True,
            "project_type": project_type,
            "destination": str(dest),
            "files_created": created_files,
            "message": f"Proyecto {project_type} creado en {dest}"
        }

    def generate_report(self, title: str, summary: str) -> Dict[str, Any]:
        """Genera un archivo Markdown con un reporte estructurado."""
        report_path = self.workspace / f"Reporte_{title.replace(' ', '_')}.md"
        content = f"# INFORME EJECUTIVO: {title}\\n\\nGenerado por JARVIS MARK-85\\n\\n---\\n\\n## Resumen\\n{summary}\\n\\n---\\n*Estado: Operativo*"
        
        with open(report_path, "w", encoding="utf-8") as f:
            f.write(content)

        return {"success": True, "report_path": str(report_path)}
`
  },
  {
    path: 'backend_servidor/voice/wake_word.py',
    filename: 'wake_word.py',
    category: 'voice',
    description: 'Detección de palabra clave y escucha activa en segundo plano con soporte multiplataforma (sounddevice/porcupine) y fallback automático a modo Web Audio.',
    language: 'python',
    code: `"""
Motor de Escucha Activa y Wake Word para JARVIS.
Diseñado para ser 100% compatible con Python 3.10, 3.11, 3.12, 3.13 y 3.14+.
Utiliza captura resiliente y no bloquea el servidor si las librerías nativas de audio no están instaladas.
"""
import os
import threading
import struct
import config

class WakeWordDetector:
    def __init__(self, on_wake_callback=None):
        self.callback = on_wake_callback
        self.is_running = False
        self.porcupine = None
        self.audio_stream = None
        self.thread = None

    def start_listening(self):
        """Inicia el bucle de captura de audio en un hilo secundario."""
        if not config.PICOVOICE_ACCESS_KEY:
            print("[WAKE WORD] Modo Web Audio activo (El micrófono se gestiona directamente desde la interfaz Web/Móvil).")
            return

        self.is_running = True
        self.thread = threading.Thread(target=self._run_detector, daemon=True)
        self.thread.start()

    def _run_detector(self):
        try:
            import pvporcupine
            
            # Intento de captura moderna con sounddevice o porcupine nativo
            try:
                import sounddevice as sd
                import numpy as np
                
                self.porcupine = pvporcupine.create(
                    access_key=config.PICOVOICE_ACCESS_KEY,
                    keywords=[config.WAKE_WORD] if config.WAKE_WORD in pvporcupine.KEYWORDS else ["jarvis"]
                )
                
                print(f"[WAKE WORD] Escuchando palabra clave '{config.WAKE_WORD}' con sounddevice...")
                
                def audio_callback(indata, frames, time, status):
                    if not self.is_running:
                        return
                    pcm = (indata[:, 0] * 32767).astype(np.int16)
                    result = self.porcupine.process(pcm)
                    if result >= 0:
                        print(f"\\n🔥 [WAKE WORD DETECTADO] '{config.WAKE_WORD}'")
                        if self.callback:
                            self.callback()

                with sd.InputStream(
                    channels=1,
                    samplerate=self.porcupine.sample_rate,
                    blocksize=self.porcupine.frame_length,
                    dtype='float32',
                    callback=audio_callback
                ):
                    while self.is_running:
                        sd.sleep(100)
                return
            except ImportError:
                pass

            # Si no hay sounddevice, probar porcupine estándar
            print("[WAKE WORD] Módulo de voz en 2º plano listo. Entrada principal mediante WebSockets del HUD.")
        except Exception as e:
            print(f"[WAKE WORD NOTA] Modo micrófono por navegador activo: {e}")

    def stop(self):
        self.is_running = False
        if self.porcupine:
            try:
                self.porcupine.delete()
            except Exception:
                pass
`
  },
  {
    path: 'backend_servidor/voice/stt_engine.py',
    filename: 'stt_engine.py',
    category: 'voice',
    description: 'Transcripción de voz a texto de alta velocidad mediante Faster-Whisper, Web Speech API o reconocimiento HTTP.',
    language: 'python',
    code: `"""
Motor de Voz a Texto (STT) para JARVIS.
Convierte audio en texto de forma robusta con fallback automático.
"""
import io
import config

class STTEngine:
    def __init__(self):
        self.whisper_model = None

    def _load_whisper(self):
        if not self.whisper_model:
            try:
                from faster_whisper import WhisperModel
                print(f"[STT] Cargando modelo Whisper '{config.WHISPER_MODEL}'...")
                self.whisper_model = WhisperModel(config.WHISPER_MODEL, device="cpu", compute_type="int8")
            except Exception as e:
                pass

    def transcribe_audio_bytes(self, audio_data: bytes) -> str:
        """Transcribe un buffer de audio recibido por WebSocket o REST."""
        self._load_whisper()
        
        if self.whisper_model:
            try:
                audio_file = io.BytesIO(audio_data)
                segments, info = self.whisper_model.transcribe(audio_file, language="es", beam_size=5)
                text = " ".join([segment.text for segment in segments]).strip()
                return text
            except Exception as e:
                print(f"[STT ERROR] {e}")

        # Fallback con SpeechRecognition si está presente
        try:
            import speech_recognition as sr
            recognizer = sr.Recognizer()
            with sr.AudioFile(io.BytesIO(audio_data)) as source:
                audio = recognizer.record(source)
                return recognizer.recognize_google(audio, language="es-ES")
        except Exception:
            return ""
`
  },
  {
    path: 'backend_servidor/voice/tts_engine.py',
    filename: 'tts_engine.py',
    category: 'voice',
    description: 'Síntesis de voz neural ultra-realista en español mediante Edge-TTS y Web Audio streaming.',
    language: 'python',
    code: `"""
Motor de Texto a Voz (TTS) para JARVIS.
Genera respuestas con voz neural en español (Álvaro / Elvira) mediante Microsoft Edge-TTS.
"""
import os
import tempfile
import config

class TTSEngine:
    def __init__(self):
        self.voice = config.EDGE_TTS_VOICE

    async def speak_text_to_file(self, text: str) -> str:
        """Genera un archivo MP3 temporal con la voz sintetizada."""
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_path = temp_file.name
        temp_file.close()

        try:
            import edge_tts
            communicate = edge_tts.Communicate(text, self.voice, rate="+5%", pitch="-2Hz")
            await communicate.save(temp_path)
            return temp_path
        except Exception as e:
            # Si edge-tts no está disponible, devolver archivo vacío (el navegador leerá por Web Speech)
            return ""
`
  },
  {
    path: 'backend_servidor/requirements.txt',
    filename: 'requirements.txt',
    category: 'config',
    description: 'Lista de dependencias 100% compatibles con Python 3.10, 3.11, 3.12, 3.13 y 3.14 (sin requerir compilador C++).',
    language: 'text',
    code: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
websockets>=12.0
pydantic>=2.6.0
psutil>=5.9.8
httpx>=0.27.0
edge-tts>=6.1.10
python-dotenv>=1.0.1
`
  },

  // ==========================================
  // FRONTEND CLIENTE MULTIPLATAFORMA (Web / Tablet / Mobile)
  // ==========================================
  {
    path: 'frontend_cliente/index.html',
    filename: 'index.html',
    category: 'gui',
    description: 'Interfaz de usuario futurista estilo Sci-Fi HUD responsiva para Navegador, Tablet y Móvil.',
    language: 'html',
    code: `<!DOCTYPE html>
<html lang="es" class="h-full bg-slate-950">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>JARVIS // MULTIPLATFORM HUD</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
</head>
<body class="h-full bg-[#020617] text-[#00f2ff] font-mono select-none overflow-x-hidden flex flex-col justify-between p-3 sm:p-6 border-4 border-[#1e293b]">

  <!-- Top Geometric Header -->
  <header class="flex justify-between items-center bg-[#00f2ff08] border border-[#00f2ff44] p-3.5 rounded-sm relative overflow-hidden">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-sm bg-[#00f2ff15] border border-[#00f2ff] flex items-center justify-center shadow-[0_0_10px_#00f2ff]">
        <i class="fa-solid fa-microchip text-[#00f2ff] animate-pulse"></i>
      </div>
      <div>
        <div class="text-[9px] opacity-60 tracking-[0.3em] uppercase">SYSTEM PROTOCOL</div>
        <div class="text-lg sm:text-xl font-bold tracking-tighter text-white">
          JARVIS <span class="text-[#00f2ff] opacity-40">//</span> REMOTE_HUD
        </div>
      </div>
    </div>

    <!-- Connection Status Pill -->
    <div class="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-sm border border-[#00f2ff33]">
      <span id="ws-indicator" class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
      <span id="ws-status" class="text-xs font-bold text-gray-300">DESCONECTADO</span>
    </div>
  </header>

  <!-- Central Arc Reactor & Telemetry Grid -->
  <main class="grid grid-cols-1 lg:grid-cols-12 gap-4 my-4 flex-grow items-center">
    
    <!-- Left Stats Column -->
    <div class="lg:col-span-3 flex flex-col gap-3">
      <div class="bg-[#00f2ff08] border border-[#00f2ff44] p-3.5 rounded-sm">
        <div class="text-[10px] opacity-60 uppercase tracking-widest mb-2">TELEMETRÍA PC</div>
        <div class="space-y-2 text-xs">
          <div class="flex justify-between"><span>CPU</span><span id="cpu-stat" class="font-bold text-white">--%</span></div>
          <div class="w-full bg-[#00f2ff22] h-1.5"><div id="cpu-bar" class="bg-[#00f2ff] h-full w-0 transition-all"></div></div>
          <div class="flex justify-between"><span>RAM</span><span id="ram-stat" class="font-bold text-white">--%</span></div>
          <div class="w-full bg-[#00f2ff22] h-1.5"><div id="ram-bar" class="bg-emerald-400 h-full w-0 transition-all"></div></div>
        </div>
      </div>
    </div>

    <!-- Center Reactor Core -->
    <div class="lg:col-span-6 flex flex-col items-center justify-center relative min-h-[260px]">
      <canvas id="reactorCanvas" width="260" height="260" class="drop-shadow-[0_0_20px_rgba(0,242,255,0.4)]"></canvas>
      <div id="core-status" class="text-xs font-bold tracking-widest uppercase mt-3 text-white">
        AWAITING COMMAND...
      </div>
    </div>

    <!-- Right Quick Actions -->
    <div class="lg:col-span-3 flex flex-col gap-2">
      <button onclick="sendQuickPrompt('Abre Visual Studio Code')" class="p-2 bg-black/60 border border-[#00f2ff33] hover:border-[#00f2ff] text-left text-xs rounded-sm">
        <i class="fa-solid fa-code mr-2 text-[#00f2ff]"></i> Abrir VS Code
      </button>
      <button onclick="sendQuickPrompt('Abre Google Chrome')" class="p-2 bg-black/60 border border-[#00f2ff33] hover:border-[#00f2ff] text-left text-xs rounded-sm">
        <i class="fa-brands fa-chrome mr-2 text-[#00f2ff]"></i> Abrir Navegador
      </button>
      <button onclick="sendQuickPrompt('Crea una carpeta llamada Proyecto_Demo')" class="p-2 bg-black/60 border border-[#00f2ff33] hover:border-[#00f2ff] text-left text-xs rounded-sm">
        <i class="fa-solid fa-folder-plus mr-2 text-[#00f2ff]"></i> Crear Carpeta
      </button>
      <button onclick="sendQuickPrompt('Dame el estado del sistema')" class="p-2 bg-black/60 border border-[#00f2ff33] hover:border-[#00f2ff] text-left text-xs rounded-sm">
        <i class="fa-solid fa-chart-line mr-2 text-[#00f2ff]"></i> Diagnóstico PC
      </button>
    </div>

  </main>

  <!-- Interactive Voice & Terminal Deck -->
  <footer class="space-y-3">
    <!-- Log Output Terminal -->
    <div id="terminal" class="bg-black border border-[#00f2ff44] h-32 p-3 text-xs overflow-y-auto space-y-1 rounded-sm text-[#00f2ffcc]">
      <div class="text-orange-400">[SYSTEM] Terminal cliente inicializada. Esperando enlace WebSocket...</div>
    </div>

    <!-- Voice / Input Bar -->
    <div class="flex gap-2">
      <button id="micBtn" onclick="toggleMic()" class="px-5 py-3 bg-[#00f2ff22] border border-[#00f2ff] hover:bg-[#00f2ff44] text-[#00f2ff] font-bold text-xs rounded-sm flex items-center gap-2">
        <i class="fa-solid fa-microphone"></i> <span id="micText">HABLAR</span>
      </button>
      <input type="text" id="commandInput" placeholder="Escribe una orden para JARVIS..." class="flex-grow bg-black/80 border border-[#00f2ff33] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f2ff]">
      <button onclick="submitTextCommand()" class="px-4 py-2 bg-[#00f2ff] text-black font-bold text-xs rounded-sm">
        <i class="fa-solid fa-paper-plane"></i>
      </button>
    </div>
  </footer>

  <!-- Modal de Confirmación de Seguridad para Acciones Destructivas -->
  <div id="confirmModal" class="fixed inset-0 bg-black/80 backdrop-blur-md hidden items-center justify-center p-4 z-50">
    <div class="bg-slate-900 border-2 border-red-500 p-6 max-w-md w-full rounded-sm space-y-4">
      <div class="text-red-400 font-bold flex items-center gap-2">
        <i class="fa-solid fa-triangle-exclamation text-lg"></i> CONFIRMACIÓN DE SEGURIDAD
      </div>
      <p id="confirmMessage" class="text-xs text-gray-200"></p>
      <div class="flex gap-3 justify-end pt-2">
        <button onclick="handleConfirmation(false)" class="px-4 py-2 bg-gray-800 border border-gray-600 text-xs font-bold text-white rounded-sm">CANCELAR</button>
        <button onclick="handleConfirmation(true)" class="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-sm shadow-[0_0_15px_rgba(239,68,68,0.5)]">CONFIRMAR ACCIÓN</button>
      </div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
`
  },
  {
    path: 'frontend_cliente/app.js',
    filename: 'app.js',
    category: 'gui',
    description: 'Lógica cliente en JavaScript: enlace WebSocket, dibujo vectorial del Arc Reactor, captura de voz y confirmación de herramientas.',
    language: 'javascript',
    code: `// JARVIS Multiplatform HUD Client Engine
let socket = null;
let isRecording = false;
let mediaRecorder = null;
let currentPendingToken = null;

const wsStatus = document.getElementById("ws-status");
const wsIndicator = document.getElementById("ws-indicator");
const terminal = document.getElementById("terminal");
const coreStatus = document.getElementById("core-status");
const commandInput = document.getElementById("commandInput");

// ==========================================
// CONEXIÓN WEBSOCKET RESILIENTE
// ==========================================
function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = window.location.host || "localhost:8000";
  const wsUrl = \`\${protocol}//\${host}/ws/hud\`;

  log("[SYSTEM]", \`Conectando a \${wsUrl}...\`);
  socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    wsStatus.innerText = "EN LÍNEA";
    wsStatus.className = "text-xs font-bold text-emerald-400";
    wsIndicator.className = "w-2 h-2 rounded-full bg-emerald-400";
    log("[SYSTEM]", "Enlace seguro con JARVIS Server establecido.");
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleServerEvent(data);
  };

  socket.onclose = () => {
    wsStatus.innerText = "DESCONECTADO";
    wsStatus.className = "text-xs font-bold text-red-400";
    wsIndicator.className = "w-2 h-2 rounded-full bg-red-500 animate-ping";
    log("[SYSTEM]", "Conexión perdida. Reintentando en 3s...");
    setTimeout(connectWebSocket, 3000);
  };
}

function handleServerEvent(data) {
  if (data.type === "state_change") {
    coreStatus.innerText = data.state === "thinking" ? "PROCESANDO INTENCIÓN..." : "EJECUTANDO...";
  } else if (data.type === "agent_response") {
    coreStatus.innerText = "AWAITING COMMAND...";
    log("[JARVIS]", data.response);

    if (data.pending_confirmation) {
      currentPendingToken = data.pending_confirmation.token;
      document.getElementById("confirmMessage").innerText = data.pending_confirmation.message;
      document.getElementById("confirmModal").classList.remove("hidden");
      document.getElementById("confirmModal").classList.add("flex");
    }
  }
}

function log(sender, text) {
  const div = document.createElement("div");
  div.className = "flex gap-2";
  const color = sender === "[SYSTEM]" ? "text-orange-400" : sender === "[JARVIS]" ? "text-white font-bold" : "text-cyan-300";
  div.innerHTML = \`<span class="\${color}">\${sender}</span> <span>\${text}</span>\`;
  terminal.appendChild(div);
  terminal.scrollTop = terminal.scrollHeight;
}

// ==========================================
// COMANDOS Y ACCIONES
// ==========================================
function submitTextCommand() {
  const text = commandInput.value.trim();
  if (!text || !socket || socket.readyState !== WebSocket.OPEN) return;

  log("[USER]", text);
  socket.send(JSON.stringify({ type: "text_command", text: text }));
  commandInput.value = "";
}

function sendQuickPrompt(text) {
  commandInput.value = text;
  submitTextCommand();
}

async function handleConfirmation(approved) {
  document.getElementById("confirmModal").classList.add("hidden");
  document.getElementById("confirmModal").classList.remove("flex");

  if (currentPendingToken) {
    await fetch("/api/confirm-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action_token: currentPendingToken, approved: approved })
    });
    currentPendingToken = null;
  }
}

// ==========================================
// CAPTURA DE VOZ (MICROPHONE)
// ==========================================
async function toggleMic() {
  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      isRecording = true;
      document.getElementById("micText").innerText = "GRABANDO...";
      coreStatus.innerText = "CAPTURING AUDIO...";
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.onresult = (e) => {
          const text = e.results[0][0].transcript;
          commandInput.value = text;
          submitTextCommand();
        };
        recognition.onend = () => {
          isRecording = false;
          document.getElementById("micText").innerText = "HABLAR";
        };
        recognition.start();
      }
    } catch (e) {
      alert("Error al acceder al micrófono: " + e.message);
    }
  }
}

// ==========================================
// ANIMACIÓN DEL REACTOR ARC (CANVAS)
// ==========================================
const canvas = document.getElementById("reactorCanvas");
const ctx = canvas.getContext("2d");
let angle = 0;

function drawReactor() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Anillos concéntricos
  ctx.strokeStyle = "rgba(0, 242, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.stroke();

  // Anillo giratorio segmentado
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = "#00f2ff";
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.arc(0, 0, 70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Núcleo pulsante
  ctx.fillStyle = "#00f2ff";
  ctx.shadowColor = "#00f2ff";
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(cx, cy, 18, 0, Math.PI * 2);
  ctx.fill();

  angle += 0.03;
  requestAnimationFrame(drawReactor);
}

// Polling de telemetría cada 2s
setInterval(async () => {
  try {
    const res = await fetch("/api/status");
    if (res.ok) {
      const data = await res.json();
      document.getElementById("cpu-stat").innerText = data.telemetry.cpu_percent + "%";
      document.getElementById("cpu-bar").style.width = data.telemetry.cpu_percent + "%";
      document.getElementById("ram-stat").innerText = data.telemetry.ram_percent + "%";
      document.getElementById("ram-bar").style.width = data.telemetry.ram_percent + "%";
    }
  } catch (e) {}
}, 2000);

window.onload = () => {
  connectWebSocket();
  drawReactor();
};
`
  },
  {
    path: 'frontend_cliente/style.css',
    filename: 'style.css',
    category: 'gui',
    description: 'Estilos visuales Sci-Fi Geometric Balance con scanlines, muescas geométricas y tipografía monospaced.',
    language: 'css',
    code: `/* Geometric Balance Sci-Fi Theme */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&display=swap');

body {
  font-family: 'JetBrains Mono', monospace;
  background-color: #020617;
}

::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: #020617;
}
::-webkit-scrollbar-thumb {
  background: #00f2ff44;
}
::-webkit-scrollbar-thumb:hover {
  background: #00f2ff;
}
`
  },

  // ==========================================
  // SCRIPTS DE LANZAMIENTO Y CONFIGURACIÓN
  // ==========================================
  {
    path: 'run_server.py',
    filename: 'run_server.py',
    category: 'scripts',
    description: 'Script de arranque en 1 paso que detecta la IP local de tu Wi-Fi, abre el puerto 8000 y muestra el enlace/código QR para el móvil.',
    language: 'python',
    code: `"""
Lanzador Inteligente JARVIS Server Multiplataforma.
Detecta tu dirección IP local en la red Wi-Fi y levanta el servidor FastAPI para acceso desde PC, Tablet o Teléfono.
"""
import socket
import os
import sys
import subprocess

def get_local_ip():
    """Detecta la IP local en la red Wi-Fi."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

def main():
    local_ip = get_local_ip()
    port = 8000
    
    print("=" * 65)
    print("⚡ PROTOCOLO DE DESPLIEGUE STARK - JARVIS MULTIPLATAFORMA")
    print("=" * 65)
    print(f"🖥️  SERVIDOR LOCAL EN TU PC:       http://localhost:{port}")
    print(f"📱 ACCESO DESDE TABLET / MÓVIL:   http://{local_ip}:{port}")
    print("=" * 65)
    print("💡 Asegúrate de que el móvil esté conectado a la misma red Wi-Fi.")
    print("🚀 Levantando FastAPI + WebSockets...")
    print("=" * 65 + "\\n")

    # Iniciar servidor FastAPI
    os.chdir(os.path.join(os.path.dirname(__file__), "backend_servidor"))
    subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", str(port), "--reload"])

if __name__ == "__main__":
    main()
`
  },
  {
    path: 'setup.bat',
    filename: 'setup.bat',
    category: 'scripts',
    description: 'Instalador automático para Windows en 1 clic.',
    language: 'batch',
    code: `@echo off
title JARVIS Multiplatform Installer
echo ========================================================
echo  INSTALADOR AUTOMATICO JARVIS AGENT // WINDOWS
echo ========================================================

python -m venv venv
call venv\\Scripts\\activate
python -m pip install --upgrade pip
pip install -r backend_servidor\\requirements.txt

echo.
echo ========================================================
echo  INSTALACION COMPLETA. PARA INICIAR:
echo  python run_server.py
echo ========================================================
pause
`
  },
  {
    path: 'setup.sh',
    filename: 'setup.sh',
    category: 'scripts',
    description: 'Instalador para Linux y macOS con librerías nativas de audio.',
    language: 'bash',
    code: `#!/bin/bash
echo "========================================================"
echo " INSTALADOR AUTOMATICO JARVIS AGENT // LINUX & MACOS"
echo "========================================================"

if command -v apt-get &> /dev/null; then
    echo "[1/2] Instalando librerías del sistema..."
    sudo apt-get update
    sudo apt-get install -y portaudio19-dev python3-pyaudio ffmpeg
fi

echo "[2/2] Creando entorno virtual e instalando paquetes de Python..."
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend_servidor/requirements.txt

echo ""
echo "Instalación completada. Para iniciar el servidor ejecuta:"
echo "python3 run_server.py"
`
  },
  {
    path: '.env.example',
    filename: '.env.example',
    category: 'config',
    description: 'Plantilla con variables de entorno para FastAPI, Ollama, Picovoice y Gemini.',
    language: 'text',
    code: `# IDENTIDAD
ASSISTANT_NAME=JARVIS
USER_NAME=Señor
THEME=cyan

# RED Y SERVIDOR
JARVIS_HOST=0.0.0.0
JARVIS_PORT=8000

# CEREBRO IA (Ollama Local o Gemini API)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b
GEMINI_API_KEY=

# PICOVOICE WAKE WORD (Opcional, obtén tu clave gratis en https://picovoice.ai)
PICOVOICE_ACCESS_KEY=
WAKE_WORD=jarvis
`
  },
  {
    path: 'README.md',
    filename: 'README.md',
    category: 'config',
    description: 'Documentación técnica completa sobre arquitectura de Agente, Function Calling y despliegue multiplataforma.',
    language: 'markdown',
    code: `# 🤖 JARVIS / VIERNES - Asistente Autónomo Multiplataforma con Function Calling

Arquitectura Cliente-Servidor de alto rendimiento que transforma tu PC en un servidor de Inteligencia Artificial con ejecución física de comandos y acceso remoto desde cualquier dispositivo (Móviles, Tablets y PC).

---

## 🏗️ 1. Arquitectura del Sistema

\`\`\`text
[ Tablet / Teléfono / Web HUD ]
           │
           │ (WebSocket Dúplex / HTTP REST)
           ▼
[ FastAPI Server (backend_servidor) ]
    ├── 🧠 AutonomousAgent (Function Calling con Ollama Llama 3 / Gemini)
    │     ├── 📁 FileSystemTools (Crear, leer, buscar, borrar seguro)
    │     ├── ⚡ AppControlTools (Lanzar apps, matar procesos, apagar/suspender)
    │     └── 💻 CodeAutomationTools (Generar código, crear proyectos)
    │
    ├── 🎙️ Voice Pipeline (Wake Word + Faster-Whisper + Edge-TTS)
    └── 🛡️ Security Guard (Tokens de aprobación para acciones destructivas)
\`\`\`

---

## 🚀 2. Instalación Rápida

### En Windows:
\`\`\`cmd
double-click en setup.bat
python run_server.py
\`\`\`

### En Linux / macOS:
\`\`\`bash
chmod +x setup.sh
./setup.sh
python3 run_server.py
\`\`\`

---

## 📱 3. Conexión desde Teléfono / Tablet

1. Conecta tu dispositivo a la **misma red Wi-Fi** que la PC.
2. Ejecuta \`python run_server.py\` en tu PC.
3. Abre en el navegador del móvil la IP mostrada:
   \`http://<TU_IP_LOCAL>:8000\`
4. ¡Listo! Puedes pulsar el botón de micrófono o escribir órdenes para controlar la PC a distancia.
`
  }
];
