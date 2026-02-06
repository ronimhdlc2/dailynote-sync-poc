import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, LogIn } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleAuth } from '../services/google-auth';
import Toast from 'react-native-toast-message';

export default function AuthScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const user = await GoogleAuth.signIn();
      
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: `Signed in as ${user.email}`,
        position: 'top',
      });
      
      // Navigate to notes list
      router.replace('/');
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: error.message || 'Please try again',
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#2563eb', '#1d4ed8', '#1e40af']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Logo */}
          <View className="w-24 h-24 bg-white rounded-3xl items-center justify-center mb-8 shadow-2xl">
            <BookOpen color="#2563eb" size={48} />
          </View>

          {/* Title */}
          <Text className="text-4xl font-bold text-white mb-4 text-center">
            DailyNote
          </Text>
          <Text className="text-lg text-blue-100 mb-12 text-center">
            Your thoughts, synced everywhere
          </Text>

          {/* Google Sign In Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            className="flex-row items-center gap-3 bg-white px-8 py-4 rounded-xl shadow-2xl active:opacity-80"
          >
            <Image
              source={{ uri: 'https://www.google.com/favicon.ico' }}
              style={{ width: 24, height: 24 }}
            />
            <Text className="text-lg font-semibold text-gray-900">
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </Text>
          </TouchableOpacity>

          {/* Info */}
          <Text className="text-sm text-blue-200 mt-8 text-center">
            By signing in, you agree to sync your notes to Google Drive
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}