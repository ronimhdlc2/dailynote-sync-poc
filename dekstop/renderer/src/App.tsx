import { useState } from "react";
import LandingPage from "./components/LandingPage";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import NoteViewer from "./components/NoteViewer";
import type { Note } from "shared/models/note";
import { getNotesSorted, deleteNote } from "shared/core/note-engine";
import { Toaster } from "sonner";

type View = "landing" | "notes" | "viewer" | "editor";

function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  // Load notes from localStorage
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem("dailynote-notes");
      // Ensure notes are sorted on load
      return saved ? getNotesSorted(JSON.parse(saved)) : [];
    } catch (e) {
      console.error("Failed to load notes:", e);
      return [];
    }
  });

  // Save to localStorage whenever notes change
  const saveNotesToStorage = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("dailynote-notes", JSON.stringify(updatedNotes));
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setCurrentView("editor");
  };

  const handleEditNote = (note: Note) => {
    handleViewNote(note);
  };

  const handleSaveNote = (note: Note) => {
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    let updatedNotes;
    const isEditingExisting = existingIndex >= 0;

    if (existingIndex >= 0) {
      // Update existing
      updatedNotes = [...notes];
      // Note: note.updatedAt is already updated by the Editor (using note-engine)
      updatedNotes[existingIndex] = note;
    } else {
      // Create new
      updatedNotes = [note, ...notes];
    }

    // Sort notes ensures the most recently updated note is at the top
    saveNotesToStorage(getNotesSorted(updatedNotes));
    setEditingNote(null);

    if (isEditingExisting) {
      setViewingNote(note);
      setCurrentView("viewer");
    } else {
      setCurrentView("notes");
    }
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = deleteNote(notes, noteId);
    saveNotesToStorage(updatedNotes);
  };

  const handleBackToNotes = () => {
    setEditingNote(null);
    setCurrentView("notes");
  };

  const handleBackToLanding = () => {
    setCurrentView("landing");
  };

  // Dynamic header title
  const getHeaderTitle = () => {
    switch (currentView) {
      case "landing":
        return "📝 DailyNote POC - Desktop";
      case "notes":
        return "📚 My Notes";
      case "editor":
        return editingNote ? "✏️ Edit Note" : "📝 Create Note";
      default:
        return "📝 DailyNote POC";
    }
  };

  const getHeaderSubtitle = () => {
    switch (currentView) {
      case "landing":
        return "Cross-platform journaling with shared business logic";
      case "notes":
        return "All your daily notes in one place";
      case "editor":
        return editingNote
          ? "Update your thoughts"
          : "Write your daily thoughts";
      default:
        return "";
    }
  };

  const handleViewNote = (note: Note) => {
    setViewingNote(note);
    setCurrentView("viewer");
  };

  const handleEditFromViewer = () => {
    if (viewingNote) {
      setEditingNote(viewingNote);
      setViewingNote(null);
      setCurrentView("editor");
    }
  };

  const handleCloseViewer = () => {
    setViewingNote(null);
    setCurrentView("notes");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        duration={3000}
        toastOptions={{
          style: {
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            padding: "16px",
          },
          className: "shadow-lg",
        }}
      />
      {/* Header - Only show on landing view */}
      {currentView === "landing" && (
        <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 py-4 px-6 text-center shadow-md">
          <h1 className="text-2xl font-bold text-white m-0">
            {getHeaderTitle()}
          </h1>
          <p className="text-sm text-blue-100 mt-1 m-0">
            {getHeaderSubtitle()}
          </p>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentView === "landing" && (
          <LandingPage
            onCreateNote={handleCreateNote}
            onViewNotes={() => setCurrentView("notes")}
          />
        )}

        {currentView === "notes" && (
          <NotesList
            notes={notes}
            onCreateNote={handleCreateNote}
            onEditNote={handleEditNote}
            onDeleteNote={handleDeleteNote}
            onBack={handleBackToLanding}
          />
        )}

        {currentView === "viewer" && viewingNote && (
          <NoteViewer
            note={viewingNote}
            onClose={handleCloseViewer}
            onEdit={handleEditFromViewer}
          />
        )}

        {currentView === "editor" && (
          <NoteEditor
            key={editingNote?.id || "new-note"}
            note={editingNote}
            onSave={handleSaveNote}
            onCancel={handleBackToNotes}
          />
        )}
      </div>
    </div>
  );
}

export default App;
