import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from 'expo-secure-store';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY_TOKEN = "google-access-token";
const STORAGE_KEY_USER = "google-user-info";

// Client ID IOS
const CLIENT_ID = '976350593410-mcgl41crlnmf5j8mvbltk4m4bh26b0pt.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  photo?: string;
}

export const GoogleAuth = {
   async signIn(): Promise<UserInfo> {
    try {
      // Custom scheme (work di Android & iOS)
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'com.dailynote.mobile',
      });

      const request = new AuthSession.AuthRequest({
        clientId: CLIENT_ID,
        scopes: [
          "openid",
          "profile",
          "email",
          "https://www.googleapis.com/auth/drive.file",
        ],
        redirectUri,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === "success") {
        const { code } = result.params;

        // Exchange code for token
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: CLIENT_ID,
            code,
            redirectUri,
            extraParams: {
              code_verifier: request.codeVerifier || "",
            },
          },
          discovery,
        );

        // Get user info
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v2/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.accessToken}` },
          },
        );
        const userInfo = await userInfoResponse.json();

        // Save to secure storage
        await SecureStore.setItemAsync(
          STORAGE_KEY_TOKEN,
          tokenResponse.accessToken,
        );
        
        // User info can stay in AsyncStorage as it's less sensitive than the token
        await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userInfo));

        return {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name || "",
          photo: userInfo.picture || undefined,
        };
      } else {
        throw new Error("Sign in cancelled or failed");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async isSignedIn(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(STORAGE_KEY_TOKEN);
    return token !== null;
  },

  async getCurrentUser(): Promise<UserInfo | null> {
    const userJson = await AsyncStorage.getItem(STORAGE_KEY_USER);
    return userJson ? JSON.parse(userJson) : null;
  },

  async getAccessToken(): Promise<string | null> {
    return await SecureStore.getItemAsync(STORAGE_KEY_TOKEN);
  },

  async signOut(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEY_USER);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  },

  async refreshTokenIfNeeded(): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error("No token found");
    return token;
  },
};
