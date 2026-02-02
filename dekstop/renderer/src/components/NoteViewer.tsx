// Desktop Note Viewer Component - Read-Only Mode
import { BookOpen, X, Edit3, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { Note } from "shared/models/note";
import { getNoteFilename, formatNoteDate } from "shared/core/note-engine";

interface NoteViewerProps {
  note: Note;
  onClose: () => void;
  onEdit?: () => void;
}

export default function NoteViewer({ note, onClose, onEdit }: NoteViewerProps) {
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
              <span className="text-sm text-gray-500 ml-2">View Note</span>
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">
                {formatNoteDate(note.updatedAt)}
              </span>
            </div>
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

      {/* Main Viewer Area - Scrollable */}
      <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto p-6 gap-4 overflow-y-auto">
        {/* Title Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
          <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Created: {formatNoteDate(note.createdAt)}</span>
            </div>
            <span>•</span>
            <span>ID: <span className="font-mono text-xs">{note.id}</span></span>
          </div>
        </div>

        {/* Content Card - Scrollable */}
        <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">Content</span>
            </div>
            <span className="text-xs text-gray-500">{note.content.length} characters</span>
          </div>

          {/* Read-only content - Preserve whitespace and line breaks */}
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed text-gray-800 bg-transparent border-none p-0 m-0">
              {note.content || "No content"}
            </pre>
          </div>
        </div>

        {/* Filename Info */}
        <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Filename:</span>
            <span className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">
              {getNoteFilename(note)}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl w-full mx-auto px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-xl text-sm text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            <X className="w-4 h-4" />
            Close
          </button>

          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-sm text-white font-bold hover:from-blue-700 hover:to-blue-800 hover:shadow-lg hover:shadow-blue-600/30 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Note
            </button>
          )}
        </div>
      </div>
    </div>
  );
}