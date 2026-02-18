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
  const [localFolderPath, setLocalFolderPath] = useState<string | null>(localStorage.getItem("dailynote-local-path"));

  // Langsung cek authentication saat inisialisasi
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      const tokensLoaded = await GoogleAuth.loadTokens();
      if (tokensLoaded) {
        setIsAuthenticated(true);
      }
    };
    initAuth();
  }, []);

  // Notes state
  const [notes, setNotes] = useState<Note[]>([]);

  // Load notes when localFolderPath is set
  useEffect(() => {
    if (localFolderPath) {
      loadNotesFromFS();
    }
  }, [localFolderPath]);

  const loadNotesFromFS = async () => {
    if (!localFolderPath) return;
    try {
      const fsNotes = await window.electronAPI.fileSystem.readNotes(localFolderPath);
      setNotes(getNotesSorted(fsNotes));
    } catch (error) {
      console.error("Failed to load notes from FS:", error);
      toast.error("Gagal membaca folder penyimpanan");
    }
  };

  const handleSelectFolder = async () => {
    const path = await window.electronAPI.fileSystem.selectFolder();
    if (path) {
      setLocalFolderPath(path);
      localStorage.setItem("dailynote-local-path", path);
      toast.success("Lokasi penyimpanan diatur", {
        description: path
      });
      
      // Jika ada catatan di localStorage lama, tawarkan migrasi atau biarkan saja
      // Untuk saat ini kita prioritaskan folder baru
    }
  };

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

      // Merge Logic (Remote + Local FS)
      // Remote is secondary if local exists, but we merge for initial sync
      const merged = [...notes, ...remoteNotes].reduce((acc, note) => {
        const existing = acc.find((n) => n.id === note.id);
        if (!existing) {
          acc.push(note);
        } else if (new Date(note.updatedAt) > new Date(existing.updatedAt)) {
          acc = acc.map((n) => (n.id === note.id ? note : n));
        }
        return acc;
      }, [] as Note[]);

      await saveNotesToStorage(merged);
      setLastSyncTime(new Date());
      toast.success("Synced with Google Drive");
    } catch (error) {
      console.error("Drive init error:", error);
      toast.error("Failed to sync with Google Drive");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAutoSync = async () => {
    if (isSyncing || !isAuthenticated || !userFolderId) {
      return;
    }

    try {
      setIsSyncing(true);
      // 0. Refresh from FS to detect manual deletions/changes
      const currentLocalNotes = await refreshNotesFromFS();

      // 1. Upload unsynced local notes FIRST
      const unsyncedToUpload = currentLocalNotes.filter((n) => !n.isSynced);
      const justUploadedIds = new Set<string>();
      let updatedNotesAfterUpload = [...notes];

      if (unsyncedToUpload.length > 0) {
        toast.info("Syncing offline notes...", {
          description: `${unsyncedToUpload.length} notes pending upload`,
        });

        for (const note of unsyncedToUpload) {
          try {
            const driveFileId = await window.electronAPI.googleDrive.uploadNote(
              note,
              userFolderId,
            );
            
            // Update local note status directly in our temporary array
            // so subsequent merge uses the correct state
            updatedNotesAfterUpload = updatedNotesAfterUpload.map((n) => 
              n.id === note.id ? { ...n, driveFileId, isSynced: true } : n
            );
            
            justUploadedIds.add(note.id);
            console.log(`✅ Synced: ${note.title}`);
          } catch (err) {
            console.error(`❌ Failed to auto-upload ${note.title}:`, err);
          }
        }
        
        // Update state with successful uploads before proceeding
        if (justUploadedIds.size > 0) {
           setNotes(updatedNotesAfterUpload);
           saveNotesToStorage(getNotesSorted(updatedNotesAfterUpload));
        }
      }

      // 2. Download remote notes
      const remoteNotes = await window.electronAPI.googleDrive.downloadNotes(userFolderId!);

      // 3. Handle Manual Deletions (Supervisor Directive: Restore from Drive)
      // Jika note ada di drive tapi tidak ada di local FS, kita DOWNLOAD ulang.
      // KECUALI jika note tersebut ada di suppression list (berarti baru saja dihapus via app)
      const suppressedIds = JSON.parse(localStorage.getItem("dailynote-suppressed-ids") || "[]");
      const localIds = new Set(currentLocalNotes.map(n => n.id));
      
      const remoteToRestore = remoteNotes.filter(rn => !localIds.has(rn.id) && !suppressedIds.includes(rn.id));
      
      if (remoteToRestore.length > 0) {
        console.log(`📥 Restoring ${remoteToRestore.length} notes missing from local folder`);
      }

      // Merge: remote notes + unsynced local notes
      // Logic: Remote is priority, tapi abaikan yang di-suppress
      const filteredRemote = remoteNotes.filter(rn => !suppressedIds.includes(rn.id));
      
      const merged = [...filteredRemote, ...unsyncedToUpload].reduce((acc, note) => {
        const existing = acc.find((n) => n.id === note.id);
        if (!existing) {
          acc.push(note);
        } else if (new Date(note.updatedAt) > new Date(existing.updatedAt)) {
          acc = acc.map((n) => (n.id === note.id ? note : n));
        }
        return acc;
      }, [] as Note[]);

      // Check if there are changes
      const currentNotesSorted = getNotesSorted(notes);
      const mergedSorted = getNotesSorted(merged);
      const hasChanges = JSON.stringify(currentNotesSorted) !== JSON.stringify(mergedSorted);

      if (hasChanges) {
        await saveNotesToStorage(mergedSorted);
        setLastSyncTime(new Date());
        toast.success("Synced with Google Drive");
      } else {
        setLastSyncTime(new Date());
      }
    } catch (error) {
      console.error("❌ Auto-sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const refreshNotesFromFS = async () => {
    if (!localFolderPath) return notes;
    try {
      const fsNotes = await window.electronAPI.fileSystem.readNotes(localFolderPath);
      const sorted = getNotesSorted(fsNotes);
      setNotes(sorted);
      return sorted;
    } catch (e) {
      console.error("Failed to refresh notes from FS:", e);
      return notes;
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

  // Save to File System and update state
  const saveNotesToStorage = async (updatedNotes: Note[]) => {
    // Detect deletions: notes that are in state but not in updatedNotes
    const deletedIds = notes
      .filter(n => !updatedNotes.find(un => un.id === n.id))
      .map(n => n.id);

    setNotes(updatedNotes);
    
    if (localFolderPath) {
      // Delete removed notes
      for (const id of deletedIds) {
        await window.electronAPI.fileSystem.deleteNote(localFolderPath, id);
      }
      
      // Write/Update remaining notes
      for (const note of updatedNotes) {
        await window.electronAPI.fileSystem.writeNote(localFolderPath, note);
      }
    }
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
    updatedNotes[existingIndex] = note;
  } else {
    // Create new
    updatedNotes = [note, ...notes];
  }

  // ✅ PERBAIKAN: JANGAN CLOSE EDITOR DULU
  // Save to local FS first
  await saveNotesToStorage(getNotesSorted(updatedNotes));

  // ✅ VARIABLE UNTUK TRACK NOTE YANG AKAN DI-VIEW
  let finalNote = note;

  // Sync to Google Drive
  if (userFolderId) {
    try {
      const driveFileId = await window.electronAPI.googleDrive.uploadNote(
        note,
        userFolderId,
      );
      
      // ✅ UPDATE NOTE DENGAN DRIVE FILE ID
      finalNote = { ...note, driveFileId, isSynced: true };
      
      const updatedWithSync = updatedNotes.map((n) =>
        n.id === note.id ? finalNote : n,
      );
      saveNotesToStorage(getNotesSorted(updatedWithSync));
      toast.success("Synced to Google Drive");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to sync to Google Drive");
      // ✅ JIKA GAGAL SYNC, TETAP GUNAKAN NOTE ORIGINAL
      finalNote = { ...note, isSynced: false };
    }
  }

  // ✅ CLOSE EDITOR DAN BUKA VIEWER SETELAH SYNC SELESAI
  setEditingNote(null);

  if (isEditingExisting) {
    setViewingNote(finalNote); // ✅ GUNAKAN FINAL NOTE (SUDAH UPDATE)
    setCurrentView("viewer");
  } else {
    setCurrentView("notes");
  }
};

  const handleDeleteNote = async (noteId: string) => {
    // 1. Add to suppression list immediately
    const suppressed = JSON.parse(localStorage.getItem("dailynote-suppressed-ids") || "[]");
    localStorage.setItem("dailynote-suppressed-ids", JSON.stringify([...suppressed, noteId]));

    const noteToDelete = notes.find((n) => n.id === noteId);
    const updatedNotes = deleteNote(notes, noteId);
    await saveNotesToStorage(updatedNotes);

    // 2. Delete from local file system
    if (localFolderPath) {
      await window.electronAPI.fileSystem.deleteNote(localFolderPath, noteId);
    }

    // 3. Delete from Google Drive if it has driveFileId
    if (noteToDelete?.driveFileId && userFolderId) {
      try {
        await window.electronAPI.googleDrive.deleteNote(
          noteToDelete.driveFileId,
        );
        
        // 4. Clean up suppression list on success
        const currentSuppressed = JSON.parse(localStorage.getItem("dailynote-suppressed-ids") || "[]");
        localStorage.setItem("dailynote-suppressed-ids", JSON.stringify(currentSuppressed.filter((id: string) => id !== noteId)));
        
        toast.success("Deleted from Google Drive");
      } catch (error) {
        console.error("Delete from Drive error:", error);
        toast.error("Failed to delete from Google Drive, will stay suppressed from sync");
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
            onLogout={handleLogout}
            onSelectFolder={handleSelectFolder}
            storagePath={localFolderPath}
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
              onLogout={handleLogout}
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
