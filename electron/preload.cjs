const { contextBridge, ipcRenderer } = require('electron');

// SEGURIDAD: antes esto exponía "executeCommand", que llamaba a un canal
// IPC que ejecutaba CUALQUIER string como comando de shell
// (execute-system-command → exec(cmdToRun, {shell:true})). Como
// contextBridge.exposeInMainWorld pone esto en el "main world" de la
// página, CUALQUIER script que corriera ahí — un XSS, una dependencia npm
// comprometida, contenido de una web cargada dentro de la app — podía
// llamar a window.jarvisDesktopAPI.executeCommand("lo que sea") y ejecutar
// código arbitrario con los permisos de tu usuario. Sin necesitar el
// puente local, sin red, sin nada. Se eliminó por completo, igual que se
// eliminó "execute_command" del puente HTTP.
contextBridge.exposeInMainWorld('jarvisDesktopAPI', {
  isElectron: true,
  openApp: (appName) => ipcRenderer.invoke('open-system-app', appName),
  openUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  openFolder: (folderPath) => ipcRenderer.invoke('open-system-folder', folderPath),
  createFolder: (name, parentPath) => ipcRenderer.invoke('create-system-folder', name, parentPath),
  setVolume: (level) => ipcRenderer.invoke('set-system-volume', level),
  saveNote: (filename, content) => ipcRenderer.invoke('save-system-note', filename, content),
  getTelemetry: () => ipcRenderer.invoke('get-system-telemetry')
});
