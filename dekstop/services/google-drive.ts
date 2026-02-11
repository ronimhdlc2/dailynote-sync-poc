import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  driveFileId?: string;
}

export class GoogleDriveService {
  private oauth2Client: OAuth2Client;
  private drive: any;

  constructor(oauth2Client: OAuth2Client) {
    this.oauth2Client = oauth2Client;
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }
  
  async ensureUserFolder(userEmail: string): Promise<string> {
    const dailyNotesFolder = await this.findOrCreateFolder('DailyNotes', 'root');
    const userFolder = await this.findOrCreateFolder(userEmail, dailyNotesFolder);
    return userFolder;
  }
  
  async findOrCreateFolder(folderName: string, parentId: string): Promise<string> {
    const response = await this.drive.files.list({
      q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
    });
    
    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id;
    }
    
    const folder = await this.drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });
    
    return folder.data.id;
  }
  
  async uploadNote(note: Note, folderId: string): Promise<string> {
    const filename = `${note.id}.txt`;
    const content = this.formatNoteAsTxt(note);
    
    const existingFile = await this.findFileByName(filename, folderId);
    
    if (existingFile) {
      await this.drive.files.update({
        fileId: existingFile,
        media: { mimeType: 'text/plain', body: content },
      });
      return existingFile;
    }
    
    const response = await this.drive.files.create({
      requestBody: { name: filename, parents: [folderId] },
      media: { mimeType: 'text/plain', body: content },
      fields: 'id',
    });
    
    return response.data.id;
  }
  
  async downloadAllNotes(folderId: string): Promise<Note[]> {
  const response = await this.drive.files.list({
    q: `'${folderId}' in parents and mimeType='text/plain' and trashed=false`,
    fields: 'files(id, name)',
  });
  
  
  if (!response.data.files) return [];
  
  const notes: Note[] = [];
  for (const file of response.data.files) {
    
    try {
      const content = await this.downloadFileContent(file.id);
      
      const note = this.parseNoteFromTxt(file.name, content);
      if (note) {
        note.driveFileId = file.id;
        notes.push(note);
      } else {
        console.warn('Failed to parse file:', file.name);
      }
    } catch (error) {
      console.error('Error processing file:', file.name, error);
    }
  }
  
  return notes;
}
  
  async deleteNote(driveFileId: string): Promise<void> {
    await this.drive.files.delete({ fileId: driveFileId });
  }
  
  async findFileByName(filename: string, folderId: string): Promise<string | null> {
    const response = await this.drive.files.list({
      q: `name='${filename}' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id)',
    });
    
    return response.data.files?.[0]?.id || null;
  }
  
  async downloadFileContent(fileId: string): Promise<string> {
    const response = await this.drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'text' }
    );
    return response.data;
  }
  
  formatNoteAsTxt(note: Note): string {
    return `# Title: ${note.title}\n# Created: ${note.createdAt}\n# Updated: ${note.updatedAt}\n\n${note.content}`;
  }
  
  parseNoteFromTxt(filename: string, content: string): Note | null {
    try {
      const lines = content.split('\n');
      const title = lines[0]?.match(/# Title: (.+)/)?.[1];
      const createdAt = lines[1]?.match(/# Created: (.+)/)?.[1];
      const updatedAt = lines[2]?.match(/# Updated: (.+)/)?.[1];
      const noteContent = lines.slice(4).join('\n');
      
      if (!title || !createdAt || !updatedAt) return null;
      
      return {
        id: filename.replace('.txt', ''),
        title,
        content: noteContent,
        createdAt,
        updatedAt,
        isSynced: true,
      };
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  }
}