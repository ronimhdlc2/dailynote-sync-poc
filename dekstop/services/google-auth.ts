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
    localStorage.setItem('google-tokens', JSON.stringify(tokens));
  },

  // Load tokens from storage
  loadTokens(): boolean {
    const tokensJson = localStorage.getItem('google-tokens');
    if (tokensJson) {
      const tokens = JSON.parse(tokensJson);
      window.electronAPI.googleAuth.setCredentials(tokens);
      return true;
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
    localStorage.removeItem('google-tokens');
  },

  // Get OAuth2 client - NOT AVAILABLE in renderer
  getClient() {
    throw new Error('getClient() not available in renderer. Use IPC instead.');
  },
};