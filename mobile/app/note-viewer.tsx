import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { useState } from "react";
import React from "react";
import {
  BookOpen,
  X,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { Note } from "shared/models/note";
import { NoteStorage } from "../services/storage";
import { formatNoteDate, getNoteFilename } from "shared/core/note-engine";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";

export default function NoteViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        const loadNote = async () => {
          const existing = await NoteStorage.getNote(id);
          if (existing) {
            setNote(existing);
          } else {
            router.back();
          }
        };
        loadNote();
      }
    }, [id]),
  );

  if (!note) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </View>
    );
  }

  const handleEdit = () => {
    router.push(`/note-editor?id=${note.id}`);
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <LinearGradient
        colors={["#f8fafc", "#eff6ff", "#f8fafc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center">
                <BookOpen color="white" size={20} />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900">
                  DailyNote
                </Text>
                <Text className="text-xs text-gray-500">View Note</Text>
              </View>
            </View>

            {/* Sync Status */}
            <View
              className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
                note.isSynced
                  ? "bg-green-50 border border-green-200"
                  : "bg-orange-50 border border-orange-200"
              }`}
            >
              {note.isSynced ? (
                <>
                  <CheckCircle2 color="#16a34a" size={14} />
                  <Text className="text-xs text-green-700 font-medium">
                    Synced
                  </Text>
                </>
              ) : (
                <>
                  <AlertCircle color="#ea580c" size={14} />
                  <Text className="text-xs text-orange-700 font-medium">
                    Not synced
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView className="flex-1 px-4 py-4">
          {/* Title Card */}
          <View className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
            <Text className="text-2xl font-bold text-gray-900 mb-3">
              {note.title}
            </Text>
            <View className="flex-row items-center gap-2">
              <Clock color="#6b7280" size={14} />
              <Text className="text-xs text-gray-600">
                Created: {formatNoteDate(note.createdAt)}
              </Text>
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              ID: <Text className="font-mono">{note.id}</Text>
            </Text>
          </View>

          {/* Content Card */}
          <View className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <BookOpen color="#6b7280" size={16} />
                <Text className="text-sm font-semibold text-gray-700">
                  Content
                </Text>
              </View>
              <Text className="text-xs text-gray-500">
                {note.content.length} characters
              </Text>
            </View>

            <Markdown
              style={{
                body: { fontSize: 16, lineHeight: 24, color: "#1f2937" },
                heading1: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
                heading2: { fontSize: 20, fontWeight: "bold", marginBottom: 6 },
                strong: { fontWeight: "bold" },
                em: { fontStyle: "italic" },
                bullet_list: { marginVertical: 8 },
                ordered_list: { marginVertical: 8 },
                list_item: { marginVertical: 4 },
              }}
            >
              {note.content || "No content"}
            </Markdown>
          </View>

          {/* Filename Info */}
          <View className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 mb-4">
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-gray-600 font-medium">
                Filename:
              </Text>
              <Text className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200">
                {getNoteFilename(note)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="border-t border-gray-200 bg-white px-4 py-3">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 flex-row items-center justify-center gap-2 bg-white border border-gray-300 rounded-xl px-4 py-3"
            >
              <X color="#374151" size={16} />
              <Text className="text-sm text-gray-700 font-semibold">Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEdit}
              className="flex-1 flex-row items-center justify-center gap-2 bg-blue-600 rounded-xl px-4 py-3"
            >
              <Edit3 color="white" size={16} />
              <Text className="text-sm text-white font-bold">Edit Note</Text>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}
