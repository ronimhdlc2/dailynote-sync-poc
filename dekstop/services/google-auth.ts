// dekstop/services/google-auth.ts
// RENDERER PROCESS VERSION - Menggunakan IPC untuk komunikasi dengan main process
import type { UserInfo } from './electron-api';

export const GoogleAuth = {
  // Get authorization URL (via IPC)
  async getAuthUrl(): Promise<string> {
    return await window.electronAPI.googleAuth.getAuthUrl();
  },

  // Exchange code for tokens (via IPC)
  async getTokensFromCode(code: string): Promise<void> {
    const tokens = await window.electronAPI.googleAuth.exchangeCode(code);
    const tokensJson = JSON.stringify(tokens);
    const encrypted = await window.electronAPI.googleAuth.encrypt(tokensJson);
    localStorage.setItem('google-tokens-encrypted', encrypted);
    localStorage.removeItem('google-tokens'); // Hapus yang tidak terenkripsi
  },

  // Load tokens from storage
  async loadTokens(): Promise<boolean> {
    let tokensJson = localStorage.getItem('google-tokens-encrypted');
    
    if (tokensJson) {
      tokensJson = await window.electronAPI.googleAuth.decrypt(tokensJson);
    } else {
      // Fallback untuk catatan lama (un-encrypted)
      tokensJson = localStorage.getItem('google-tokens');
    }

    if (tokensJson) {
      try {
        const tokens = JSON.parse(tokensJson);
        window.electronAPI.googleAuth.setCredentials(tokens);
        return true;
      } catch (e) {
        console.error('Failed to parse tokens:', e);
        return false;
      }
    }
    return false;
  },

  // Get current user info (via IPC)
  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const data = await window.electronAPI.googleAuth.getUserInfo();
      return {
        id: data.id || '',
        email: data.email || '',
        name: data.name || '',
        photo: data.picture || undefined,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  // Sign out
  signOut(): void {
    localStorage.removeItem('google-tokens-encrypted');
    localStorage.removeItem('google-tokens');
  },

  // Get OAuth2 client - NOT AVAILABLE in renderer
  getClient() {
    throw new Error('getClient() not available in renderer. Use IPC instead.');
  },
};