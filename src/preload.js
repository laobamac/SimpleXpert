const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    windowControl: (action) => ipcRenderer.send('window-control', action),
    navigateTo: (page) => ipcRenderer.send('navigate-to', page),
    onNavigate: (callback) => ipcRenderer.on('navigate-to', callback),
    getDmgList: () => ipcRenderer.invoke('get-dmg-list'),
    copyToClipboard: (text) => ipcRenderer.invoke('copy-to-clipboard', text),
    generateSignedUrl: (url) => ipcRenderer.invoke('generate-signed-url', url)
});