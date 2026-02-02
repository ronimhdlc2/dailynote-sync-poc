// Desktop Notes List Component
// Display all notes in chronological order (newest first)

import {
  BookOpen,
  Plus,
  Edit3,
  Trash2,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import type { Note } from "shared/models/note";
import { getNotePreview, formatNoteDate, getNoteById } from "shared/core/note-engine";

interface NotesListProps {
  notes: Note[];
  onCreateNote: () => void;
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => void;
  onBack?: () => void;
}

export default function NotesList({
  notes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onBack,
}: NotesListProps) {
  
  const handleDeleteNote = (noteId: string) => {
    // Use shared logic for finding logic consistency
    const note = getNoteById(notes, noteId);
    if (note && confirm(`Are you sure you want to delete "${note.title}"?`)) {
      if (onDeleteNote) {
        onDeleteNote(noteId);
      }
    }
  };

  const handleEditNote = (note: Note) => {
    if (onEditNote) {
      onEditNote(note);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                title="Back to Landing"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">DailyNote</span>
              <span className="text-sm text-gray-500 ml-2">Your Notes</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-blue-100 rounded-lg">
              <span className="text-sm font-semibold text-blue-700">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
            </div>

            <button
              onClick={onCreateNote}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              New Note
            </button>
          </div>
        </div>
      </header>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full px-6">
            <FileText className="w-24 h-24 text-gray-300 mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              No Notes Yet
            </h2>
            <p className="text-lg text-gray-600 text-center mb-8 max-w-md">
              Start your journaling journey by creating your first note
            </p>
            <button
              onClick={onCreateNote}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              Create First Note
            </button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-6 py-6">
            <div className="grid gap-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow"
                >
                  {/* Note Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {note.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatNoteDate(note.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Sync Status Badge */}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                        note.isSynced
                          ? "bg-green-50 border border-green-200"
                          : "bg-orange-50 border border-orange-200"
                      }`}
                    >
                      {note.isSynced ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">
                            Synced
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-xs text-orange-700 font-medium">
                            Local only
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Note Preview */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 border-l-2 border-gray-200 pl-4">
                    {getNotePreview(note)}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleEditNote(note)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg text-sm font-semibold text-blue-600 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit Note
                    </button>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-semibold text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
