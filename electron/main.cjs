const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

function startBackend() {
  if (backendProcess) return;
  const backendPath = path.join(__dirname, '..', 'backend', 'index.js');
  backendProcess = spawn(process.execPath, [backendPath], {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { NODE_ENV: process.env.NODE_ENV || 'production' })
  });
  backendProcess.on('error', (err) => console.error('Backend process error:', err));
  backendProcess.on('exit', (code) => console.log('Backend exited with code', code));
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (e) { /* ignore */ }
    backendProcess = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  // Start backend first
  startBackend();

  // Give backend a little time to start in production; in dev frontend runs separately
  setTimeout(() => {
    createWindow();
  }, process.env.NODE_ENV === 'development' ? 1000 : 1500);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { stopBackend(); });
