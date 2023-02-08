const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld(
  'electronAPI', {
    onGetAction: (callback) => {
      ipcRenderer.on('get-action', (event, arg) => callback(event, arg))
    }
})
