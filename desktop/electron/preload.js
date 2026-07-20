const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // If we ever need to communicate with main process, add it here
  sendMessage: (msg) => ipcRenderer.send('message', msg),
});
