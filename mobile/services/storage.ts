import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from 'shared/models/note';

const STORAGE_KEY = 'dailynote-notes';

export const NoteStorage = {
  // Get all notes
  async getNotes(): Promise<Note[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      console.error('Failed to load notes', e);
      return [];
    }
  },

  // Save a note (create or update)
  async saveNote(note: Note): Promise<void> {
    try {
      const notes = await this.getNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      let updatedNotes;
      if (existingIndex >= 0) {
        // Update
        updatedNotes = [...notes];
        updatedNotes[existingIndex] = { ...note, updatedAt: new Date().toISOString() };
      } else {
        // Create
        updatedNotes = [note, ...notes];
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to save note', e);
      throw e;
    }
  },

  // Get single note by ID
  async getNote(id: string): Promise<Note | undefined> {
    const notes = await this.getNotes();
    return notes.find(n => n.id === id);
  },

  // Delete note
  async deleteNote(id: string): Promise<void> {
    try {
      const notes = await this.getNotes();
      const updatedNotes = notes.filter(n => n.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to delete note', e);
      throw e;
    }
  }
};
