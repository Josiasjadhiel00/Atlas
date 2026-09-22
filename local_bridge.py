#!/usr/bin/env python3
"""
=======================================================================
JARVIS // LOCAL WINDOWS/MAC BRIDGE SERVER
=======================================================================
Este script se ejecuta en tu computadora y le da a JARVIS permisos reales
para abrir programas, crear carpetas, abrir navegadores y controlar tu PC.

Para ejecutarlo en tu PC:
  1. Abre tu terminal (CMD / PowerShell / Terminal)
  2. Ejecuta: python local_bridge.py
=======================================================================
"""

import os
import sys
import secrets
import subprocess
import webbrowser
import platform
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 5000
# SEGURIDAD: solo localhost. No cambiar a 0.0.0.0 — eso expone el puente
# a cualquier dispositivo de tu red local.
HOST = "127.0.0.1"

# SEGURIDAD: token compartido. Si no está en el entorno, se genera uno
# aleatorio al arrancar y se imprime en consola. Copia ese valor a la
# variable ATLAS_BRIDGE_TOKEN en tu .env para que server.ts pueda usarlo.
BRIDGE_TOKEN = os.environ.get("ATLAS_BRIDGE_TOKEN") or secrets.token_hex(24)

# SEGURIDAD: solo se acepta CORS desde el origen real de tu app (evita que
# una página web cualquiera pueda llamar a este puente desde el navegador
# de la víctima). Ajusta ATLAS_APP_ORIGIN si tu app corre en otro puerto/host.
ALLOWED_ORIGIN = os.environ.get("ATLAS_APP_ORIGIN", "http://localhost:3000")

class JarvisBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        origin = self.headers.get('Origin', '')
        if origin == ALLOWED_ORIGIN:
            self.send_header('Access-Control-Allow-Origin', origin)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Atlas-Token')

    def _authorized(self):
        return secrets.compare_digest(self.headers.get('X-Atlas-Token', ''), BRIDGE_TOKEN)

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/status" or self.path == "/":
            self.send_response(200)
            self._send_cors_headers()
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                "status": "online",
                "service": "JARVIS Native Local Bridge",
                "os": platform.system(),
                "platform": platform.platform(),
                "user": os.getlogin() if hasattr(os, 'getlogin') else "User"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        self._send_cors_headers()

        # SEGURIDAD: rechazar cualquier request sin el token correcto antes
        # de tocar el body o ejecutar nada.
        if not self._authorized():
            self.send_response(401)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "No autorizado"}).encode('utf-8'))
            return

        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode('utf-8'))
        except Exception as e:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": "Invalid JSON"}).encode('utf-8'))
            return

        action = data.get("action", "")
        payload = data.get("payload", {})
        res = {"success": False}

        print(f"\n[STARK PROTOCOL] Ejecutando acción: {action}")
        print(f"  Detalles: {payload}")

        try:
            # 1. Abrir aplicación / Programa en Windows/Mac
            if action == "open_app" or action == "open_program":
                app_name = payload.get("name", "").lower()
                if "code" in app_name or "vs code" in app_name or "visual studio" in app_name:
                    subprocess.Popen(["code"], shell=True)
                    res = {"success": True, "message": "Visual Studio Code iniciado"}
                elif "chrome" in app_name:
                    if platform.system() == "Windows":
                        subprocess.Popen(["start", "chrome"], shell=True)
                    else:
                        subprocess.Popen(["open", "-a", "Google Chrome"])
                    res = {"success": True, "message": "Google Chrome iniciado"}
                elif "spotify" in app_name:
                    if platform.system() == "Windows":
                        subprocess.Popen(["start", "spotify"], shell=True)
                    else:
                        subprocess.Popen(["open", "-a", "Spotify"])
                    res = {"success": True, "message": "Spotify iniciado"}
                elif "notepad" in app_name or "bloc de notas" in app_name:
                    subprocess.Popen(["notepad.exe"], shell=True)
                    res = {"success": True, "message": "Bloc de notas abierto"}
                elif "calculator" in app_name or "calculadora" in app_name:
                    if platform.system() == "Windows":
                        subprocess.Popen(["calc.exe"], shell=True)
                    else:
                        subprocess.Popen(["open", "-a", "Calculator"])
                    res = {"success": True, "message": "Calculadora abierta"}
                else:
                    subprocess.Popen([app_name], shell=True)
                    res = {"success": True, "message": f"Comando '{app_name}' ejecutado"}

            # 2. Crear carpeta en el Escritorio o ruta específica
            elif action == "create_folder":
                folder_name = payload.get("name", "Nueva_Carpeta_JARVIS")
                desktop = os.path.join(os.path.expanduser("~"), "Desktop")
                target = os.path.join(desktop, folder_name)
                os.makedirs(target, exist_ok=True)
                res = {"success": True, "path": target, "message": f"Carpeta '{folder_name}' creada en Escritorio"}

            # 3. Abrir Explorador de Archivos
            elif action == "open_folder":
                target = payload.get("path", "~/Desktop").replace("~", os.path.expanduser("~"))
                os.makedirs(target, exist_ok=True)
                if platform.system() == "Windows":
                    os.startfile(target)
                elif platform.system() == "Darwin":
                    subprocess.Popen(["open", target])
                else:
                    subprocess.Popen(["xdg-open", target])
                res = {"success": True, "path": target, "message": f"Carpeta '{target}' abierta"}

            # 4. Abrir URL / Navegador
            elif action == "open_url":
                url = payload.get("url", "https://google.com")
                webbrowser.open(url)
                res = {"success": True, "url": url, "message": f"URL {url} abierta en navegador"}

            # 5. NOTA DE SEGURIDAD: se eliminó "execute_command" (ejecutaba
            # cualquier comando de shell recibido por HTTP, sin restricción
            # de qué se podía correr). Con el token ya activo el riesgo baja
            # mucho, pero un comando de shell arbitrario sigue siendo
            # demasiado poder para un endpoint HTTP. Si en el futuro lo
            # necesitas, hazlo con una lista blanca de comandos permitidos
            # en vez de aceptar cualquier string.

            # 6. Apagar / Reiniciar PC
            elif action == "shutdown_pc":
                if platform.system() == "Windows":
                    os.system("shutdown /s /t 60")
                res = {"success": True, "message": "Secuencia de apagado iniciada (60s)"}

            elif action == "cancel_shutdown":
                if platform.system() == "Windows":
                    os.system("shutdown /a")
                res = {"success": True, "message": "Apagado cancelado"}

            else:
                res = {"success": False, "error": f"Acción desconocida: {action}"}

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(res).encode('utf-8'))

        except Exception as err:
            print(f"[ERROR] {err}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"success": False, "error": str(err)}).encode('utf-8'))

    def log_message(self, format, *args):
        # Silenciar logs ruidosos para mantener limpia la consola
        return

def run():
    server_address = (HOST, PORT)
    httpd = HTTPServer(server_address, JarvisBridgeHandler)
    print("=" * 60)
    print("  🚀 JARVIS // PUENTE LOCAL DE CONTROL DE WINDOWS ACTIVO")
    print("=" * 60)
    print(f"  ● Escuchando en: http://127.0.0.1:{PORT} (solo localhost)")
    print(f"  ● Sistema Operativo: {platform.system()} ({platform.platform()})")
    print(f"  ● Estado: Listo para recibir comandos desde la cabina de JARVIS")
    if not os.environ.get("ATLAS_BRIDGE_TOKEN"):
        print("=" * 60)
        print("  ⚠️  No hay ATLAS_BRIDGE_TOKEN en tu entorno. Se generó uno")
        print("      temporal para esta sesión. Cópialo a tu .env como:")
        print(f"      ATLAS_BRIDGE_TOKEN={BRIDGE_TOKEN}")
        print("      y reinicia server.ts para que puedan hablar entre sí.")
    print("=" * 60)
    print("  Deja esta ventana abierta mientras uses JARVIS.")
    print("=" * 60 + "\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nDeteniendo servidor puente de JARVIS.")
        httpd.server_close()

if __name__ == '__main__':
    run()
