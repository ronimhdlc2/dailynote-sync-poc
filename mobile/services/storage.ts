import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from 'shared/models/note';
import { getNotesSorted, deleteNote as deleteNoteLogic } from 'shared/core/note-engine';

const FOLDER_PATH_KEY = 'dailynote-local-folder';

export const NoteStorage = {
  // Get or set the local storage folder path
  async getStoragePath(): Promise<string | null> {
    return await AsyncStorage.getItem(FOLDER_PATH_KEY);
  },

  async setStoragePath(path: string): Promise<void> {
    await AsyncStorage.setItem(FOLDER_PATH_KEY, path);
  },

  // Helper to get full path for a note
  async getNotePath(noteId: string): Promise<string | null> {
    const root = await this.getStoragePath();
    if (!root) return null;
    return `${root}/${noteId}.txt`;
  },

  // Get all notes from file system
  async getNotes(): Promise<Note[]> {
    const root = await this.getStoragePath();
    if (!root) return [];

    try {
      let files: string[] = [];
      const isSAF = root.startsWith('content://');

      if (isSAF) {
        files = await FileSystem.StorageAccessFramework.readDirectoryAsync(root);
      } else {
        files = await FileSystem.readDirectoryAsync(root);
      }

      const txtFiles = files.filter(f => f.endsWith('.txt') || f.includes('.txt'));
      
      const notes: Note[] = [];
      for (const fileUriOrName of txtFiles) {
        // Jika SAF, fileUriOrName adalah full URI. Jika biasa, hanya nama file.
        const fullUri = isSAF ? fileUriOrName : `${root}/${fileUriOrName}`;
        const filename = isSAF ? decodeURIComponent(fileUriOrName).split('/').pop() || '' : fileUriOrName;
        
        if (!filename.endsWith('.txt')) continue;

        const content = await FileSystem.readAsStringAsync(fullUri);
        const lines = content.split('\n');
        
        const title = lines[0]?.match(/# Title: (.+)/)?.[1] || 'Untitled';
        const createdAt = lines[1]?.match(/# Created: (.+)/)?.[1] || new Date().toISOString();
        const updatedAt = lines[2]?.match(/# Updated: (.+)/)?.[1] || new Date().toISOString();
        const noteContent = lines.slice(4).join('\n');

        notes.push({
          id: filename.replace('.txt', ''),
          title,
          content: noteContent,
          createdAt,
          updatedAt,
          isSynced: true,
        });
      }
      return getNotesSorted(notes);
    } catch (e) {
      console.error('Failed to read notes from FS', e);
      return [];
    }
  },

  // Save a note to file system (Supports SAF)
  async saveNote(note: Note): Promise<void> {
    const root = await this.getStoragePath();
    if (!root) throw new Error('Storage folder not configured');

    const isSAF = root.startsWith('content://');
    const filename = `${note.id}.txt`;
    const content = `# Title: ${note.title}\n# Created: ${note.createdAt}\n# Updated: ${note.updatedAt}\n\n${note.content}`;

    try {
      if (isSAF) {
        // SAF Logic: Cari file dulu, jika tidak ada baru buat
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(root);
        let existingUri = files.find(f => f.includes(encodeURIComponent(filename)) || f.endsWith(filename));

        if (!existingUri) {
          existingUri = await FileSystem.StorageAccessFramework.createFileAsync(root, filename, 'text/plain');
        }
        await FileSystem.writeAsStringAsync(existingUri, content);
      } else {
        const path = `${root}/${filename}`;
        await FileSystem.writeAsStringAsync(path, content);
      }
    } catch (e) {
      console.error('Failed to save note to FS', e);
      throw e;
    }
  },

  // Delete note from file system
  async deleteNote(id: string): Promise<void> {
    const root = await this.getStoragePath();
    if (!root) return;

    const isSAF = root.startsWith('content://');
    const filename = `${id}.txt`;

    try {
      if (isSAF) {
        const files = await FileSystem.StorageAccessFramework.readDirectoryAsync(root);
        const existingUri = files.find(f => f.includes(encodeURIComponent(filename)) || f.endsWith(filename));
        if (existingUri) {
          await FileSystem.StorageAccessFramework.deleteAsync(existingUri);
        }
      } else {
        const path = `${root}/${filename}`;
        const info = await FileSystem.getInfoAsync(path);
        if (info.exists) {
          await FileSystem.deleteAsync(path);
        }
      }
    } catch (e) {
      console.error('Failed to delete note from FS', e);
      throw e;
    }
  },

  // Get single note by ID
  async getNote(id: string): Promise<Note | undefined> {
    const notes = await this.getNotes();
    return notes.find(n => n.id === id);
  }
};
