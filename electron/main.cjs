const { app, BrowserWindow, ipcMain, shell, session, systemPreferences } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');

// SEGURIDAD: solo estas tres carpetas pueden usarse como base para crear
// carpetas, guardar notas o abrir rutas desde los canales IPC de abajo. La
// versión anterior aceptaba CUALQUIER "parentPath"/"targetPath" tal cual
// llegara, así que un script en la página podía pedir escribir en
// cualquier parte del disco al que tuviera permiso tu usuario.
const SAFE_BASE_DIRS = {
  Desktop: path.join(os.homedir(), 'Desktop'),
  Downloads: path.join(os.homedir(), 'Downloads'),
  Documents: path.join(os.homedir(), 'Documents')
};

function resolveWithinBase(base, rawName) {
  const safeName = String(rawName || '');
  const candidate = path.resolve(base, safeName);
  if (candidate !== base && !candidate.startsWith(base + path.sep)) return null;
  return candidate;
}

// SEGURIDAD: lista blanca de apps conocidas, lanzadas con spawn() sin
// shell — nunca con exec() de un string armado con el nombre que llegue.
const APP_LAUNCHERS = {
  win32: {
    code: ['cmd.exe', ['/c', 'start', 'code']],
    chrome: ['cmd.exe', ['/c', 'start', 'chrome']],
    notepad: ['notepad.exe', []],
    calc: ['calc.exe', []],
    spotify: ['cmd.exe', ['/c', 'start', 'spotify:']],
    discord: ['cmd.exe', ['/c', 'start', 'discord:']],
    cmd: ['cmd.exe', ['/c', 'start', 'cmd']],
    explorer: ['explorer.exe', ['.']]
  },
  darwin: {
    code: ['open', ['-a', 'Visual Studio Code']],
    chrome: ['open', ['-a', 'Google Chrome']],
    notepad: ['open', ['-a', 'TextEdit']],
    calc: ['open', ['-a', 'Calculator']],
    spotify: ['open', ['-a', 'Spotify']],
    discord: ['open', ['-a', 'Discord']],
    cmd: ['open', ['-a', 'Terminal']],
    explorer: ['open', ['.']]
  },
  linux: {
    code: ['code', []],
    chrome: ['google-chrome', []],
    notepad: ['gedit', []],
    calc: ['gnome-calculator', []],
    spotify: ['spotify', []],
    discord: ['discord', []],
    cmd: ['x-terminal-emulator', []],
    explorer: ['xdg-open', ['.']]
  }
};

function resolveAppKey(rawName) {
  const n = String(rawName || '').toLowerCase();
  if (n.includes('code') || n.includes('vs code') || n.includes('visual studio')) return 'code';
  if (n.includes('chrome') || n.includes('navegador')) return 'chrome';
  if (n.includes('notepad') || n.includes('bloc')) return 'notepad';
  if (n.includes('calc') || n.includes('calculadora')) return 'calc';
  if (n.includes('spotify') || n.includes('musica')) return 'spotify';
  if (n.includes('discord')) return 'discord';
  if (n.includes('cmd') || n.includes('terminal')) return 'cmd';
  if (n.includes('explorer') || n.includes('archivos') || n.includes('carpeta')) return 'explorer';
  return null;
}

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
            // SEGURIDAD: no hay razón para desactivar contextIsolation en
            // una ventana que solo carga accounts.google.com/firebaseapp.com
            // — nodeIntegration ya estaba en false, pero apagar
            // contextIsolation también es una práctica insegura sin
            // beneficio real aquí.
            contextIsolation: true,
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
    // SEGURIDAD: antes se aprobaba CUALQUIER permiso pedido (la rama
    // "else" también hacía callback(true)) — incluida cámara, geolocalización,
    // acceso al portapapeles, etc., sin preguntar nunca. Ahora solo se
    // aprueban automáticamente los permisos de audio que Atlas
    // legítimamente necesita para escucharte; todo lo demás se rechaza.
    const AUTO_APPROVED_PERMISSIONS = ['media', 'audio-capture', 'media-devices', 'notifications'];
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      callback(AUTO_APPROVED_PERMISSIONS.includes(permission));
    });

    session.defaultSession.setPermissionCheckHandler((webContents, permission) => {
      return AUTO_APPROVED_PERMISSIONS.includes(permission);
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
// CANALES NATIVOS IPC — contextBridge los expone en el "main world" de la
// página (ver preload.cjs), así que hay que tratar TODO lo que llega aquí
// como si viniera de código no confiable, no solo de la UI de Atlas.
// =======================================================

// 1. NOTA DE SEGURIDAD: aquí vivía "execute-system-command", que corría
// cualquier string como comando de shell. Se eliminó por completo — era
// la falla más grave de todo el proyecto: cualquier script en la página
// (un XSS, una dependencia comprometida) podía ejecutar código arbitrario
// con tus permisos de usuario, sin necesitar el puente local ni red.

// 2. Abrir aplicaciones — solo desde la lista blanca APP_LAUNCHERS,
// lanzada con spawn() sin shell (ver definición arriba).
ipcMain.handle('open-system-app', async (event, appName) => {
  const key = resolveAppKey(appName);
  const table = APP_LAUNCHERS[process.platform] || APP_LAUNCHERS.linux;
  const launcher = key ? table[key] : null;

  if (!launcher) {
    return { success: false, error: `No conozco la app "${appName}". Añádela a APP_LAUNCHERS en electron/main.cjs para abrirla de forma segura.` };
  }

  const [cmd, args] = launcher;
  return new Promise((resolve) => {
    try {
      const child = spawn(cmd, args, { shell: false, detached: true, stdio: 'ignore' });
      child.on('error', (err) => resolve({ success: false, error: err.message }));
      child.unref();
      resolve({ success: true, message: `Ejecutando ${key}` });
    } catch (err) {
      resolve({ success: false, error: err.message });
    }
  });
});

// 3. Abrir URLs en el navegador predeterminado — solo http(s).
ipcMain.handle('open-external-url', async (event, url) => {
  try {
    const parsed = new URL(String(url || ''));
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { success: false, error: 'Solo se permiten URLs http:// o https://' };
    }
    await shell.openExternal(parsed.toString());
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 4. Abrir carpeta en el explorador — SEGURIDAD: antes aceptaba
// cualquier "targetPath" tal cual y creaba directorios nuevos en
// cualquier parte del disco si no existían. Ahora solo abre rutas
// existentes dentro de Desktop/Downloads/Documents.
ipcMain.handle('open-system-folder', async (event, targetPath) => {
  try {
    const key = ['Desktop', 'Downloads', 'Documents'].includes(targetPath) ? targetPath : 'Desktop';
    const base = SAFE_BASE_DIRS[key];
    const resolved = targetPath && !['Desktop', 'Downloads', 'Documents', ''].includes(targetPath)
      ? resolveWithinBase(base, targetPath)
      : base;

    if (!resolved) {
      return { success: false, error: 'Ruta fuera de la zona segura (Desktop/Downloads/Documents).' };
    }
    if (!fs.existsSync(resolved)) {
      return { success: false, error: `No existe: ${resolved}` };
    }
    await shell.openPath(resolved);
    return { success: true, path: resolved };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 5. Crear carpeta física — SEGURIDAD: antes "parentPath" podía ser
// literalmente cualquier ruta del sistema. Ahora solo se puede crear
// dentro de Desktop/Downloads/Documents, y el nombre no puede escaparse
// con "../".
ipcMain.handle('create-system-folder', async (event, folderName, parentPath = 'Desktop') => {
  try {
    const key = ['Desktop', 'Downloads', 'Documents'].includes(parentPath) ? parentPath : 'Desktop';
    const base = SAFE_BASE_DIRS[key];
    const fullPath = resolveWithinBase(base, folderName || 'JARVIS_Workspace');

    if (!fullPath) {
      return { success: false, error: 'Nombre de carpeta inválido (se sale de la zona segura).' };
    }
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    return { success: true, path: fullPath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// 6. Control de volumen — SEGURIDAD: "level" se metía directo en un
// script de PowerShell armado como string. Se valida y se fuerza a un
// entero 0-100 antes de tocar cualquier comando.
ipcMain.handle('set-system-volume', async (event, level) => {
  const parsed = Number(level);
  const safeLevel = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 50;

  if (process.platform === 'win32') {
    const steps = Math.round(safeLevel / 2);
    const psScript = `$wsh = New-Object -ComObject WScript.Shell; 1..50 | % { $wsh.SendKeys([char]174) }; 1..${steps} | % { $wsh.SendKeys([char]175) }`;
    execFile('powershell.exe', ['-NoProfile', '-Command', psScript], () => {});
  }
  return { success: true, volume: safeLevel };
});

// 7. Guardar nota — SEGURIDAD: "filename" no se validaba contra rutas
// tipo "../../" para escaparse del Escritorio.
ipcMain.handle('save-system-note', async (event, filename, content) => {
  try {
    const desktop = SAFE_BASE_DIRS.Desktop;
    const rawName = String(filename || 'nota');
    const safeName = rawName.endsWith('.txt') ? rawName : `${rawName}.txt`;
    const filePath = resolveWithinBase(desktop, safeName);
    if (!filePath) {
      return { success: false, error: 'Nombre de archivo inválido (se sale del Escritorio).' };
    }
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
