import { useState } from 'react'
import LandingPage from './components/LandingPage'
import NoteEditor from './components/NoteEditor'

type View = 'landing' | 'editor';

function App() {
  const [currentView, setCurrentView] = useState<View>('landing');

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-blue-500 to-blue-700 py-4 px-6 text-center shadow-md">
        <h1 className="text-2xl font-bold text-white m-0">
          📝 DailyNote POC - Desktop
        </h1>
        <p className="text-sm text-blue-100 mt-1 m-0">
          Cross-platform journaling with shared business logic
        </p>
        {currentView === 'editor' && (
          <button 
            onClick={() => setCurrentView('landing')}
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/20 text-white border border-white/30 px-4 py-2 rounded-md text-sm font-semibold hover:bg-white/30 hover:border-white/50 transition-all"
          >
            ← Back to Home
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-auto">
        {currentView === 'landing' ? (
          <LandingPage onCreateNote={() => setCurrentView('editor')} />
        ) : (
          <NoteEditor />
        )}
      </div>
    </div>
  )
}

export default App
