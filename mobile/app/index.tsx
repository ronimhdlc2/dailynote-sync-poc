// mobile/app/index.tsx
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Cloud,
  Smartphone,
  Lock,
  RefreshCw,
  LogOut, // ← TAMBAHKAN INI
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState, useCallback } from "react";
import { GoogleAuth } from "../services/google-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleDriveService } from "../services/google-drive";
import { NoteStorage } from "../services/storage";
import { mergeNotes } from "shared/core/note-engine";
import Toast from "react-native-toast-message";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from 'expo-file-system/legacy';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error occurred";
};

export default function RootHome() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storagePath, setStoragePath] = useState<string | null>(null);

  // Cek auth setiap kali halaman difokuskan (termasuk setelah login redirect)
  useFocusEffect(
    useCallback(() => {
      setIsChecking(true);
      checkAuth();
    }, [])
  );

  const loadStoragePath = async () => {
    const path = await NoteStorage.getStoragePath();
    setStoragePath(path);
  };


  const checkAuth = async () => {
    console.log("[DEBUG] checkAuth: Checking if user is signed in...");
    const isSignedIn = await GoogleAuth.isSignedIn();
    
    if (!isSignedIn) {
      console.log("[DEBUG] checkAuth: User not signed in, redirecting to /auth");
      router.replace("/auth");
      setIsChecking(false);
      return;
    }

    console.log("[DEBUG] checkAuth: User is signed in, loading storage path...");
    const path = await NoteStorage.getStoragePath();
    console.log("[DEBUG] checkAuth: Path from storage:", path);
    setStoragePath(path);
    
    if (path) {
      console.log("[DEBUG] checkAuth: Path exists, initializing sync...");
      await initializeSync();
    } else {
      console.log("[DEBUG] checkAuth: No path configured yet.");
    }
    
    setIsChecking(false);
  };

  const handleSelectFolder = async () => {
    try {
      // 1. Request Permission & Select Folder (Android SAF)
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (permissions.granted) {
        const folderUri = permissions.directoryUri;
        await NoteStorage.setStoragePath(folderUri);
        setStoragePath(folderUri);
        
        Toast.show({
          type: "success",
          text1: "Folder penyimpanan diatur",
          text2: "Akses folder berhasil diberikan",
        });
        
        // Mulai sync setelah folder diatur
        initializeSync();
      } else {
        Toast.show({
          type: "info",
          text1: "Izin ditolak",
          text2: "Aplikasi butuh akses folder untuk menyimpan catatan",
        });
      }
    } catch (err) {
      console.error("Failed to select folder:", err);
      // Fallback ke DocumentPicker jika SAF tidak tersedia (misal di iOS/Web)
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const fileUri = result.assets[0].uri;
          const lastSlash = fileUri.lastIndexOf("/");
          const folderUri = fileUri.substring(0, lastSlash);
          
          await NoteStorage.setStoragePath(folderUri);
          setStoragePath(folderUri);
          initializeSync();
        }
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "Selection failed",
          text2: getErrorMessage(err),
        });
      }
    }
  };

  const initializeSync = async () => {
    try {
      const storedPath = await NoteStorage.getStoragePath();
      if (!storedPath) {
        console.log("⚠️ Storage folder not configured, skipping sync");
        return;
      }

      setIsSyncing(true);

      const user = await GoogleAuth.getCurrentUser();
      if (!user) {
        console.log("❌ No user found, skipping sync");
        return;
      }

      console.log("🔄 Initializing Google Drive sync for:", user.email);

      const token = await GoogleAuth.getAccessToken();
      if (!token) {
        throw new Error("No access token found. Please login again.");
      }

      let folderId;
      try {
        folderId = await GoogleDriveService.ensureUserFolder(user.email);

        if (!folderId || typeof folderId !== "string") {
          throw new Error("Invalid folder ID received from Google Drive");
        }

        console.log("✅ Drive folder ready:", folderId);
        await AsyncStorage.setItem("drive-folder-id", folderId);
      } catch (error) {
        console.error("❌ Failed to ensure folder:", error);
        throw new Error(
          `Failed to create/find Google Drive folder: ${getErrorMessage(error)}`,
        );
      }

      const remoteNotes = await GoogleDriveService.downloadAllNotes(folderId);

      const localNotes = await NoteStorage.getNotes();

      const unsyncedLocalNotes = localNotes.filter((n) => !n.isSynced);
      const merged = [...remoteNotes, ...unsyncedLocalNotes];

      for (const note of merged) {
        await NoteStorage.saveNote(note);
      }

      const syncTime = new Date().toISOString();
      await AsyncStorage.setItem("last-sync-time", syncTime);

      Toast.show({
        type: "success",
        text1: "Synced with Google Drive",
        text2: `${merged.length} notes ready`,
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });

      console.log("✅ Sync completed successfully");
    } catch (error) {
      console.error("❌ Sync initialization error:", error);

      Toast.show({
        type: "error",
        text1: "Sync failed",
        text2: getErrorMessage(error),
        position: "top",
        visibilityTime: 5000,
        topOffset: 60,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // ✅ TAMBAHKAN FUNGSI LOGOUT
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear specific project keys only, keep storage path!
            await GoogleAuth.signOut();
            await AsyncStorage.removeItem("drive-folder-id");
            await AsyncStorage.removeItem("last-sync-time");
            await AsyncStorage.removeItem("dailynote-suppressed-ids");

            Toast.show({
              type: "success",
              text1: "Logged out",
              text2: "See you next time!",
              position: "top",
              visibilityTime: 2000,
              topOffset: 60,
            });

            // Redirect to auth
            router.replace("/auth");
          } catch (error) {
            console.error("Logout error:", error);
            Toast.show({
              type: "error",
              text1: "Logout failed",
              text2: getErrorMessage(error),
              position: "top",
            });
          }
        },
      },
    ]);
  };

  if (isChecking || isSyncing) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <LinearGradient
          colors={["#2563eb", "#1d4ed8"]}
          className="w-20 h-20 rounded-full items-center justify-center mb-4"
        >
          <BookOpen color="white" size={32} />
        </LinearGradient>
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          {isChecking ? "Loading..." : "Syncing with Google Drive..."}
        </Text>
        <Text className="text-sm text-gray-500">
          {isSyncing && "Please wait while we sync your notes"}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <ScrollView className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* ✅ TAMBAHKAN HEADER DENGAN LOGOUT BUTTON */}
        <View className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <View className="px-6 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <LinearGradient
                colors={["#2563eb", "#1d4ed8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-10 h-10 rounded-xl items-center justify-center shadow-lg"
              >
                <BookOpen color="white" size={20} />
              </LinearGradient>
              <Text className="text-xl font-bold text-gray-900">DailyNote</Text>
            </View>

            {/* ✅ LOGOUT BUTTON */}
            <TouchableOpacity
              onPress={handleLogout}
              className="flex-row items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg active:opacity-70"
            >
              <LogOut color="#dc2626" size={18} />
              <Text className="text-sm font-semibold text-red-600">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View className="px-6 py-8">
          {/* Hero */}
          <View className="items-center mb-12">
            <View className="flex-row items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
              <View className="w-2 h-2 bg-blue-600 rounded-full" />
              <Text className="text-sm font-medium text-blue-700">
                Cross-Platform Journaling App
              </Text>
            </View>

            <Text className="text-4xl font-bold text-gray-900 mb-4 text-center leading-tight">
              Catat Hari Anda,{"\n"}
              <Text className="text-blue-600">Tersimpan Aman di Cloud</Text>
            </Text>

            <Text className="text-lg text-gray-600 mb-6 text-center leading-relaxed px-4">
              Aplikasi journaling sederhana dengan sinkronisasi otomatis ke
              Google Drive. Akses catatan Anda dari desktop atau mobile, kapan
              saja.
            </Text>

            {/* CTA Buttons */}
            <View className="gap-3 w-full px-4">
              {!storagePath ? (
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-3 bg-blue-600 px-8 py-4 rounded-xl shadow-lg active:opacity-80"
                  onPress={handleSelectFolder}
                >
                  <RefreshCw color="white" size={20} />
                  <Text className="text-lg font-semibold text-white">
                    Pilih Lokasi Penyimpanan
                  </Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 bg-blue-600 px-8 py-4 rounded-xl shadow-lg active:opacity-80"
                    onPress={() => router.push("/note-editor")}
                  >
                    <BookOpen color="white" size={20} />
                    <Text className="text-lg font-semibold text-white">
                      Mulai Menulis Sekarang
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center justify-center gap-2 bg-white border-2 border-blue-600 px-8 py-4 rounded-xl active:opacity-80"
                    onPress={() => router.push("/note-list")}
                  >
                    <Text className="text-lg font-semibold text-blue-600">
                      Lihat Catatan Saya
                    </Text>
                  </TouchableOpacity>
                  
                  <View className="mt-4 flex-row items-center justify-center gap-2 bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
                    <Cloud color="#3b82f6" size={14} />
                    <Text className="text-xs text-gray-500 italic flex-1" numberOfLines={1}>
                      Lokal: {storagePath}
                    </Text>
                    <TouchableOpacity onPress={handleSelectFolder}>
                      <Text className="text-xs font-bold text-blue-600">Ubah</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Preview Card */}
          <View className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
            <View className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl items-center justify-center border border-gray-200">
              <BookOpen color="#9ca3af" size={64} />
              <Text className="text-gray-500 font-medium mt-3">
                App Preview
              </Text>
            </View>
          </View>

          {/* Features Grid */}
          <View className="gap-6 mb-12">
            {/* Feature 1 */}
            <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <View className="flex-row items-start gap-4">
                <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center">
                  <Cloud color="#2563eb" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Sinkronisasi Otomatis
                  </Text>
                  <Text className="text-sm text-gray-600 leading-relaxed">
                    Semua catatan tersimpan otomatis ke Google Drive dalam
                    format TXT. Data Anda aman dan dapat diakses dari berbagai
                    device.
                  </Text>
                </View>
              </View>
            </View>

            {/* Feature 2 */}
            <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <View className="flex-row items-start gap-4">
                <View className="w-12 h-12 bg-green-100 rounded-lg items-center justify-center">
                  <Smartphone color="#16a34a" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Multi-Platform
                  </Text>
                  <Text className="text-sm text-gray-600 leading-relaxed">
                    Gunakan di mobile (iOS & Android) atau desktop (Windows,
                    Mac, Linux). Satu aplikasi untuk semua perangkat Anda.
                  </Text>
                </View>
              </View>
            </View>

            {/* Feature 3 */}
            <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <View className="flex-row items-start gap-4">
                <View className="w-12 h-12 bg-purple-100 rounded-lg items-center justify-center">
                  <RefreshCw color="#9333ea" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Mode Offline
                  </Text>
                  <Text className="text-sm text-gray-600 leading-relaxed">
                    Tetap produktif tanpa koneksi internet. Catatan disimpan
                    lokal dan sinkronisasi otomatis saat kembali online.
                  </Text>
                </View>
              </View>
            </View>

            {/* Feature 4 */}
            <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <View className="flex-row items-start gap-4">
                <View className="w-12 h-12 bg-orange-100 rounded-lg items-center justify-center">
                  <Lock color="#ea580c" size={24} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-gray-900 mb-2">
                    Aman & Private
                  </Text>
                  <Text className="text-sm text-gray-600 leading-relaxed">
                    Login dengan Google OAuth. Data terenkripsi dan tersimpan di
                    Google Drive pribadi Anda.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* How It Works */}
          <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
            <Text className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Cara Menggunakan
            </Text>

            <View className="gap-8">
              {/* Step 1 */}
              <View className="items-center">
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
                >
                  <Text className="text-2xl font-bold text-white">1</Text>
                </LinearGradient>
                <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Login dengan Google
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Autentikasi menggunakan akun Google untuk akses ke Drive
                </Text>
              </View>

              {/* Step 2 */}
              <View className="items-center">
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
                >
                  <Text className="text-2xl font-bold text-white">2</Text>
                </LinearGradient>
                <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Tulis Catatan Harian
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Buat catatan dengan timestamp otomatis dan dukungan markdown
                </Text>
              </View>

              {/* Step 3 */}
              <View className="items-center">
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
                >
                  <Text className="text-2xl font-bold text-white">3</Text>
                </LinearGradient>
                <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                  Sync Otomatis
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Catatan tersimpan otomatis dan tersedia di semua device Anda
                </Text>
              </View>
            </View>
          </View>

          {/* Tech Stack */}
          <LinearGradient
            colors={["#111827", "#1f2937"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="rounded-2xl p-8 mb-8"
          >
            <View className="items-center mb-6">
              <Text className="text-2xl font-bold text-white mb-2">
                Teknologi yang Digunakan
              </Text>
              <Text className="text-gray-400 text-center">
                Dibangun dengan stack modern dan reliable
              </Text>
            </View>

            <View className="flex-row flex-wrap justify-center gap-3">
              {[
                "React Native",
                "Electron",
                "TypeScript",
                "Google Drive API",
                "Expo",
                "OAuth 2.0",
              ].map((tech) => (
                <View
                  key={tech}
                  className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg"
                >
                  <Text className="text-sm font-medium text-white">{tech}</Text>
                </View>
              ))}
            </View>
          </LinearGradient>
        </View>

        {/* CTA Section */}
        <LinearGradient colors={["#2563eb", "#1d4ed8"]} className="py-12 px-6">
          <View className="items-center">
            <Text className="text-3xl font-bold text-white mb-4 text-center">
              Siap Mencatat Hari Anda?
            </Text>
            <Text className="text-lg text-blue-100 mb-6 text-center">
              Mulai journaling dengan DailyNote sekarang
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-2 bg-white px-8 py-4 rounded-xl shadow-xl active:opacity-80"
              onPress={() => router.push("/note-editor")}
            >
              <BookOpen color="#2563eb" size={20} />
              <Text className="text-lg font-semibold text-blue-600">
                Mulai Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}
