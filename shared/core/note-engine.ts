/**
 * Core business logic for note operations
 * This is like your "controller" in Express.js - pure logic, no UI
 * 
 * UPDATED: Complete implementation based on PRD requirements
 */

import type { Note } from '../models/note';

// ============================================
// HELPER FUNCTIONS (Private)
// ============================================

function nowISO(): string {
  return new Date().toISOString();
}

function makeIdFromTimestamp(iso: string): string {
  const date = new Date(iso);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Format: YYYY-MM-DD_HH-MM-SS (local time)
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

function makeTitleFromTimestamp(iso: string): string {
  const date = new Date(iso);
  
  // Get local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  // Format: YYYY-MM-DD HH:MM (local time)
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ============================================
// PUBLIC API - CRUD Operations
// ============================================

/**
 * Create a new note with auto-generated ID and title
 */
export function createNote(): Note {
  const iso = nowISO();

  return {
    id: makeIdFromTimestamp(iso),
    title: makeTitleFromTimestamp(iso),
    content: '',
    createdAt: iso,
    updatedAt: iso,
    isSynced: false,
  };
}

/**
 * Update note content (marks as unsynced)
 */
export function updateNoteContent(note: Note, newContent: string): Note {
  return {
    ...note,
    content: newContent,
    updatedAt: nowISO(),
    isSynced: false, // Every edit requires re-sync
  };
}

/**
 * Update note title (user can customize the auto-generated title)
 */
export function updateNoteTitle(note: Note, newTitle: string): Note {
  return {
    ...note,
    title: newTitle,
    updatedAt: nowISO(),
    isSynced: false,
  };
}

/**
 * Delete note from array
 */
export function deleteNote(notes: Note[], noteId: string): Note[] {
  return notes.filter(note => note.id !== noteId);
}

/**
 * Get single note by ID
 */
export function getNoteById(notes: Note[], noteId: string): Note | undefined {
  return notes.find(note => note.id === noteId);
}

/**
 * Get notes sorted by date (newest first - chronological)
 * PRD requirement: "Chronological order (terbaru atas)"
 */
export function getNotesSorted(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

// ============================================
// SYNC & FILE OPERATIONS
// ============================================

/**
 * Mark note as synced (called after successful Google Drive upload)
 */
export function markAsSynced(note: Note, driveFileId?: string): Note {
  return {
    ...note,
    isSynced: true,
    driveFileId: driveFileId || note.driveFileId,
  };
}

/**
 * Get filename for this note (for saving as .txt)
 */
export function getNoteFilename(note: Note): string {
  return `${note.id}.txt`;
}

/**
 * Format note sebagai TXT content (sesuai PRD format)
 * 
 * Format:
 * # Title: 2026-01-25 07:52:34 (edited: My Morning Journal)
 * # Created: 2026-01-25T07:52:34Z
 * # Updated: 2026-01-25T08:15:22Z
 * 
 * [Content here...]
 */
export function formatNoteAsTxt(note: Note): string {
  const titleLine = `# Title: ${note.title}`;
  const createdLine = `# Created: ${note.createdAt}`;
  const updatedLine = `# Updated: ${note.updatedAt}`;
  
  return `${titleLine}\n${createdLine}\n${updatedLine}\n\n${note.content}`;
}

/**
 * Parse TXT content kembali jadi Note object
 * Untuk reading dari Google Drive
 */
export function parseNoteFromTxt(filename: string, content: string): Note | null {
  try {
    const lines = content.split('\n');
    
    // More flexible parsing
    let title = '';
    let createdAt = '';
    let updatedAt = '';
    let contentStartIndex = 0;
    
    // Parse metadata lines
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# Title:')) {
        title = line.replace('# Title:', '').trim();
      } else if (line.startsWith('# Created:')) {
        createdAt = line.replace('# Created:', '').trim();
      } else if (line.startsWith('# Updated:')) {
        updatedAt = line.replace('# Updated:', '').trim();
        contentStartIndex = i + 2; // Skip empty line after metadata
        break;
      }
    }
    
    // Validate required fields
    if (!title || !createdAt || !updatedAt) {
      console.error('Invalid TXT format - missing metadata:', { title, createdAt, updatedAt });
      return null;
    }
    
    // Extract content
    const noteContent = lines.slice(contentStartIndex).join('\n').trim();
    const id = filename.replace('.txt', '');
    
    return {
      id,
      title,
      content: noteContent,
      createdAt,
      updatedAt,
      isSynced: true,
    };
  } catch (error) {
    console.error('Parse error for file:', filename, error);
    return null;
  }
}

// ============================================
// CONFLICT RESOLUTION (PRD requirement)
// ============================================

/**
 * Resolve conflict antara local vs remote (Drive)
 * PRD: "Latest timestamp wins"
 */
export function resolveConflict(localNote: Note, remoteNote: Note): Note {
  const localTime = new Date(localNote.updatedAt).getTime();
  const remoteTime = new Date(remoteNote.updatedAt).getTime();
  
  // Latest timestamp wins
  return localTime > remoteTime ? localNote : remoteNote;
}

/**
 * Merge notes dari berbagai sumber (local + remote)
 * PRD: "Download & merge semua TXT files"
 */
export function mergeNotes(localNotes: Note[], remoteNotes: Note[]): Note[] {
  const merged = new Map<string, Note>();
  
  // Add all local notes
  localNotes.forEach(note => merged.set(note.id, note));
  
  // Merge with remote (resolve conflicts)
  remoteNotes.forEach(remoteNote => {
    const localNote = merged.get(remoteNote.id);
    if (localNote) {
      // Conflict detected - resolve by timestamp
      merged.set(remoteNote.id, resolveConflict(localNote, remoteNote));
    } else {
      // New note from remote
      merged.set(remoteNote.id, remoteNote);
    }
  });
  
  return Array.from(merged.values());
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if note has unsaved changes
 */
export function hasUnsavedChanges(note: Note): boolean {
  return !note.isSynced;
}

/**
 * Get unsaved notes count
 */
export function getUnsavedNotesCount(notes: Note[]): number {
  return notes.filter(note => !note.isSynced).length;
}

/**
 * Validate note before saving
 */
export function validateNote(note: Note): { valid: boolean; error?: string } {
  if (!note.content.trim()) {
    return { valid: false, error: 'Note content cannot be empty' };
  }
  
  if (!note.title.trim()) {
    return { valid: false, error: 'Note title cannot be empty' };
  }
  
  return { valid: true };
}

/**
 * Get note preview (first 150 chars, no markdown)
 */
export function getNotePreview(note: Note): string {
  if (!note.content) return '';
  
  // Remove markdown characters
  const plain = note.content
    .replace(/[*_~`#]/g, "")
    .replace(/\n+/g, " ")
    .trim();
    
  return plain.length > 150 ? plain.substring(0, 150) + "..." : plain;
}

/**
 * Format date for display (Today, Yesterday, or Date)
 */
export function formatNoteDate(isoString: string): string {
  const date = new Date(isoString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return `Today, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  } else if (date.toDateString() === yesterday.toDateString()) {
    return `Yesterday, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}