// Desktop Note Editor Component
// Uses SAME shared logic as mobile app!
// Redesigned to match landing page theme

import { useState } from 'react';
import { createNote, updateNoteContent, updateNoteTitle, getNoteFilename } from 'shared/core/note-engine';
import type { Note } from 'shared/models/note';
import { BookOpen, Save, X, Edit3, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

// NoteEditor.tsx props interface
interface NoteEditorProps {
  note?: Note | null;           // Existing note untuk edit
  onSave?: (note: Note) => void;          // Callback setelah save
  onCancel?: () => void;        // Callback setelah cancel
}

export default function NoteEditor({ note: initialNote, onSave, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState<Note>(() => initialNote || createNote());
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Update internal state when prop changes (optional, but good for switching notes)
  // useEffect(() => {
  //   if (initialNote) setNote(initialNote);
  // }, [initialNote]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updated = updateNoteContent(note, e.target.value);
    setNote(updated);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const updated = updateNoteTitle(note, e.target.value);
    setNote(updated);
  };

  const handleSave = () => {
    if (!note.content.trim()) {
      alert('Please write something before saving!');
      return;
    }

    console.log('💾 Saving note:', {
      filename: getNoteFilename(note),
      note: note
    });

    // In a real app, we would save to disk/db here
    
    if (onSave) {
        onSave(note);
    }
  };

  const handleCancel = () => {
    if (note.content.trim() && note.content !== (initialNote?.content || '') && !confirm('Discard changes?')) {
      return;
    }
    
    if (onCancel) {
        onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">DailyNote</span>
              <span className="text-sm text-gray-500 ml-2">Editor</span>
            </div>
          </div>
          
          {/* Metadata badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">
                {new Date(note.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              note.isSynced 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-orange-50 border border-orange-200'
            }`}>
              {note.isSynced ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700 font-medium">Synced</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-xs text-orange-700 font-medium">Not synced</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 gap-4 overflow-hidden">
        {/* Title Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          {isEditingTitle ? (
            <div className="relative">
              <input
                type="text"
                className="text-3xl font-bold text-gray-900 border-none border-b-2 border-blue-500 pb-2 w-full outline-none bg-transparent"
                value={note.title}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                autoFocus
                placeholder="Untitled note..."
              />
              <Edit3 className="absolute right-2 top-3 w-5 h-5 text-blue-500" />
            </div>
          ) : (
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setIsEditingTitle(true)}
            >
              <h1 className="text-3xl font-bold text-gray-900 flex-1 group-hover:text-blue-600 transition-colors">
                {note.title}
              </h1>
              <Edit3 className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Click title to edit • ID: <span className="font-mono text-xs">{note.id}</span>
          </p>
        </div>

        {/* Content Editor Card */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-6 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Your Daily Note</span>
            </div>
            <span className="text-xs text-gray-500">
              {note.content.length} characters
            </span>
          </div>
          
          <textarea
            className="flex-1 w-full border-none outline-none text-base leading-relaxed text-gray-800 resize-none font-sans placeholder:text-gray-400"
            placeholder="Start writing your thoughts here...

You can use markdown formatting:
• **bold text** for emphasis
• *italic text* for subtle emphasis
• - bullet points for lists
• # Headings for structure

Write freely and let your thoughts flow..."
            value={note.content}
            onChange={handleContentChange}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl w-full mx-auto px-6 py-4 flex items-center justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Filename:</span>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {getNoteFilename(note)}
            </span>
          </div>
          
          {/* Right side - Actions */}
          <div className="flex gap-3">
            <button 
              onClick={handleCancel}
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            
            <button 
              onClick={handleSave}
              disabled={!note.content.trim()}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 border-none rounded-xl text-sm text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/30 transition-all disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Save className="w-4 h-4" />
              Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}