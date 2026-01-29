// Desktop Landing Page - DailyNote POC
// App-like design with clean, attractive interface

import { BookOpen, Cloud, Smartphone, Lock, RefreshCw } from 'lucide-react';

interface LandingPageProps {
  onCreateNote: () => void;
}

export default function LandingPage({ onCreateNote }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">DailyNote</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">v1.0 POC</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
            Cross-Platform Journaling App
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Catat Hari Anda,<br />
            <span className="text-blue-600">Tersimpan Aman di Cloud</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Aplikasi journaling sederhana dengan sinkronisasi otomatis ke Google Drive. 
            Akses catatan Anda dari desktop atau mobile, kapan saja.
          </p>

          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            Mulai Menulis Sekarang
          </button>
        </div>

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 mb-16 max-w-4xl mx-auto">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
            <div className="text-center space-y-3">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
              <p className="text-gray-500 font-medium">App Preview</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Feature 1 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cloud className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sinkronisasi Otomatis
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Semua catatan tersimpan otomatis ke Google Drive dalam format TXT. 
                  Data Anda aman dan dapat diakses dari berbagai device.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Multi-Platform
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Gunakan di mobile (iOS & Android) atau desktop (Windows, Mac, Linux). 
                  Satu aplikasi untuk semua perangkat Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mode Offline
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Tetap produktif tanpa koneksi internet. Catatan disimpan lokal 
                  dan sinkronisasi otomatis saat kembali online.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aman & Private
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Login dengan Google OAuth. Data terenkripsi dan tersimpan 
                  di Google Drive pribadi Anda.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Cara Menggunakan
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">
                1
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Login dengan Google
              </h3>
              <p className="text-gray-600 text-sm">
                Autentikasi menggunakan akun Google untuk akses ke Drive
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">
                2
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tulis Catatan Harian
              </h3>
              <p className="text-gray-600 text-sm">
                Buat catatan dengan timestamp otomatis dan dukungan markdown
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg shadow-blue-600/30">
                3
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sync Otomatis
              </h3>
              <p className="text-gray-600 text-sm">
                Catatan tersimpan otomatis dan tersedia di semua device Anda
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">Teknologi yang Digunakan</h2>
            <p className="text-gray-400">Dibangun dengan stack modern dan reliable</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3">
            {['React Native', 'Electron', 'TypeScript', 'Google Drive API', 'Expo', 'OAuth 2.0'].map((tech) => (
              <span
                key={tech}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <div className="bg-blue-600 py-12">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Siap Mencatat Hari Anda?
          </h2>
          <p className="text-blue-100 mb-6 text-lg">
            Mulai journaling dengan DailyNote sekarang
          </p>
          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <BookOpen className="w-5 h-5" />
            Mulai Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}