import { useState } from "react";
import LandingPage from "./components/LandingPage";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import type { Note } from "shared/models/note";
import { getNotesSorted, deleteNote } from "shared/core/note-engine";

type View = "landing" | "notes" | "editor";

function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
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
    setEditingNote(note);
    setCurrentView("editor");
  };

  const handleSaveNote = (note: Note) => {
    const existingIndex = notes.findIndex((n) => n.id === note.id);
    let updatedNotes;

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
    setCurrentView("notes");
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

  return (
    <div className="flex flex-col min-h-screen">
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

      <div className="flex-1 overflow-auto">
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
