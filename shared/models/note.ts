// shared/models/note.ts

/**
 * Note model for DailyNote Sync POC
 * Represents a single journal entry that can be synced to Google Drive
 */
export interface Note {
  id: string;                // timestamp-based ID (e.g., "2026-01-27_14-52-34")
  title: string;             // display title (auto-generated or user-edited)
  content: string;           // markdown content
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
  isSynced: boolean;         // sync status flag
  driveFileId?: string;      // Google Drive file ID (optional, set after upload)
  localFilePath?: string;    // local TXT file path (optional, platform-specific)
}
