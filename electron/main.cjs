const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

function startBackend() {
  if (backendProcess) return;
  
  const backendPath = path.join(__dirname, '..', 'backend', 'index.js');
  const isDev = process.env.NODE_ENV === 'development';
  
  console.log('Starting backend server...');
  console.log('Backend path:', backendPath);
  console.log('Mode:', isDev ? 'development' : 'production');
  
  backendProcess = spawn('node', [backendPath], {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', 'backend'),
    env: Object.assign({}, process.env, { 
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: '3000'
    })
  });
  
  backendProcess.on('error', (err) => {
    console.error('Backend process error:', err);
  });
  
  backendProcess.on('exit', (code) => {
    console.log('Backend exited with code', code);
    backendProcess = null;
  });
  
  console.log('Backend process started with PID:', backendProcess.pid);
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try { backendProcess.kill(); } catch (e) { /* ignore */ }
    backendProcess = null;
  }
}

function createMenu() {
  const template = [
    {
      label: 'ملف',
      submenu: [
        {
          label: 'إعادة تحميل',
          accelerator: 'CmdOrCtrl+R',
          click: () => { if (mainWindow) mainWindow.reload(); }
        },
        { type: 'separator' },
        {
          label: 'خروج',
          accelerator: 'CmdOrCtrl+Q',
          click: () => { app.quit(); }
        }
      ]
    },
    {
      label: 'عرض',
      submenu: [
        {
          label: 'تكبير',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => { 
            if (mainWindow) {
              const zoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(zoom + 0.5);
            }
          }
        },
        {
          label: 'تصغير',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            if (mainWindow) {
              const zoom = mainWindow.webContents.getZoomLevel();
              mainWindow.webContents.setZoomLevel(zoom - 0.5);
            }
          }
        },
        {
          label: 'حجم افتراضي',
          accelerator: 'CmdOrCtrl+0',
          click: () => { if (mainWindow) mainWindow.webContents.setZoomLevel(0); }
        },
        { type: 'separator' },
        {
          label: 'تبديل شاشة كاملة',
          accelerator: 'F11',
          click: () => { 
            if (mainWindow) mainWindow.setFullScreen(!mainWindow.isFullScreen()); 
          }
        }
      ]
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: 'حول التطبيق',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'نظام إدارة الفصول الدراسية',
              message: 'Classroom Management System',
              detail: 'الإصدار 2.1.0\n\nنظام شامل لإدارة الحضور والتقييم والمناهج الدراسية\n\n© 2025 Nabil Bach',
              buttons: ['موافق']
            });
          }
        }
      ]
    }
  ];

  // Add DevTools in development
  if (process.env.NODE_ENV === 'development') {
    template[1].submenu.push(
      { type: 'separator' },
      {
        label: 'فتح أدوات المطور',
        accelerator: 'CmdOrCtrl+Shift+I',
        click: () => { if (mainWindow) mainWindow.webContents.toggleDevTools(); }
      }
    );
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'نظام إدارة الفصول الدراسية',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true
    },
    show: false // Don't show until ready
  });

  // Show window when ready to avoid flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
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
  // Create application menu
  createMenu();
  
  // Start backend first
  startBackend();

  // Give backend time to start (3 seconds for dev, 2 for prod)
  const waitTime = process.env.NODE_ENV === 'development' ? 3000 : 2000;
  console.log(`Waiting ${waitTime}ms for backend to start...`);
  
  setTimeout(() => {
    createWindow();
  }, waitTime);

  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  stopBackend();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { stopBackend(); });
