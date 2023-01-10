const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('electronAPI', {
  onGetAction: (callback) => ipcRenderer.on('get-action', callback)
})
