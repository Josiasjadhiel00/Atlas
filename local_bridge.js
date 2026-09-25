#!/usr/bin/env node
/**
 * JARVIS // PUENTE LOCAL EN NODE.JS PARA CONTROL DE WINDOWS / MAC / LINUX
 * 
 * Para correrlo en tu computadora:
 *   node local_bridge.js
 */

const http = require('http');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5000;

// SEGURIDAD: token compartido. Si no está en el entorno, se genera uno
// aleatorio al arrancar y se imprime en consola. Cópialo a tu .env como
// ATLAS_BRIDGE_TOKEN para que server.ts pueda autenticarse.
const BRIDGE_TOKEN = process.env.ATLAS_BRIDGE_TOKEN || crypto.randomBytes(24).toString('hex');

// SEGURIDAD: solo se acepta CORS desde el origen real de tu app (evita que
// una página web cualquiera pueda llamar a este puente desde el navegador
// de la víctima).
const ALLOWED_ORIGIN = process.env.ATLAS_APP_ORIGIN || 'http://localhost:3000';

// SEGURIDAD: eliminar_archivo NUNCA borra fuera de esta carpeta, sin
// importar lo que pida el modelo de IA. Por defecto tu Escritorio; puedes
// apuntarlo a una carpeta de trabajo dedicada con ATLAS_SAFE_DELETE_ROOT.
const SAFE_DELETE_ROOT = fs.realpathSync(
  process.env.ATLAS_SAFE_DELETE_ROOT || path.join(os.homedir(), 'Desktop')
);

function resolveSafeDeleteTarget(rawPath) {
  if (!rawPath) return null;
  let candidate = String(rawPath).replace(/^~/, os.homedir());
  if (!path.isAbsolute(candidate)) candidate = path.join(SAFE_DELETE_ROOT, candidate);
  let real;
  try {
    real = fs.realpathSync(candidate);
  } catch {
    return null; // no existe
  }
  if (real === SAFE_DELETE_ROOT || !real.startsWith(SAFE_DELETE_ROOT + path.sep)) return null;
  return real;
}

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// SEGURIDAD: antes "abrir app" armaba un string de shell con el nombre que
// llegara por HTTP (`exec(cmd, {shell:true})`), así que un nombre con
// comillas o `;`/`&&` podía inyectar comandos. Ahora solo se puede abrir lo
// que esté en esta lista, y se lanza con spawn() sin shell — el texto que
// llega nunca se interpreta como comando, solo como argumento literal.
const APP_LAUNCHERS = {
  win32: {
    code: ['cmd.exe', ['/c', 'code']],
    chrome: ['cmd.exe', ['/c', 'start', '', 'chrome']],
    spotify: ['cmd.exe', ['/c', 'start', '', 'spotify']],
    notepad: ['notepad.exe', []],
    calculator: ['calc.exe', []]
  },
  darwin: {
    code: ['open', ['-a', 'Visual Studio Code']],
    chrome: ['open', ['-a', 'Google Chrome']],
    spotify: ['open', ['-a', 'Spotify']],
    notepad: ['open', ['-a', 'TextEdit']],
    calculator: ['open', ['-a', 'Calculator']]
  },
  linux: {
    code: ['code', []],
    chrome: ['google-chrome', []],
    spotify: ['spotify', []],
    notepad: ['gedit', []],
    calculator: ['gnome-calculator', []]
  }
};

function resolveAppKey(rawName) {
  const n = String(rawName || '').toLowerCase();
  if (n.includes('code') || n.includes('visual studio')) return 'code';
  if (n.includes('chrome')) return 'chrome';
  if (n.includes('spotify')) return 'spotify';
  if (n.includes('notepad') || n.includes('notas') || n.includes('bloc')) return 'notepad';
  if (n.includes('calc')) return 'calculator';
  return null;
}

// SEGURIDAD: crea la carpeta SIEMPRE dentro de "root", sin importar cuántos
// "../" traiga el nombre pedido — evita que "crear carpeta" se use para
// escribir fuera de la zona esperada.
function resolveWithinRoot(root, rawName) {
  const safeName = String(rawName || 'Nueva_Carpeta_JARVIS');
  const candidate = path.resolve(root, safeName);
  if (candidate !== root && !candidate.startsWith(root + path.sep)) return null;
  return candidate;
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (origin === ALLOWED_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Atlas-Token');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/status')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'JARVIS Node Local Bridge',
      platform: os.platform(),
      hostname: os.hostname(),
      user: os.userInfo().username
    }));
    return;
  }

  if (req.method === 'POST') {
    // SEGURIDAD: rechazar cualquier request sin el token correcto antes de
    // leer el body o ejecutar nada.
    if (!timingSafeEqual(req.headers['x-atlas-token'] || '', BRIDGE_TOKEN)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'No autorizado' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const action = data.action;
        const payload = data.payload || {};

        console.log(`\n[STARK PROTOCOL] Ejecutando: ${action}`, payload);

        // 1. Abrir aplicación — solo desde la lista blanca APP_LAUNCHERS,
        // lanzada con spawn() sin shell (ver nota de seguridad arriba).
        if (action === 'open_app' || action === 'open_program') {
          const appName = String(payload.name || '');
          const key = resolveAppKey(appName);
          const table = APP_LAUNCHERS[process.platform] || APP_LAUNCHERS.linux;
          const launcher = key ? table[key] : null;

          if (!launcher) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: false,
              error: `No conozco la app "${appName}". Añádela a APP_LAUNCHERS en local_bridge.js para poder abrirla de forma segura.`
            }));
            return;
          }

          const [cmd, args] = launcher;
          try {
            const child = spawn(cmd, args, { shell: false, detached: true, stdio: 'ignore' });
            child.on('error', (err) => {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: err.message }));
            });
            child.unref();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: `Aplicación ejecutada: ${key}` }));
          } catch (err) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));
          }
        }
        // 2. Crear carpeta en escritorio — contenida dentro de Desktop pase
        // lo que pase en el nombre (ver resolveWithinRoot).
        else if (action === 'create_folder') {
          const desktop = path.join(os.homedir(), 'Desktop');
          const target = resolveWithinRoot(desktop, payload.name);
          if (!target) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Nombre de carpeta inválido (se sale del Escritorio).' }));
          } else {
            fs.mkdirSync(target, { recursive: true });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, path: target, message: `Carpeta creada en Escritorio` }));
          }
        }
        // 3. Abrir carpeta en explorador — spawn() sin shell (sin
        // interpolar el path en un string de comando), y solo si ya existe
        // (no crea directorios nuevos en cualquier parte del disco).
        else if (action === 'open_folder') {
          const raw = String(payload.path || '~/Desktop');
          const target = raw.replace(/^~/, os.homedir());
          if (!fs.existsSync(target)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `No existe: ${target}` }));
          } else {
            const [cmd, args] = process.platform === 'win32' ? ['explorer.exe', [target]]
              : process.platform === 'darwin' ? ['open', [target]]
              : ['xdg-open', [target]];
            const child = spawn(cmd, args, { shell: false, detached: true, stdio: 'ignore' });
            child.unref();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, path: target }));
          }
        }
        // 4. Abrir URL — solo http(s), spawn() sin shell.
        else if (action === 'open_url') {
          const rawUrl = String(payload.url || 'https://google.com');
          let parsed;
          try { parsed = new URL(rawUrl); } catch { parsed = null; }
          if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Solo se permiten URLs http:// o https://' }));
          } else {
            const [cmd, args] = process.platform === 'win32' ? ['cmd.exe', ['/c', 'start', '', parsed.toString()]]
              : process.platform === 'darwin' ? ['open', [parsed.toString()]]
              : ['xdg-open', [parsed.toString()]];
            const child = spawn(cmd, args, { shell: false, detached: true, stdio: 'ignore' });
            child.unref();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, url: parsed.toString() }));
          }
        }
        // 5. NOTA DE SEGURIDAD: se eliminó "execute_command" (ejecutaba
        // cualquier comando de shell recibido por HTTP, sin restricción de
        // qué se podía correr). Con el token ya activo el riesgo baja
        // mucho, pero un comando de shell arbitrario sigue siendo demasiado
        // poder para un endpoint HTTP. Si en el futuro lo necesitas, usa una
        // lista blanca de comandos permitidos en vez de aceptar cualquier
        // string.

        // 6. Apagar / suspender / bloquear / cancelar apagado. Esta acción
        // solo llega aquí después de que el usuario confirmó explícitamente
        // en pantalla (ver server.ts /api/assistant/confirm).
        else if (action === 'system_power') {
          const sub = payload.action;
          const plat = process.platform;
          const run = (cmd) => exec(cmd, () => {});
          if (sub === 'shutdown') {
            if (plat === 'win32') run('shutdown /s /t 60');
            else if (plat === 'darwin') run('osascript -e \'tell app "System Events" to shut down\'');
            else run('shutdown -h +1');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Secuencia de apagado iniciada (60s). Puedes cancelarla.' }));
          } else if (sub === 'sleep') {
            if (plat === 'win32') run('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
            else if (plat === 'darwin') run('pmset sleepnow');
            else run('systemctl suspend');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Sistema suspendido' }));
          } else if (sub === 'lock') {
            if (plat === 'win32') run('rundll32.exe user32.dll,LockWorkStation');
            else if (plat === 'darwin') run('pmset displaysleepnow');
            else run('loginctl lock-session');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Estación bloqueada' }));
          } else if (sub === 'cancel_shutdown') {
            if (plat === 'win32') run('shutdown /a');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Apagado cancelado' }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Sub-acción de energía desconocida: ${sub}` }));
          }
        }
        // 7. Eliminar archivo/carpeta — NUNCA borra de verdad: lo mueve a
        // una subcarpeta "Atlas_Trash" dentro de la zona segura, y solo si
        // la ruta cae dentro de SAFE_DELETE_ROOT. Así una orden mal
        // interpretada (por la IA o por ti) sigue siendo reversible.
        else if (action === 'delete_path') {
          const realTarget = resolveSafeDeleteTarget(payload.path);
          if (!realTarget) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: `Ruta fuera de la zona segura (${SAFE_DELETE_ROOT}) o inexistente. No se borró nada.` }));
          } else {
            const trashDir = path.join(SAFE_DELETE_ROOT, 'Atlas_Trash');
            fs.mkdirSync(trashDir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const dest = path.join(trashDir, `${stamp}_${path.basename(realTarget)}`);
            fs.renameSync(realTarget, dest);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: `Movido a la papelera de Atlas: ${dest}`, trashed_to: dest }));
          }
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Acción desconocida' }));
        }
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

// SEGURIDAD: solo localhost. No cambiar a '0.0.0.0' — eso expone el puente
// a cualquier dispositivo de tu red local.
server.listen(PORT, '127.0.0.1', () => {
  console.log('======================================================');
  console.log('  🚀 JARVIS // PUENTE LOCAL NODE.JS ACTIVO');
  console.log('======================================================');
  console.log(`  ● Escuchando en: http://127.0.0.1:${PORT} (solo localhost)`);
  console.log(`  ● Plataforma: ${os.platform()} (${os.arch()})`);
  console.log('  ● Listo para ejecutar comandos reales desde JARVIS');
  if (!process.env.ATLAS_BRIDGE_TOKEN) {
    console.log('======================================================');
    console.log('  ⚠️  No hay ATLAS_BRIDGE_TOKEN en tu entorno. Se generó uno');
    console.log('      temporal para esta sesión. Cópialo a tu .env como:');
    console.log(`      ATLAS_BRIDGE_TOKEN=${BRIDGE_TOKEN}`);
    console.log('      y reinicia server.ts para que puedan hablar entre sí.');
  }
  console.log('======================================================\n');
});
