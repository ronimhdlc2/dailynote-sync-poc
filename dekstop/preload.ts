import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  googleAuth: {
    getAuthUrl: () => ipcRenderer.invoke('google-auth:get-url'),
    exchangeCode: (code: string) => ipcRenderer.invoke('google-auth:exchange-code', code),
    getUserInfo: () => ipcRenderer.invoke('google-auth:get-user'),
    setCredentials: (tokens: any) => ipcRenderer.invoke('google-auth:set-credentials', tokens),
    encrypt: (text: string) => ipcRenderer.invoke('google-auth:encrypt', text),
    decrypt: (encrypted: string) => ipcRenderer.invoke('google-auth:decrypt', encrypted),
  },
  googleDrive: {
    init: () => ipcRenderer.invoke('google-drive:init'),
    ensureFolder: (userEmail: string) => ipcRenderer.invoke('google-drive:ensure-folder', userEmail),
    uploadNote: (note: any, folderId: string) => ipcRenderer.invoke('google-drive:upload-note', note, folderId),
    downloadNotes: (folderId: string) => ipcRenderer.invoke('google-drive:download-notes', folderId),
    deleteNote: (driveFileId: string) => ipcRenderer.invoke('google-drive:delete-note', driveFileId),
  },
  fileSystem: {
    selectFolder: () => ipcRenderer.invoke('file-system:select-folder'),
    readNotes: (folderPath: string) => ipcRenderer.invoke('file-system:read-notes', folderPath),
    writeNote: (folderPath: string, note: any) => ipcRenderer.invoke('file-system:write-note', folderPath, note),
    deleteNote: (folderPath: string, noteId: string) => ipcRenderer.invoke('file-system:delete-note', folderPath, noteId),
  }
});