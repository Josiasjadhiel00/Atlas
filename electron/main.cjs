const { app, BrowserWindow, ipcMain, shell, session, systemPreferences } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  const chromeUserAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 650,
    backgroundColor: '#020617',
    frame: true,
    titleBarStyle: 'default',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Emular User-Agent de Chrome estándar para permitir OAuth de Google
  mainWindow.webContents.setUserAgent(chromeUserAgent);

  // Manejador inteligente de ventanas emergentes (Popups de Google / Firebase Auth)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Si es ventana de autenticación de Google o Firebase
    if (
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('/__/auth/') ||
      url.includes('google.com/o/oauth2')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          autoHideMenuBar: true,
          title: 'Iniciar Sesión con Google',
          backgroundColor: '#ffffff',
          webPreferences: {
            contextIsolation: false,
            nodeIntegration: false,
            userAgent: chromeUserAgent
          }
        }
      };
    }

    // Para URLs externas normales, abrir en el navegador predeterminado de Windows
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = 'http://localhost:3000';
  const prodPath = path.join(__dirname, '../dist/index.html');

  if (process.env.NODE_ENV === 'development' || !fs.existsSync(prodPath)) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(prodPath);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Habilitar captura de audio y permisos de medios en Chromium
app.commandLine.appendSwitch('enable-features', 'AudioServiceOutOfProcess');

app.whenReady().then(() => {
  // Conceder permisos de micrófono y medios de forma automática en Electron
  if (session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (['media', 'audio-capture', 'media-devices', 'notifications'].includes(permission)) {
        return callback(true);
      }
      callback(true);
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
      return true;
    });
  }

  // Solicitar acceso a micrófono a nivel de SO si está disponible
  if (process.platform === 'darwin' && systemPreferences && systemPreferences.askForMediaAccess) {
    systemPreferences.askForMediaAccess('microphone').catch(() => {});
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// =======================================================
// CANALES NATIVOS IPC PARA CONTROL TOTAL DE WINDOWS/MAC
// =======================================================

// 1. Ejecutar comando de terminal o acción nativa de Windows
ipcMain.handle('execute-system-command', async (event, command) => {
  return new Promise((resolve) => {
    // Soporte especial en Windows para 'start' de programas
    let cmdToRun = command;
    if (process.platform === 'win32' && !cmdToRun.toLowerCase().startsWith('powershell') && !cmdToRun.toLowerCase().startsWith('cmd')) {
      cmdToRun = `start "" ${command}`;
    }
    exec(cmdToRun, { timeout: 15000, shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash' }, (error, stdout, stderr) => {
      if (error) {
        // En Windows muchos programas abren en background y retornan código 0 o mínimo aviso
        resolve({ success: true, warning: error.message, output: stdout.trim() });
      } else {
        resolve({ success: true, output: stdout.trim() });
      }
    });
  });
});

// 2. Abrir aplicaciones directamente reconocidas
ipcMain.handle('open-system-app', async (event, appName) => {
  const isWin = process.platform === 'win32';
  const name = appName.toLowerCase();
  let cmd = '';

  if (name.includes('code') || name.includes('vs code') || name.includes('visual studio')) {
    cmd = isWin ? 'start code' : 'code';
  } else if (name.includes('chrome') || name.includes('navegador')) {
    cmd = isWin ? 'start chrome' : 'open -a "Google Chrome"';
  } else if (name.includes('notepad') || name.includes('bloc')) {
    cmd = isWin ? 'notepad' : 'open -a TextEdit';
  } else if (name.includes('calc') || name.includes('calculadora')) {
    cmd = isWin ? 'calc' : 'open -a Calculator';
  } else if (name.includes('spotify') || name.includes('musica')) {
    cmd = isWin ? 'start spotify:' : 'open -a Spotify';
  } else if (name.includes('discord')) {
    cmd = isWin ? 'start discord:' : 'open -a Discord';
  } else if (name.includes('cmd') || name.includes('terminal')) {
    cmd = isWin ? 'start cmd' : 'open -a Terminal';
  } else if (name.includes('explorer') || name.includes('archivos') || name.includes('carpeta')) {
    cmd = isWin ? 'explorer .' : 'open .';
  } else {
    cmd = isWin ? `start ${appName}` : `open -a "${appName}"`;
  }

  return new Promise((resolve) => {
    exec(cmd, (err) => {
      resolve({ success: true, message: `Ejecutando ${appName}` });
    });
  });
});

// 3. Abrir URLs en el navegador predeterminado de Windows
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. Abrir carpeta en el explorador de archivos nativo
ipcMain.handle('open-system-folder', async (event, targetPath) => {
  try {
    let resolved = (targetPath || '').replace(/^~/, os.homedir());
    if (resolved === 'Desktop' || !resolved) resolved = path.join(os.homedir(), 'Desktop');
    if (resolved === 'Downloads') resolved = path.join(os.homedir(), 'Downloads');
    if (resolved === 'Documents') resolved = path.join(os.homedir(), 'Documents');

    if (!fs.existsSync(resolved)) {
      fs.mkdirSync(resolved, { recursive: true });
    }
    await shell.openPath(resolved);
    return { success: true, path: resolved };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 5. Crear carpeta física en el disco
ipcMain.handle('create-system-folder', async (event, folderName, parentPath = 'Desktop') => {
  try {
    let base = os.homedir();
    if (parentPath === 'Desktop') base = path.join(os.homedir(), 'Desktop');
    else if (parentPath === 'Downloads') base = path.join(os.homedir(), 'Downloads');
    else if (parentPath === 'Documents') base = path.join(os.homedir(), 'Documents');
    else base = parentPath.replace(/^~/, os.homedir());

    let fullPath = path.join(base, folderName || 'JARVIS_Workspace');
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return { success: true, path: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 6. Control de volumen nativo en Windows
ipcMain.handle('set-system-volume', async (event, level) => {
  if (process.platform === 'win32') {
    // PowerShell simple command to adjust volume via WScript
    const psScript = `$wsh = New-Object -ComObject WScript.Shell; 1..50 | % { $wsh.SendKeys([char]174) }; $steps = [math]::Round(${level} / 2); 1..$steps | % { $wsh.SendKeys([char]175) }`;
    exec(`powershell -c "${psScript}"`);
  }
  return { success: true, volume: level };
});

// 7. Guardar Nota / Archivo de texto real
ipcMain.handle('save-system-note', async (event, filename, content) => {
  try {
    const desktop = path.join(os.homedir(), 'Desktop');
    const safeName = filename.endsWith('.txt') ? filename : `${filename}.txt`;
    const filePath = path.join(desktop, safeName);
    fs.writeFileSync(filePath, content || '', 'utf-8');
    return { success: true, path: filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 8. Obtener información de hardware de la máquina
ipcMain.handle('get-system-telemetry', async () => {
  try {
    const cpus = os.cpus();
    const totalMem = (os.totalmem() / (1024 ** 3)).toFixed(1) + ' GB';
    const freeMem = (os.freemem() / (1024 ** 3)).toFixed(1) + ' GB';
    const usedMemPercent = (((os.totalmem() - os.freemem()) / os.totalmem()) * 100).toFixed(0) + '%';
    
    return {
      success: true,
      platform: os.platform(),
      hostname: os.hostname(),
      cpuModel: cpus[0]?.model || 'Generic Processor',
      cpuCores: cpus.length,
      totalMem,
      freeMem,
      usedMemPercent
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
