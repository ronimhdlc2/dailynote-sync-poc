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
  // Example: 2026-01-27T05:41:12.332Z → 2026-01-27_05-41-12
  return iso
    .replace('T', '_')
    .replace(/[:.]/g, '-')
    .replace('Z', '')
    .split('.')[0]; // Remove milliseconds
}

function makeTitleFromTimestamp(iso: string): string {
  // Example: 2026-01-27T05:41:12.332Z → 2026-01-27 05:41
  return iso
    .replace('T', ' ')
    .slice(0, 16);
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
export function parseNoteFromTxt(filename: string, txtContent: string): Note | null {
  try {
    const lines = txtContent.split('\n');
    const titleMatch = lines[0]?.match(/# Title: (.+)/);
    const createdMatch = lines[1]?.match(/# Created: (.+)/);
    const updatedMatch = lines[2]?.match(/# Updated: (.+)/);
    
    if (!titleMatch || !createdMatch || !updatedMatch) {
      console.error('Invalid TXT format - missing metadata');
      return null;
    }
    
    const content = lines.slice(4).join('\n'); // Skip header (3 lines) + empty line
    const id = filename.replace('.txt', '');
    
    return {
      id,
      title: titleMatch[1],
      content,
      createdAt: createdMatch[1],
      updatedAt: updatedMatch[1],
      isSynced: true, // Dari Drive = already synced
    };
  } catch (error) {
    console.error('Failed to parse note:', error);
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