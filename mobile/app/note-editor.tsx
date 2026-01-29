/**
 * Add/Edit Note Screen (Mobile)
 * Redesigned to match landing page and desktop editor theme
 */

import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Save, X, Edit3, Clock, CheckCircle2, AlertCircle } from 'lucide-react-native';

// ✨ Import shared business logic
import { createNote, updateNoteContent, updateNoteTitle, getNoteFilename } from 'shared/core/note-engine';
import { Note } from 'shared/models/note';

export default function AddNote() {
  const [note, setNote] = useState<Note>(() => createNote());
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const router = useRouter();

  const handleContentChange = (text: string) => {
    const updated = updateNoteContent(note, text);
    setNote(updated);
  };

  const handleTitleChange = (text: string) => {
    const updated = updateNoteTitle(note, text);
    setNote(updated);
  };

  const handleSave = () => {
    if (!note.content.trim()) {
      Alert.alert('Error', 'Please write something before saving!');
      return;
    }

    console.log('📝 Saving note:', {
      filename: getNoteFilename(note),
      note: note
    });

    Alert.alert(
      'Saved! 🎉',
      `Note "${note.title}" saved locally.\n\nFilename: ${getNoteFilename(note)}\n\nNext: We'll add Google Drive sync!`,
      [
        {
          text: 'OK',
          onPress: () => {
            setNote(createNote());
            router.back();
          }
        }
      ]
    );
  };

  const handleCancel = () => {
    if (!note.content.trim()) {
      router.back();
      return;
    }
    
    Alert.alert(
      'Discard changes?',
      'Are you sure you want to discard this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  };

  return (
    <View className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <View className="px-6 py-4 pt-12 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-lg"
            >
              <BookOpen color="white" size={20} />
            </LinearGradient>
            <View>
              <Text className="text-xl font-bold text-gray-900">DailyNote</Text>
              <Text className="text-sm text-gray-500">Editor</Text>
            </View>
          </View>
          
          {/* Metadata badges */}
          <View className="flex-col items-end gap-2">
            <View className="flex-row items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
              <Clock color="#6b7280" size={14} />
              <Text className="text-xs text-gray-600 font-medium">
                {new Date(note.createdAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            <View className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${
              note.isSynced 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              {note.isSynced ? (
                <>
                  <CheckCircle2 color="#16a34a" size={14} />
                  <Text className="text-xs text-green-700 font-medium">Synced</Text>
                </>
              ) : (
                <>
                  <AlertCircle color="#ea580c" size={14} />
                  <Text className="text-xs text-orange-700 font-medium">Not synced</Text>
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
                style={{ position: 'absolute', right: 8, top: 12 }} 
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
            Tap title to edit • ID: <Text className="font-mono text-xs">{note.id}</Text>
          </Text>
        </View>

        {/* Content Editor Card */}
        <View className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-4" style={{ minHeight: 400 }}>
          <View className="flex-row items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <View className="flex-row items-center gap-2">
              <BookOpen color="#6b7280" size={20} />
              <Text className="text-sm font-semibold text-gray-700">Your Daily Note</Text>
            </View>
            <Text className="text-xs text-gray-500">
              {note.content.length} characters
            </Text>
          </View>
          
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
        </View>
      </ScrollView>

      {/* Action Bar */}
      <View className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <View className="px-6 py-4">
          {/* Filename info */}
          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-sm text-gray-600 font-medium">Filename:</Text>
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
              <Text className="text-sm text-gray-700 font-semibold">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-[2] flex-row items-center justify-center gap-2 px-8 py-4 rounded-xl ${
                note.content.trim() 
                  ? 'bg-blue-600 active:opacity-80' 
                  : 'bg-gray-300'
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
  );
}