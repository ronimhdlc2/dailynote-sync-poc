// mobile/app/note-list.tsx

/**
 * Notes List Screen (Mobile)
 * Display all notes in chronological order (newest first)
 * WITH GOOGLE DRIVE SYNC
 */

import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import {
  BookOpen,
  Plus,
  Trash2,
  Clock,
  FileText,
  Eye,
  RefreshCw,
  AlertCircle,
  LogOut,
} from "lucide-react-native";
import type { Note } from "shared/models/note";
import { GoogleAuth } from "../services/google-auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleDriveService } from "../services/google-drive";
import { mergeNotes } from "shared/core/note-engine";
import { NoteStorage } from "../services/storage";
import { useFocusEffect } from "expo-router";

// ✅ HELPER FUNCTION
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error occurred";
};

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // ✅ LOAD LAST SYNC TIME SAAT MOUNT
  useEffect(() => {
    loadLastSyncTime();
  }, []);

  // Load notes when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
      loadLastSyncTime(); // ✅ RELOAD SYNC TIME JUGA
    }, []),
  );

  // Auto-sync every 10 minutes
  useEffect(() => {
    const syncInterval = setInterval(
      () => {
        handleSync();
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => clearInterval(syncInterval);
  }, []);

  // ✅ TAMBAHKAN FUNGSI LOAD LAST SYNC TIME
  const loadLastSyncTime = async () => {
    try {
      const syncTimeStr = await AsyncStorage.getItem("last-sync-time");
      if (syncTimeStr) {
        setLastSyncTime(new Date(syncTimeStr));
      }
    } catch (error) {
      console.error("Load sync time error:", error);
    }
  };

  // Load notes from local storage
  const loadNotes = async () => {
    try {
      const loaded = await NoteStorage.getNotes();
      setNotes(loaded || []); // ✅ FALLBACK TO EMPTY ARRAY
    } catch (error) {
      console.error("Load notes error:", error);
      setNotes([]);
    }
  };

  // Sync with Google Drive
  const handleSync = async () => {
    if (isSyncing) return;

    try {
      setIsSyncing(true);

      const folderId = await AsyncStorage.getItem("drive-folder-id");
      if (!folderId) {
        Toast.show({
          type: "error",
          text1: "Sync not configured",
          text2: "Please restart the app",
          position: "top",
          visibilityTime: 3000,
          topOffset: 60,
        });
        return;
      }

      console.log("🔄 Syncing with Google Drive...");

      // 1. Upload unsynced local notes FIRST
      // 🔄 Refresh local notes first to detect manual deletions
      await loadNotes();
      const currentLocalNotes = await NoteStorage.getNotes(); 

      const unsyncedToUpload = currentLocalNotes.filter((n) => !n.isSynced);
      const justUploadedIds = new Set<string>();

      if (unsyncedToUpload.length > 0) {
        console.log(`📤 Found ${unsyncedToUpload.length} unsynced notes, uploading...`);
        Toast.show({
          type: "info",
          text1: "Syncing offline notes...",
          text2: `${unsyncedToUpload.length} notes pending`,
          position: "top",
          visibilityTime: 2000,
          topOffset: 60,
        });

        for (const note of unsyncedToUpload) {
          try {
            const driveFileId = await GoogleDriveService.uploadNote(note, folderId);
            // Update local note status
            const updatedNote = { ...note, driveFileId, isSynced: true };
            await NoteStorage.saveNote(updatedNote);
            justUploadedIds.add(note.id); // Track success upload
            console.log(`✅ Synced: ${note.title}`);
          } catch (err) {
            console.error(`❌ Failed to upload ${note.title}:`, err);
            // Ignore error, will retry next time
          }
        }
      }

      // 🔄 DETEKSI DELETE MANUAL LOKAL DIHAPUS (REVERTED AS PER SUPERVISOR)
      // Kita tidak lagi menghapus di Drive jika file lokal hilang manual.
      // Sebaliknya, file akan di-download ulang (merged).

      // 2. Download notes from Google Drive
      const remoteNotes = await GoogleDriveService.downloadAllNotes(folderId);
      const suppressedIdsStr = await AsyncStorage.getItem("dailynote-suppressed-ids");
      const suppressedIds = suppressedIdsStr ? JSON.parse(suppressedIdsStr) : [];

      // 3. Get updated local notes
      const localNotesAfterUpload = await NoteStorage.getNotes();
      const unsyncedLocalNotes = localNotesAfterUpload.filter((n) => !n.isSynced);

      // Merge: remote notes + unsynced local notes
      // Remote is priority, tapi abaikan yang di-suppress
      const filteredRemote = remoteNotes.filter(rn => !suppressedIds.includes(rn.id));
      
      const merged = [...filteredRemote, ...unsyncedLocalNotes].reduce((acc, note) => {
        const existing = acc.find((n) => n.id === note.id);
        if (!existing) {
          acc.push(note);
        } else if (new Date(note.updatedAt) > new Date(existing.updatedAt)) {
          acc = acc.map((n) => (n.id === note.id ? note : n));
        }
        return acc;
      }, [] as Note[]);

      // 4. Latency Protection: Add just-uploaded notes if missing from remote
      const remoteIds = new Set(remoteNotes.map((n) => n.id));
      localNotesAfterUpload.forEach((n) => {
        if (n.isSynced && justUploadedIds.has(n.id) && !remoteIds.has(n.id)) {
          merged.push(n);
        }
      });

      for (const note of merged) {
        await NoteStorage.saveNote(note);
      }

      await loadNotes();

      const syncTime = new Date();
      setLastSyncTime(syncTime);
      await AsyncStorage.setItem("last-sync-time", syncTime.toISOString());

      Toast.show({
        type: "success",
        text1: "Synced successfully",
        text2: `${merged.length} notes`,
        position: "top",
        visibilityTime: 2000,
        topOffset: 60,
      });

      console.log("✅ Sync completed");
    } catch (error) {
      console.error("❌ Sync error:", error);
      Toast.show({
        type: "error",
        text1: "Sync failed",
        text2: getErrorMessage(error),
        position: "top",
        visibilityTime: 3000,
        topOffset: 60,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete note (local + Google Drive)
  const handleDeleteNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);

    Alert.alert(
      "Delete Note",
      `Are you sure you want to delete "${note?.title}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Add to suppression list
              const suppressedStr = await AsyncStorage.getItem("dailynote-suppressed-ids");
              const suppressed = suppressedStr ? JSON.parse(suppressedStr) : [];
              await AsyncStorage.setItem("dailynote-suppressed-ids", JSON.stringify([...suppressed, noteId]));

              // 2. Delete from local storage
              await NoteStorage.deleteNote(noteId);

              // 3. Try to delete from Google Drive
              if (note?.driveFileId) {
                try {
                  await GoogleDriveService.deleteNote(note.driveFileId);

                  // 4. Clean up suppression on success
                  const currentSuppressedStr = await AsyncStorage.getItem("dailynote-suppressed-ids");
                  const currentSuppressed = currentSuppressedStr ? JSON.parse(currentSuppressedStr) : [];
                  await AsyncStorage.setItem("dailynote-suppressed-ids", JSON.stringify(currentSuppressed.filter((id: string) => id !== noteId)));

                  const syncTime = new Date().toISOString();
                  await AsyncStorage.setItem("last-sync-time", syncTime);
                  
                  Toast.show({
                    type: "success",
                    text1: "Note deleted",
                    text2: "Removed from Google Drive",
                    position: "top",
                    visibilityTime: 3000,
                    topOffset: 60,
                  });
                } catch (error) {
                  console.error("Delete from Drive error:", error);
                  Toast.show({
                    type: "warning",
                    text1: "Deleted locally",
                    text2: "Will sync deletion when online",
                    position: "top",
                    visibilityTime: 3000,
                    topOffset: 60,
                  });
                }
              } else {
                Toast.show({
                  type: "success",
                  text1: "Note deleted",
                  text2: `"${note?.title}" has been deleted`,
                  position: "top",
                  visibilityTime: 3000,
                  topOffset: 60,
                });
              }

              await loadNotes();
              await loadLastSyncTime(); // ✅ RELOAD SYNC TIME
            } catch (error) {
              console.error("Delete error:", error);
              Toast.show({
                type: "error",
                text1: "Delete failed",
                text2: getErrorMessage(error),
                position: "top",
              });
            }
          },
        },
      ],
    );
  };

  // Format date for display
  const formatDate = (isoString: string) => {
    try {
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
    } catch (error) {
      return "Invalid date";
    }
  };

  // Get note preview (first 100 chars)
  const getPreview = (content: string) => {
    if (!content) return "No content";

    const plain = content
      .replace(/[*_~`#]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return plain.length > 100 ? plain.substring(0, 100) + "..." : plain;
  };

  // Format last sync time
  const formatSyncTime = () => {
    if (!lastSyncTime) return "Not synced";

    try {
      const seconds = Math.floor(
        (new Date().getTime() - lastSyncTime.getTime()) / 1000,
      );
      if (seconds < 60) return "Just now";
      if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
      if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
      return lastSyncTime.toLocaleDateString();
    } catch (error) {
      return "Unknown";
    }
  };

  // Logout
  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await GoogleAuth.signOut();
            await AsyncStorage.clear();
            router.replace("/auth");
          } catch (error) {
            console.error("Logout error:", error);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <View className="px-6 py-4 pt-12">
            <View className="flex-row items-center justify-between mb-2">
              {/* Logo & Title */}
              <View className="flex-row items-center gap-3">
                <LinearGradient
                  colors={["#2563eb", "#1d4ed8"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-10 h-10 rounded-xl items-center justify-center shadow-lg"
                >
                  <BookOpen color="white" size={20} />
                </LinearGradient>
                <View>
                  <Text className="text-xl font-bold text-gray-900">
                    DailyNote
                  </Text>
                  <Text className="text-sm text-gray-500">Your Notes</Text>
                </View>
              </View>

              {/* Sync Status & Refresh Button */}
              <View className="flex-row items-center gap-2">
                {/* Sync Status Indicator */}
                <View
                  className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg border ${
                    isSyncing
                      ? "bg-blue-50 border-blue-200"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <View
                    className={`w-2 h-2 rounded-full ${
                      isSyncing ? "bg-blue-500" : "bg-green-500"
                    }`}
                  />
                  <Text className="text-xs text-gray-600 font-medium">
                    {formatSyncTime()}
                  </Text>
                </View>

                {/* Refresh Button */}
                <TouchableOpacity
                  onPress={handleSync}
                  disabled={isSyncing}
                  className={`p-2 rounded-lg ${
                    isSyncing ? "bg-blue-100" : "bg-blue-50"
                  }`}
                >
                  <RefreshCw color="#2563eb" size={18} />
                </TouchableOpacity>

                {/* Notes Count */}
                <View className="px-3 py-1.5 bg-blue-100 rounded-lg">
                  <Text className="text-sm font-semibold text-blue-700">
                    {notes.length}
                  </Text>
                </View>

                {/* Logout Button */}
                <TouchableOpacity 
                   onPress={handleLogout}
                   className="p-2 bg-red-50 rounded-lg border border-red-100 active:opacity-70"
                >
                  <LogOut color="#dc2626" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Sync Loading Banner */}
        {isSyncing && (
          <View className="bg-blue-50 border-b border-blue-200 px-6 py-3">
            <View className="flex-row items-center gap-3">
              <RefreshCw color="#2563eb" size={16} />
              <View className="flex-1">
                <Text className="text-sm text-blue-700 font-medium">
                  Syncing with Google Drive...
                </Text>
                <Text className="text-xs text-blue-600">
                  Please wait while we sync your notes
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          // Empty State
          <View className="flex-1 items-center justify-center px-6">
            <FileText color="#9ca3af" size={64} />
            <Text className="text-2xl font-bold text-gray-900 mt-6 mb-2">
              No Notes Yet
            </Text>
            <Text className="text-base text-gray-600 text-center mb-8">
              Start your journaling journey by creating your first note
            </Text>
            <TouchableOpacity
              className="flex-row items-center gap-2 bg-blue-600 px-8 py-4 rounded-xl shadow-lg active:opacity-80"
              onPress={() => router.push("/note-editor")}
            >
              <Plus color="white" size={20} />
              <Text className="text-lg font-semibold text-white">
                Create First Note
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView className="flex-1 px-6 py-4">
            {notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-4"
                onPress={() => router.push(`/note-viewer?id=${note.id}`)}
                activeOpacity={0.7}
              >
                {/* Note Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {note.title || "Untitled"}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Clock color="#6b7280" size={14} />
                      <Text className="text-xs text-gray-600">
                        {formatDate(note.updatedAt)}
                      </Text>
                    </View>
                  </View>

                  {/* Sync Status Badge */}
                  <View
                    className={`px-2 py-1 rounded-md ${
                      note.isSynced ? "bg-green-100" : "bg-orange-100"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        note.isSynced ? "text-green-700" : "text-orange-700"
                      }`}
                    >
                      {note.isSynced ? "✓ Synced" : "⏳ Local"}
                    </Text>
                  </View>
                </View>

                {/* Note Preview */}
                <Text className="text-sm text-gray-600 leading-relaxed mb-4">
                  {getPreview(note.content)}
                </Text>

                {/* Action Buttons */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg active:opacity-70"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`/note-viewer?id=${note.id}`);
                    }}
                  >
                    <Eye color="#2563eb" size={16} />
                    <Text className="text-sm font-semibold text-blue-600">
                      View
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg active:opacity-70"
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    <Trash2 color="#dc2626" size={16} />
                    <Text className="text-sm font-semibold text-red-600">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Floating Action Button */}
        {notes.length > 0 && (
          <View className="absolute bottom-6 right-6">
            <TouchableOpacity
              className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-2xl active:opacity-80"
              onPress={() => router.push("/note-editor")}
            >
              <Plus color="white" size={28} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
