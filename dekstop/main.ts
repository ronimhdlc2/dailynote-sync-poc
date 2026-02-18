import dotenv from 'dotenv';
import { app, BrowserWindow, ipcMain, safeStorage, dialog } from 'electron';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { GoogleDriveService } from './services/google-drive.js';
import fs from 'fs';
import fsPromises from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually to handle packaged app
if (app.isPackaged) {
  dotenv.config({ path: path.join(__dirname, '../.env') });
} else {
  dotenv.config();
}

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

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  } else {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  }

  // Intercept Google Auth redirect in production
  win.webContents.on('will-redirect', (event, url) => {
    if (url.startsWith('http://localhost:5173/callback')) {
      event.preventDefault();
      const parsedUrl = new URL(url);
      const code = parsedUrl.searchParams.get('code');
      
      if (code) {
        if (app.isPackaged) {
          win.loadFile(path.join(__dirname, '../renderer/dist/index.html'), {
            search: `code=${code}`
          });
        } else {
          win.loadURL(`http://localhost:5173/callback?code=${code}`);
        }
      }
    }
  });
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

// Encryption handlers
ipcMain.handle('google-auth:encrypt', (event, plainText: string) => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Encryption not available on this platform');
    return plainText;
  }
  const encrypted = safeStorage.encryptString(plainText);
  return encrypted.toString('base64');
});

ipcMain.handle('google-auth:decrypt', (event, encryptedBase64: string) => {
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn('Decryption not available on this platform');
    return encryptedBase64;
  }
  try {
    const buffer = Buffer.from(encryptedBase64, 'base64');
    return safeStorage.decryptString(buffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
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

// --- FILE SYSTEM HANDLERS ---
ipcMain.handle('file-system:select-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('file-system:read-notes', async (event, folderPath: string) => {
  try {
    const files = await fsPromises.readdir(folderPath);
    const txtFiles = files.filter(f => f.endsWith('.txt'));
    
    const notes = [];
    for (const filename of txtFiles) {
      const content = await fsPromises.readFile(path.join(folderPath, filename), 'utf8');
      const lines = content.split('\n');
      const title = lines[0]?.match(/# Title: (.+)/)?.[1];
      const createdAt = lines[1]?.match(/# Created: (.+)/)?.[1];
      const updatedAt = lines[2]?.match(/# Updated: (.+)/)?.[1];
      const noteContent = lines.slice(4).join('\n');
      
      if (title && createdAt && updatedAt) {
        notes.push({
          id: filename.replace('.txt', ''),
          title,
          content: noteContent,
          createdAt,
          updatedAt,
          isSynced: true,
        });
      }
    }
    return notes;
  } catch (error) {
    console.error('Read notes error:', error);
    return [];
  }
});

ipcMain.handle('file-system:write-note', async (event, folderPath: string, note: any) => {
  const filename = `${note.id}.txt`;
  const content = `# Title: ${note.title}\n# Created: ${note.createdAt}\n# Updated: ${note.updatedAt}\n\n${note.content}`;
  await fsPromises.writeFile(path.join(folderPath, filename), content, 'utf8');
  return true;
});

ipcMain.handle('file-system:delete-note', async (event, folderPath: string, noteId: string) => {
  const filename = `${noteId}.txt`;
  const filePath = path.join(folderPath, filename);
  if (fs.existsSync(filePath)) {
    await fsPromises.unlink(filePath);
  }
  return true;
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