const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { setupTitlebar, attachTitlebarToWindow } = require("custom-electron-titlebar/main");
// require('electron-reload')(__dirname);
const { autoUpdater } = require('electron-updater');

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

setupTitlebar();

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    icon: "./src/icon.png",
    webPreferences: {
      preload: path.join(__dirname, 'src/preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      devTools: false
    }
  });
  mainWindow.loadFile('src/index.html');

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  mainWindow.webContents.on('did-finish-load', () => { mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => { callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ['default-src \'self\' \'unsafe-inline\' data: https://*'], } }); }); });

  attachTitlebarToWindow(mainWindow);
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});