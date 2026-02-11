import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleDriveService } from './services/google-drive.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || '';
const CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:5173/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadURL('http://localhost:5173');
  win.webContents.openDevTools();
}

// IPC Handlers untuk Google Auth
ipcMain.handle('google-auth:get-url', () => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file', 'profile', 'email'],
  });
});

ipcMain.handle('google-auth:exchange-code', async (event, code: string) => {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
});

ipcMain.handle('google-auth:get-user', async () => {
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();
  return data;
});

ipcMain.handle('google-auth:set-credentials', async (event, tokens: any) => {
  oauth2Client.setCredentials(tokens);
});

let driveService: GoogleDriveService | null = null;

ipcMain.handle('google-drive:init', async () => {
  driveService = new GoogleDriveService(oauth2Client);
  return { success: true };
});

ipcMain.handle('google-drive:ensure-folder', async (event, userEmail: string) => {
  if (!driveService) throw new Error('Drive service not initialized');
  return await driveService.ensureUserFolder(userEmail);
});

ipcMain.handle('google-drive:upload-note', async (event, note: any, folderId: string) => {
  if (!driveService) throw new Error('Drive service not initialized');
  return await driveService.uploadNote(note, folderId);
});

ipcMain.handle('google-drive:download-notes', async (event, folderId: string) => {
  if (!driveService) throw new Error('Drive service not initialized');
  return await driveService.downloadAllNotes(folderId);
});

ipcMain.handle('google-drive:delete-note', async (event, driveFileId: string) => {
  if (!driveService) throw new Error('Drive service not initialized');
  return await driveService.deleteNote(driveFileId);
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});