import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from 'shared/models/note';
import { getNotesSorted, deleteNote } from 'shared/core/note-engine';

const STORAGE_KEY = 'dailynote-notes';

export const NoteStorage = {
  // Get all notes
  async getNotes(): Promise<Note[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
      const notes = jsonValue != null ? JSON.parse(jsonValue) : [];
      return getNotesSorted(notes);
    } catch (e) {
      console.error('Failed to load notes', e);
      return [];
    }
  },

  // Save a note (create or update)
  async saveNote(note: Note): Promise<void> {
    try {
      // Get raw notes first to avoid double sorting overhead if possible, 
      // but simpler to just get them all.
      const notes = await this.getNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);
      
      let updatedNotes;
      if (existingIndex >= 0) {
        // Update
        updatedNotes = [...notes];
        // Note: note.updatedAt is already updated by the UI logic referencing note-engine
        updatedNotes[existingIndex] = note;
      } else {
        // Create
        updatedNotes = [note, ...notes];
      }
      
      // Sort before saving to keep storage organized (optional but good)
      const sortedNotes = getNotesSorted(updatedNotes);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sortedNotes));
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
      const updatedNotes = deleteNote(notes, id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed to delete note', e);
      throw e;
    }
  }
};
