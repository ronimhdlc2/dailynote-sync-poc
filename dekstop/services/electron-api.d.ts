// dekstop/services/electron-api.d.ts
// Type declarations untuk Electron IPC API

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  driveFileId?: string;
}

declare global {
  interface Window {
    electronAPI: {
      googleAuth: {
        getAuthUrl: () => Promise<string>;
        exchangeCode: (code: string) => Promise<any>;
        getUserInfo: () => Promise<any>;
        setCredentials: (tokens: any) => Promise<void>;
      };
      googleDrive: {
        init: () => Promise<{ success: boolean }>;
        ensureFolder: (userEmail: string) => Promise<string>;
        uploadNote: (note: Note, folderId: string) => Promise<string>;
        downloadNotes: (folderId: string) => Promise<Note[]>;
        deleteNote: (driveFileId: string) => Promise<void>;
      };
    };
  }
}

export {};