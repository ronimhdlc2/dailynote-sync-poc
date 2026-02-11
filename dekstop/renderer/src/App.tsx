import { useState, useEffect, useRef } from "react";
import LandingPage from "./components/LandingPage";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import NoteViewer from "./components/NoteViewer";
import type { Note } from "shared/models/note";
import { getNotesSorted, deleteNote } from "shared/core/note-engine";
import { Toaster, toast } from "sonner";
import AuthScreen from "./components/AuthScreen";
import { GoogleAuth } from "../../services/google-auth";

type View = "landing" | "notes" | "viewer" | "editor";

function App() {
  const [currentView, setCurrentView] = useState<View>("landing");
  const [viewingNote, setViewingNote] = useState<Note | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [userFolderId, setUserFolderId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const isInitializing = useRef(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Langsung cek authentication saat inisialisasi
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return GoogleAuth.loadTokens();
  });

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

  // Initialize Google Drive when authenticated
  useEffect(() => {
    if (isAuthenticated && !isInitializing.current) {
      isInitializing.current = true;
      initializeDrive();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Only setup interval if authenticated and folder is ready
    if (!isAuthenticated || !userFolderId) {
      return;
    }

    // Auto sync
    const syncInterval = setInterval(
      () => {
        handleAutoSync();
      },
      10 * 60 * 1000, // 10 minutes
    );

    // Cleanup interval on unmount or when dependencies change
    return () => {
      clearInterval(syncInterval);
    };
  }, [isAuthenticated, userFolderId, notes]); // Re-setup if these change

  useEffect(() => {
    // Only setup if authenticated
    if (!isAuthenticated || !userFolderId) {
      return;
    }

    const handleFocus = () => {
      handleAutoSync();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated, userFolderId]);

  const initializeDrive = async () => {
    try {
      setIsSyncing(true);
      await window.electronAPI.googleDrive.init();

      const user = await GoogleAuth.getCurrentUser();
      if (!user) return;

      const folderId = await window.electronAPI.googleDrive.ensureFolder(
        user.email,
      );
      setUserFolderId(folderId);

      const remoteNotes =
        await window.electronAPI.googleDrive.downloadNotes(folderId);

      // Merge with local notes (latest timestamp wins)
      const merged = [...notes, ...remoteNotes].reduce((acc, note) => {
        const existing = acc.find((n) => n.id === note.id);
        if (!existing) {
          acc.push(note);
        } else if (new Date(note.updatedAt) > new Date(existing.updatedAt)) {
          acc = acc.map((n) => (n.id === note.id ? note : n));
        }
        return acc;
      }, [] as Note[]);

      saveNotesToStorage(merged);
      setLastSyncTime(new Date())
      toast.success("Synced with Google Drive");
    } catch (error) {
      console.error("Drive init error:", error);
      toast.error("Failed to sync with Google Drive");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSync = async () => {
    // Skip if already syncing or not authenticated
    if (isSyncing || !isAuthenticated || !userFolderId) {
      return;
    }

    try {
      setIsSyncing(true);

      // Download remote notes
      const remoteNotes =
        await window.electronAPI.googleDrive.downloadNotes(userFolderId);

      // Merge strategy: Remote wins for existing, keep local-only
      const localNotes = notes;
      const remoteIds = new Set(remoteNotes.map((n) => n.id));
      const localOnlyNotes = localNotes.filter((n) => !remoteIds.has(n.id));

      // Combine remote + local-only
      const merged = [...remoteNotes, ...localOnlyNotes];

      // Check if there are changes
      const hasChanges =
        JSON.stringify(getNotesSorted(notes)) !==
        JSON.stringify(getNotesSorted(merged));

      if (hasChanges) {
        saveNotesToStorage(getNotesSorted(merged));
        setLastSyncTime(new Date()); // ← Add this
        toast.success("Synced with Google Drive");
      } else {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error("❌ Auto-sync error:", error);
      // Don't show error toast for auto-sync to avoid annoying user
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      toast.success("Successfully logged out", {
        description: "See you next time!",
      });

      // Small delay to show toast before state changes
      await new Promise((resolve) => setTimeout(resolve, 1500));

      GoogleAuth.signOut();
      setIsAuthenticated(false);
      // Clear any cached data if needed
      setNotes([]);
      setUserFolderId(null);
      setCurrentView("landing");
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, still logout locally
      toast.info("Logged out", {
        description: "Session ended",
      });
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsAuthenticated(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

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

  const handleSaveNote = async (note: Note) => {
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

    // Sync to Google Drive
    if (userFolderId) {
      try {
        const driveFileId = await window.electronAPI.googleDrive.uploadNote(
          note,
          userFolderId,
        );
        // Update note with driveFileId
        const noteWithDriveId = { ...note, driveFileId, isSynced: true };
        const updatedWithSync = updatedNotes.map((n) =>
          n.id === note.id ? noteWithDriveId : n,
        );
        saveNotesToStorage(getNotesSorted(updatedWithSync));
        toast.success("Synced to Google Drive");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to sync to Google Drive");
      }
    }

    if (isEditingExisting) {
      setViewingNote(note);
      setCurrentView("viewer");
    } else {
      setCurrentView("notes");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find((n) => n.id === noteId);
    const updatedNotes = deleteNote(notes, noteId);
    saveNotesToStorage(updatedNotes);

    // Delete from Google Drive if it has driveFileId
    if (noteToDelete?.driveFileId && userFolderId) {
      try {
        await window.electronAPI.googleDrive.deleteNote(
          noteToDelete.driveFileId,
        );
        toast.success("Deleted from Google Drive");
      } catch (error) {
        console.error("Delete from Drive error:", error);
        toast.error("Failed to delete from Google Drive");
      }
    }
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
          <button
            onClick={handleLogout}
            className="cursor-pointer absolute top-4 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Logout
          </button>
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sync Loading Banner */}
            {isSyncing && (
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="flex-1">
                    <p className="text-sm text-blue-700 font-medium">
                      Syncing with Google Drive...
                    </p>
                    <p className="text-xs text-blue-600">
                      Please wait while we sync your notes
                    </p>
                  </div>
                </div>
              </div>
            )}
            <NotesList
              notes={notes}
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onBack={handleBackToLanding}
              onRefresh={handleAutoSync}
              isSyncing={isSyncing}
              lastSyncTime={lastSyncTime}
            />
          </div>
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
