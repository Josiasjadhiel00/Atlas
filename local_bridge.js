#!/usr/bin/env node
/**
 * JARVIS // PUENTE LOCAL EN NODE.JS PARA CONTROL DE WINDOWS / MAC / LINUX
 * 
 * Para correrlo en tu computadora:
 *   node local_bridge.js
 */

const http = require('http');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        // 5. Comando terminal
        else if (action === 'execute_command') {
          exec(payload.command, { timeout: 15000 }, (err, stdout, stderr) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: !err, stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), error: err ? err.message : null }));
          });
        }
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('======================================================');
  console.log('  🚀 JARVIS // PUENTE LOCAL NODE.JS ACTIVO');
  console.log('======================================================');
  console.log(`  ● Escuchando en: http://localhost:${PORT}`);
  console.log(`  ● Plataforma: ${os.platform()} (${os.arch()})`);
  console.log('  ● Listo para ejecutar comandos reales desde JARVIS');
  console.log('======================================================\n');
});
