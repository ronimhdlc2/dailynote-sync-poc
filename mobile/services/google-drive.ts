// mobile/services/google-drive.ts
import { GoogleAuth } from './google-auth';
import { Note } from 'shared/models/note';
import { formatNoteAsTxt, parseNoteFromTxt } from 'shared/core/note-engine';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

export class GoogleDriveService {
  // Ensure user folder exists
  static async ensureUserFolder(userEmail: string): Promise<string> {
    try {
      const token = await GoogleAuth.getAccessToken();
      if (!token) {
        throw new Error('Not authenticated - no access token');
      }
      
      // 1. Find or create "DailyNotes" folder
      const dailyNotesFolderId = await this.findOrCreateFolder('DailyNotes', 'root', token);
      
      // 2. Find or create user folder inside DailyNotes
      const userFolderId = await this.findOrCreateFolder(userEmail, dailyNotesFolderId, token);
      
      return userFolderId;
    } catch (error) {
      console.error('❌ ensureUserFolder error:', error);
      throw error;
    }
  }

  // Find or create folder
  static async findOrCreateFolder(folderName: string, parentId: string, token: string): Promise<string> {
    try {
      // Search for existing folder
      const searchQuery = `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(searchQuery)}&fields=files(id,name)`;
          
      const searchResponse = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        throw new Error(`Search failed: ${searchResponse.status} - ${errorText}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
      }
      
      // Create new folder            
      const createUrl = `${DRIVE_API_BASE}/files`;
      const createResponse = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
        }),
      });
      
      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Create folder failed: ${createResponse.status} - ${errorText}`);
      }
      
      const createData = await createResponse.json();
      console.log(`✅ Created folder: ${folderName}`);
      
      return createData.id;
    } catch (error) {
      console.error('❌ findOrCreateFolder error:', error);
      throw error;
    }
  }

  // Upload or update note
  static async uploadNote(note: Note, folderId: string): Promise<string> {
    try {
      const token = await GoogleAuth.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      const filename = `${note.id}.txt`;
      const content = formatNoteAsTxt(note);
      
      // Check if file exists
      const existingFileId = await this.findFileByName(filename, folderId, token);
      
      if (existingFileId) {
        // Update existing file
        
        const updateUrl = `${UPLOAD_API_BASE}/files/${existingFileId}?uploadType=media`;
        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'text/plain',
          },
          body: content,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Update failed: ${response.status} - ${errorText}`);
        }
        
        console.log(`✅ Updated note: ${note.title}`);
        return existingFileId;
      } else {
        // Create new file
        const metadata = {
          name: filename,
          parents: [folderId],
          mimeType: 'text/plain',
        };
        
        // Multipart upload
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;
        
        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: text/plain\r\n\r\n' +
          content +
          closeDelimiter;
        
        const createUrl = `${UPLOAD_API_BASE}/files?uploadType=multipart&fields=id`;
        const response = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartRequestBody,
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Create file failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Created note: ${note.title}`);
        
        return data.id;
      }
    } catch (error) {
      console.error('❌ uploadNote error:', error);
      throw error;
    }
  }

  // Download all notes from folder
  static async downloadAllNotes(folderId: string): Promise<Note[]> {
    try {
      const token = await GoogleAuth.getAccessToken();
      if (!token) throw new Error('Not authenticated');

      // List all TXT files in folder
      const query = `'${folderId}' in parents and mimeType='text/plain' and trashed=false`;
      const listUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;
      
      const listResponse = await fetch(listUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!listResponse.ok) {
        const errorText = await listResponse.text();
        throw new Error(`List files failed: ${listResponse.status} - ${errorText}`);
      }
      
      const listData = await listResponse.json();
      
      if (!listData.files || listData.files.length === 0) {
        return [];
      }
      
      // Download each file
      const notes: Note[] = [];
      for (const file of listData.files) {
        try {
          const content = await this.downloadFileContent(file.id, token);
          const note = parseNoteFromTxt(file.name, content);
          
          if (note) {
            note.driveFileId = file.id;
            note.isSynced = true;
            notes.push(note);
          } else {
            console.warn('⚠️ Failed to parse file:', file.name);
          }
        } catch (error) {
          console.error('❌ Error processing file:', file.name, error);
        }
      }
      
      console.log(`✅ Synced ${notes.length} notes from Drive`);
      return notes;
    } catch (error) {
      console.error('❌ downloadAllNotes error:', error);
      throw error;
    }
  }

  // Delete note from Drive
  static async deleteNote(driveFileId: string): Promise<void> {
    try {
      const token = await GoogleAuth.getAccessToken();
      if (!token) throw new Error('Not authenticated');


      const deleteUrl = `${DRIVE_API_BASE}/files/${driveFileId}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        throw new Error(`Delete failed: ${response.status} - ${errorText}`);
      }
      
      console.log('✅ Deleted note from Drive');
    } catch (error) {
      console.error('❌ deleteNote error:', error);
      throw error;
    }
  }

  // Helper: Find file by name
  private static async findFileByName(filename: string, folderId: string, token: string): Promise<string | null> {
    try {
      const query = `name='${filename}' and '${folderId}' in parents and trashed=false`;
      const searchUrl = `${DRIVE_API_BASE}/files?q=${encodeURIComponent(query)}&fields=files(id)`;
      
      const response = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data.files && data.files.length > 0 ? data.files[0].id : null;
    } catch (error) {
      console.error('❌ findFileByName error:', error);
      return null;
    }
  }

  // Helper: Download file content
  private static async downloadFileContent(fileId: string, token: string): Promise<string> {
    try {
      const downloadUrl = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }
      
      return await response.text();
    } catch (error) {
      console.error('❌ downloadFileContent error:', error);
      throw error;
    }
  }
}