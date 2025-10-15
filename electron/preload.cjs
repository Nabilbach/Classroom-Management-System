// Preload script - currently minimal. Expose safe IPC if needed later.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ping: () => ipcRenderer.invoke('ping')
});
