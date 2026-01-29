import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Cloud, Smartphone, Lock, RefreshCw } from 'lucide-react-native';

export default function RootHome() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <View className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <View className="px-6 py-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <LinearGradient
              colors={['#2563eb', '#1d4ed8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-10 h-10 rounded-xl items-center justify-center shadow-lg"
            >
              <BookOpen color="white" size={20} />
            </LinearGradient>
            <Text className="text-xl font-bold text-gray-900">DailyNote</Text>
          </View>
          <Text className="text-sm text-gray-500 font-medium">v1.0 POC</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="px-6 py-8">
        {/* Hero */}
        <View className="items-center mb-12">
          <View className="flex-row items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6">
            <View className="w-2 h-2 bg-blue-600 rounded-full" />
            <Text className="text-sm font-medium text-blue-700">
              Cross-Platform Journaling App
            </Text>
          </View>
          
          <Text className="text-4xl font-bold text-gray-900 mb-4 text-center leading-tight">
            Catat Hari Anda,{'\n'}
            <Text className="text-blue-600">Tersimpan Aman di Cloud</Text>
          </Text>
          
          <Text className="text-lg text-gray-600 mb-6 text-center leading-relaxed px-4">
            Aplikasi journaling sederhana dengan sinkronisasi otomatis ke Google Drive. 
            Akses catatan Anda dari desktop atau mobile, kapan saja.
          </Text>

          <TouchableOpacity
            className="flex-row items-center gap-2 bg-blue-600 px-8 py-4 rounded-xl shadow-lg active:opacity-80"
            onPress={() => router.push('/add-note')}
          >
            <BookOpen color="white" size={20} />
            <Text className="text-lg font-semibold text-white">
              Mulai Menulis Sekarang
            </Text>
          </TouchableOpacity>
        </View>

        {/* Preview Card */}
        <View className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-12">
          <View className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 rounded-xl items-center justify-center border border-gray-200">
            <BookOpen color="#9ca3af" size={64} />
            <Text className="text-gray-500 font-medium mt-3">App Preview</Text>
          </View>
        </View>

        {/* Features Grid */}
        <View className="gap-6 mb-12">
          {/* Feature 1 */}
          <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <View className="flex-row items-start gap-4">
              <View className="w-12 h-12 bg-blue-100 rounded-lg items-center justify-center">
                <Cloud color="#2563eb" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Sinkronisasi Otomatis
                </Text>
                <Text className="text-sm text-gray-600 leading-relaxed">
                  Semua catatan tersimpan otomatis ke Google Drive dalam format TXT. 
                  Data Anda aman dan dapat diakses dari berbagai device.
                </Text>
              </View>
            </View>
          </View>

          {/* Feature 2 */}
          <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <View className="flex-row items-start gap-4">
              <View className="w-12 h-12 bg-green-100 rounded-lg items-center justify-center">
                <Smartphone color="#16a34a" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Multi-Platform
                </Text>
                <Text className="text-sm text-gray-600 leading-relaxed">
                  Gunakan di mobile (iOS & Android) atau desktop (Windows, Mac, Linux). 
                  Satu aplikasi untuk semua perangkat Anda.
                </Text>
              </View>
            </View>
          </View>

          {/* Feature 3 */}
          <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <View className="flex-row items-start gap-4">
              <View className="w-12 h-12 bg-purple-100 rounded-lg items-center justify-center">
                <RefreshCw color="#9333ea" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Mode Offline
                </Text>
                <Text className="text-sm text-gray-600 leading-relaxed">
                  Tetap produktif tanpa koneksi internet. Catatan disimpan lokal 
                  dan sinkronisasi otomatis saat kembali online.
                </Text>
              </View>
            </View>
          </View>

          {/* Feature 4 */}
          <View className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <View className="flex-row items-start gap-4">
              <View className="w-12 h-12 bg-orange-100 rounded-lg items-center justify-center">
                <Lock color="#ea580c" size={24} />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Aman & Private
                </Text>
                <Text className="text-sm text-gray-600 leading-relaxed">
                  Login dengan Google OAuth. Data terenkripsi dan tersimpan 
                  di Google Drive pribadi Anda.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
          <Text className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Cara Menggunakan
          </Text>
          
          <View className="gap-8">
            {/* Step 1 */}
            <View className="items-center">
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
              >
                <Text className="text-2xl font-bold text-white">1</Text>
              </LinearGradient>
              <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Login dengan Google
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Autentikasi menggunakan akun Google untuk akses ke Drive
              </Text>
            </View>

            {/* Step 2 */}
            <View className="items-center">
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
              >
                <Text className="text-2xl font-bold text-white">2</Text>
              </LinearGradient>
              <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Tulis Catatan Harian
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Buat catatan dengan timestamp otomatis dan dukungan markdown
              </Text>
            </View>

            {/* Step 3 */}
            <View className="items-center">
              <LinearGradient
                colors={['#2563eb', '#1d4ed8']}
                className="w-16 h-16 rounded-full items-center justify-center mb-4 shadow-lg"
              >
                <Text className="text-2xl font-bold text-white">3</Text>
              </LinearGradient>
              <Text className="text-lg font-semibold text-gray-900 mb-2 text-center">
                Sync Otomatis
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Catatan tersimpan otomatis dan tersedia di semua device Anda
              </Text>
            </View>
          </View>
        </View>

        {/* Tech Stack */}
        <LinearGradient
          colors={['#111827', '#1f2937']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="rounded-2xl p-8 mb-8"
        >
          <View className="items-center mb-6">
            <Text className="text-2xl font-bold text-white mb-2">
              Teknologi yang Digunakan
            </Text>
            <Text className="text-gray-400 text-center">
              Dibangun dengan stack modern dan reliable
            </Text>
          </View>
          
          <View className="flex-row flex-wrap justify-center gap-3">
            {['React Native', 'Electron', 'TypeScript', 'Google Drive API', 'Expo', 'OAuth 2.0'].map((tech) => (
              <View
                key={tech}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg"
              >
                <Text className="text-sm font-medium text-white">{tech}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={['#2563eb', '#1d4ed8']}
        className="py-12 px-6"
      >
        <View className="items-center">
          <Text className="text-3xl font-bold text-white mb-4 text-center">
            Siap Mencatat Hari Anda?
          </Text>
          <Text className="text-lg text-blue-100 mb-6 text-center">
            Mulai journaling dengan DailyNote sekarang
          </Text>
          <TouchableOpacity
            className="flex-row items-center gap-2 bg-white px-8 py-4 rounded-xl shadow-xl active:opacity-80"
            onPress={() => router.push('/add-note')}
          >
            <BookOpen color="#2563eb" size={20} />
            <Text className="text-lg font-semibold text-blue-600">
              Mulai Sekarang
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}