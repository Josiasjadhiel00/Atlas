const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('jarvisDesktopAPI', {
  isElectron: true,
  executeCommand: (cmd) => ipcRenderer.invoke('execute-system-command', cmd),
  openApp: (appName) => ipcRenderer.invoke('open-system-app', appName),
  openUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  openFolder: (folderPath) => ipcRenderer.invoke('open-system-folder', folderPath),
  createFolder: (name, parentPath) => ipcRenderer.invoke('create-system-folder', name, parentPath),
  setVolume: (level) => ipcRenderer.invoke('set-system-volume', level),
  saveNote: (filename, content) => ipcRenderer.invoke('save-system-note', filename, content),
  getTelemetry: () => ipcRenderer.invoke('get-system-telemetry')
});

