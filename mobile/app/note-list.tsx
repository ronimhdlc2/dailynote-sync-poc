// mobile/app/notes.tsx

/**
 * Notes List Screen (Mobile)
 * Display all notes in chronological order (newest first)
 */

import React, { useState } from "react";
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
} from "lucide-react-native";
import type { Note } from "shared/models/note";
import { GoogleAuth } from "../services/google-auth";

import { NoteStorage } from "../services/storage";
import { useFocusEffect } from "expo-router";

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadNotes();
    }, []),
  );

  const loadNotes = async () => {
    const loaded = await NoteStorage.getNotes();
    setNotes(loaded);
  };

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
            await NoteStorage.deleteNote(noteId);
            await loadNotes();
            Toast.show({
              type: "success",
              text1: "Note deleted",
              text2: `"${note?.title}" has been deleted`,
              position: "top",
              visibilityTime: 3000,
              topOffset: 60,
            });
          },
        },
      ],
    );
  };

  const formatDate = (isoString: string) => {
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
  };

  const getPreview = (content: string) => {
    // Remove markdown and get first 100 characters
    const plain = content
      .replace(/[*_~`#]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return plain.length > 100 ? plain.substring(0, 100) + "..." : plain;
  };

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await GoogleAuth.signOut();
          router.replace("/auth");
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

              <View className="px-3 py-1.5 bg-blue-100 rounded-lg">
                <Text className="text-sm font-semibold text-blue-700">
                  {notes.length} {notes.length === 1 ? "note" : "notes"}
                </Text>
              </View>

              <TouchableOpacity onPress={handleLogout}>
                <Text className="text-sm text-red-600 font-semibold">
                  Logout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

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
              <TouchableOpacity // ✅ Ubah View jadi TouchableOpacity
                key={note.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 mb-4"
                onPress={() => router.push(`/note-viewer?id=${note.id}`)} // ✅ Klik card = view note
                activeOpacity={0.7}
              >
                {/* Note Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-bold text-gray-900 mb-1">
                      {note.title}
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
                      // ✅ Tambahkan stopPropagation
                      e.stopPropagation();
                      router.push(`/note-viewer?id=${note.id}`); // ✅ View dulu
                    }}
                  >
                    <Eye color="#2563eb" size={16} />
                    <Text className="text-sm font-semibold text-blue-600">
                      View
                    </Text>
                    {/* ✅ Ubah text */}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg active:opacity-70"
                    onPress={(e) => {
                      // ✅ Tambahkan stopPropagation
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
              </TouchableOpacity> // ✅ Tutup TouchableOpacity
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
