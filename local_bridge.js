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

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
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

        // 1. Abrir aplicación
        if (action === 'open_app' || action === 'open_program') {
          const appName = (payload.name || '').toLowerCase();
          let cmd = payload.name;
          if (appName.includes('code') || appName.includes('vs code') || appName.includes('visual studio')) {
            cmd = 'code';
          } else if (appName.includes('chrome')) {
            cmd = process.platform === 'win32' ? 'start chrome' : 'open -a "Google Chrome"';
          } else if (appName.includes('spotify')) {
            cmd = process.platform === 'win32' ? 'start spotify' : 'open -a Spotify';
          } else if (appName.includes('notepad') || appName.includes('notas')) {
            cmd = 'notepad.exe';
          } else if (appName.includes('calc')) {
            cmd = process.platform === 'win32' ? 'calc.exe' : 'open -a Calculator';
          }

          exec(cmd, { shell: true }, (err) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, message: `Aplicación ejecutada: ${cmd}`, error: err ? err.message : null }));
          });
        }
        // 2. Crear carpeta en escritorio
        else if (action === 'create_folder') {
          const folderName = payload.name || 'Nueva_Carpeta_JARVIS';
          const desktop = path.join(os.homedir(), 'Desktop');
          const target = path.join(desktop, folderName);
          fs.mkdirSync(target, { recursive: true });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, path: target, message: `Carpeta ${folderName} creada en Escritorio` }));
        }
        // 3. Abrir carpeta en explorador
        else if (action === 'open_folder') {
          const raw = payload.path || '~/Desktop';
          const target = raw.replace(/^~/, os.homedir());
          fs.mkdirSync(target, { recursive: true });
          const cmd = process.platform === 'win32' ? `explorer "${target}"` : process.platform === 'darwin' ? `open "${target}"` : `xdg-open "${target}"`;
          exec(cmd, (err) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, path: target }));
          });
        }
        // 4. Abrir URL
        else if (action === 'open_url') {
          const url = payload.url || 'https://google.com';
          const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
          exec(cmd, () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, url }));
          });
        }
        // 5. NOTA DE SEGURIDAD: se eliminó "execute_command" (ejecutaba
        // cualquier comando de shell recibido por HTTP, sin restricción de
        // qué se podía correr). Con el token ya activo el riesgo baja
        // mucho, pero un comando de shell arbitrario sigue siendo demasiado
        // poder para un endpoint HTTP. Si en el futuro lo necesitas, usa una
        // lista blanca de comandos permitidos en vez de aceptar cualquier
        // string.

        // 6. Apagado
        else if (action === 'shutdown_pc') {
          if (process.platform === 'win32') exec('shutdown /s /t 60');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Apagado programado en 60s' }));
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
