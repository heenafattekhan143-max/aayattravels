const { contextBridge, ipcRenderer } = require('electron');

// Expose safe system properties and functions to the React frontend
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  nodeVersion: process.versions.node,
  chromeVersion: process.versions.chrome,
  electronVersion: process.versions.electron,
  printWindow: () => window.print() // Fallback to standard print
});
