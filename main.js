const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

// Determine if we are in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function startBackend() {
  const isWindows = process.platform === 'win32';
  
  // Find python executable path inside backend virtual environment
  let pythonPath;
  if (isWindows) {
    pythonPath = path.join(__dirname, 'backend', '.venv', 'Scripts', 'python.exe');
  } else {
    pythonPath = path.join(__dirname, 'backend', '.venv', 'bin', 'python3');
  }

  console.log(`Starting backend server at: ${pythonPath}`);

  // Spawn Python FastAPI uvicorn server
  backendProcess = spawn(pythonPath, [
    '-m', 'uvicorn',
    'backend.main:app',
    '--host', '127.0.0.1',
    '--port', '8000'
  ], {
    cwd: __dirname,
    env: { 
      ...process.env,
      PYTHONPATH: __dirname
    }
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[FastAPI stdout]: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[FastAPI stderr]: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`FastAPI backend exited with code ${code}`);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: "Purvi Travels - Travel/Billing Management System"
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Start backend FastAPI server
  startBackend();
  
  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Clean up processes on exit
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    console.log('Killing FastAPI backend process...');
    backendProcess.kill('SIGTERM');
  }
});
