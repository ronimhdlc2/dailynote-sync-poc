import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  googleAuth: {
    getAuthUrl: () => ipcRenderer.invoke('google-auth:get-url'),
    exchangeCode: (code: string) => ipcRenderer.invoke('google-auth:exchange-code', code),
    getUserInfo: () => ipcRenderer.invoke('google-auth:get-user'),
    setCredentials: (tokens: any) => ipcRenderer.invoke('google-auth:set-credentials', tokens),
  }
});