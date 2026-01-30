import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../global.css';

export default function RootLayout() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false, // Custom headers for all screens
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right', // Smooth transitions
        }}
      >
        <Stack.Screen 
          name="index" 
          options={{ 
            title: 'Home' 
          }} 
        />
        <Stack.Screen
          name="note-list"
          options={{
            title: 'Notes',
            animation: 'slide_from_right'
          }}
        />
        <Stack.Screen
          name="note-editor"
          options={{
            title: 'Add Note',
            animation: 'slide_from_bottom' // Modal-like feel
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}