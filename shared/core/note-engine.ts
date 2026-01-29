/**
 * Core business logic for note operations
 * This is like your "controller" in Express.js - pure logic, no UI
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
// PUBLIC API (Business Logic)
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
