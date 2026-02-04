/**
 * Add/Edit Note Screen (Mobile)
 * Redesigned to match landing page and desktop editor theme
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  BookOpen,
  Save,
  X,
  Edit3,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Markdown from "react-native-markdown-display";

// ✨ Import shared business logic
import {
  createNote,
  updateNoteContent,
  updateNoteTitle,
  getNoteFilename,
  validateNote,
} from "shared/core/note-engine";
import { Note } from "shared/models/note";
import { NoteStorage } from "../services/storage";
import { useLocalSearchParams } from "expo-router";
import Toast from 'react-native-toast-message';

export default function AddNote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [note, setNote] = useState<Note>(() => createNote());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isLoading, setIsLoading] = useState(!!id);
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);

  // Load existing note if id is present
  React.useEffect(() => {
    if (id) {
      const loadNote = async () => {
        const existing = await NoteStorage.getNote(id);
        if (existing) {
          setNote(existing);
        } else {
          Alert.alert("Error", "Note not found");
          router.back();
        }
        setIsLoading(false);
      };
      loadNote();
    }
  }, [id]);

  const handleContentChange = (text: string) => {
    const updated = updateNoteContent(note, text);
    setNote(updated);
  };

  const handleTitleChange = (text: string) => {
    const updated = updateNoteTitle(note, text);
    setNote(updated);
  };

  const handleSave = async () => {
  const validation = validateNote(note);
  if (!validation.valid) {
    Alert.alert('Validation Error', validation.error);
    return;
  }

  try {
    await NoteStorage.saveNote(note);
    
    // Toast untuk success feedback
    Toast.show({
  type: 'success',
  text1: 'Note saved successfully!',
  text2: `Filename: ${getNoteFilename(note)}`,
  position: 'bottom',
  visibilityTime: 3000,
  bottomOffset: 60,
});
    
    router.back(); 
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Failed to save note',
      text2: 'Please try again',
      position: 'top',
    });
    console.error(error);
  }
};

  const handleCancel = () => {
    // If it's a new note and has content, ask confirm
    // If it's an existing note and has changed? (Implementation simplifiction: check vs initial state would be better, but for now just check content)
    // For simplicity, if content exists and user cancels, confirm.

    if (note.content.trim() && !id) {
      // Only confirm for new notes or check dirty logic properly
      Alert.alert(
        "Discard changes?",
        "Are you sure you want to discard this note?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
      return;
    }
    router.back();
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="border-b border-gray-200 bg-white">
          <View className="px-6 py-4 pt-12 flex-row items-center justify-between">
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
                <Text className="text-sm text-gray-500">
                  {id ? "Edit Note" : "New Note"}
                </Text>
              </View>
            </View>

            {/* Metadata badges */}
            <View className="flex-col items-end gap-2">
              <View className="flex-row items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
                <Clock color="#6b7280" size={14} />
                <Text className="text-xs text-gray-600 font-medium">
                  {new Date(note.createdAt).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
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
        </View>

        <ScrollView className="flex-1 px-6 py-4">
          {/* Title Card */}
          <View className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4">
            {isEditingTitle ? (
              <View>
                <TextInput
                  className="text-3xl font-bold text-gray-900 pb-2 border-b-2 border-blue-500"
                  value={note.title}
                  onChangeText={handleTitleChange}
                  onBlur={() => setIsEditingTitle(false)}
                  autoFocus
                  placeholder="Untitled note..."
                  placeholderTextColor="#9ca3af"
                />
                <Edit3
                  color="#3b82f6"
                  size={20}
                  style={{ position: "absolute", right: 8, top: 12 }}
                />
              </View>
            ) : (
              <TouchableOpacity
                className="flex-row items-center gap-3"
                onPress={() => setIsEditingTitle(true)}
              >
                <Text className="text-3xl font-bold text-gray-900 flex-1">
                  {note.title}
                </Text>
                <Edit3 color="#9ca3af" size={20} />
              </TouchableOpacity>
            )}
            <Text className="text-sm text-gray-500 mt-2">
              Tap title to edit • ID:{" "}
              <Text className="font-mono text-xs">{note.id}</Text>
            </Text>
          </View>

          {/* Content Editor Card */}
          <View
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4"
            style={{ minHeight: 400 }}
          >
            <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <BookOpen color="#6b7280" size={20} />
                <Text className="text-sm font-semibold text-gray-700">
                  Your Daily Note
                </Text>
              </View>

              {/* Toggle Preview Button */}
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    showPreview
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      showPreview ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {showPreview ? "✏️ Edit" : "👁️ Preview"}
                  </Text>
                </TouchableOpacity>

                <Text className="text-xs text-gray-500">
                  {note.content.length} chars
                </Text>
              </View>
            </View>

            {/* Conditional Render: Editor or Preview */}
            {showPreview ? (
              <ScrollView style={{ minHeight: 300 }}>
                <Markdown
                  style={{
                    body: { fontSize: 16, lineHeight: 24, color: "#1f2937" },
                    heading1: {
                      fontSize: 24,
                      fontWeight: "bold",
                      marginBottom: 8,
                    },
                    heading2: {
                      fontSize: 20,
                      fontWeight: "bold",
                      marginBottom: 6,
                    },
                    strong: { fontWeight: "bold" },
                    em: { fontStyle: "italic" },
                    bullet_list: { marginVertical: 8 },
                    ordered_list: { marginVertical: 8 },
                    list_item: { marginVertical: 4 },
                  }}
                >
                  {note.content || "*No content to preview*"}
                </Markdown>
              </ScrollView>
            ) : (
              <TextInput
                className="text-base leading-relaxed text-gray-800"
                multiline
                placeholder={`Start writing your thoughts here...

You can use markdown formatting:
• **bold text** for emphasis
• *italic text* for subtle emphasis
• - bullet points for lists
• # Headings for structure

Write freely and let your thoughts flow...`}
                placeholderTextColor="#9ca3af"
                value={note.content}
                onChangeText={handleContentChange}
                textAlignVertical="top"
                style={{ minHeight: 300 }}
              />
            )}
          </View>
        </ScrollView>

        {/* Action Bar */}
        <View className="border-t border-gray-200 bg-white">
          <View className="px-6 py-4">
            {/* Filename info */}
            <View className="flex-row items-center gap-2 mb-4">
              <Text className="text-sm text-gray-600 font-medium">
                Filename:
              </Text>
              <Text className="font-mono text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                {getNoteFilename(note)}
              </Text>
            </View>

            {/* Action buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-2 px-6 py-4 bg-white border border-gray-300 rounded-xl active:opacity-70"
                onPress={handleCancel}
              >
                <X color="#374151" size={18} />
                <Text className="text-sm text-gray-700 font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-[2] flex-row items-center justify-center gap-2 px-8 py-4 rounded-xl ${
                  note.content.trim()
                    ? "bg-blue-600 active:opacity-80"
                    : "bg-gray-300"
                }`}
                onPress={handleSave}
                disabled={!note.content.trim()}
              >
                <Save color="white" size={18} />
                <Text className="text-sm text-white font-bold">Save Note</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
