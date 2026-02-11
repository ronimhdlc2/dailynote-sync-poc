import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  googleAuth: {
    getAuthUrl: () => ipcRenderer.invoke('google-auth:get-url'),
    exchangeCode: (code: string) => ipcRenderer.invoke('google-auth:exchange-code', code),
    getUserInfo: () => ipcRenderer.invoke('google-auth:get-user'),
    setCredentials: (tokens: any) => ipcRenderer.invoke('google-auth:set-credentials', tokens),
  },
  googleDrive: {
    init: () => ipcRenderer.invoke('google-drive:init'),
    ensureFolder: (userEmail: string) => ipcRenderer.invoke('google-drive:ensure-folder', userEmail),
    uploadNote: (note: any, folderId: string) => ipcRenderer.invoke('google-drive:upload-note', note, folderId),
    downloadNotes: (folderId: string) => ipcRenderer.invoke('google-drive:download-notes', folderId),
    deleteNote: (driveFileId: string) => ipcRenderer.invoke('google-drive:delete-note', driveFileId),
  },
});