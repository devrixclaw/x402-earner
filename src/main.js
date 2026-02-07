const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const { createWorkspace } = require('./workspace');

createWorkspace();

app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { nodeIntegration: true, contextIsolation: false } });
  win.loadFile('index.html');
});
