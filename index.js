const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { setupTitlebar, attachTitlebarToWindow } = require("custom-electron-titlebar/main");
// require('electron-reload')(__dirname);

setupTitlebar();

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    icon: "./icon.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
      devTools: false
    }
  });
  mainWindow.loadFile('index.html');

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