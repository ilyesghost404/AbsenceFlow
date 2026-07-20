const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;
let qrPortalWindow;

const isDev = !app.isPackaged;

// Disable hardware acceleration on Linux to fix VAAPI/GPU errors (nouveau_drv_video.so)
// Do this for both dev and production to prevent crashes without --disable-gpu
if (process.platform === 'linux' || isDev) {
  app.disableHardwareAcceleration();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Allow media permissions for the camera
      media: true,
    },
    autoHideMenuBar: true, // Clean interface
  });

  // Intercept window.open calls natively
  mainWindow.webContents.setWindowOpenHandler((details) => {
    // If the URL includes the QR portal route, open a dedicated window
    if (details.url.includes('/attendance-verification')) {
      if (qrPortalWindow && !qrPortalWindow.isDestroyed()) {
        qrPortalWindow.focus();
        return { action: 'deny' };
      }

      qrPortalWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        minWidth: 800,
        minHeight: 600,
        parent: mainWindow,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          media: true, // Needs camera
        }
      });

      // Stop camera when window is closed
      qrPortalWindow.on('closed', () => {
        qrPortalWindow = null;
      });

      qrPortalWindow.loadURL(details.url);

      return { action: 'deny' };
    }
    
    // For normal external links (like external docs), open in default browser
    if (details.url.startsWith('http') && !details.url.includes('localhost:5174')) {
      shell.openExternal(details.url);
      return { action: 'deny' };
    }

    return { action: 'allow' };
  });

  const startUrl = isDev 
    ? 'http://localhost:5174' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    // Optionally open dev tools
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  // Enforce camera access globally just in case
  app.commandLine.appendSwitch('use-fake-ui-for-media-stream');

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});
