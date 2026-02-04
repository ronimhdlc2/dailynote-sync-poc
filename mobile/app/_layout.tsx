import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text } from "react-native";  // ← TAMBAHKAN INI
import "react-native-reanimated";
import "../global.css";
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

// Custom toast config yang mirip Sonner desktop
const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        borderLeftWidth: 0,
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        minHeight: 70,
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 12,
        flex: 1,
      }}
      text1Style={{
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 12,
        color: '#6b7280',
        lineHeight: 20,
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#dcfce7',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>✓</Text>
        </View>
      )}
    />
  ),
  
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        borderLeftWidth: 0,
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        minHeight: 70,
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 12,
        flex: 1,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#fee2e2',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>✕</Text>
        </View>
      )}
    />
  ),
  
  info: (props: any) => (
    <InfoToast
      {...props}
      style={{
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        borderLeftWidth: 0,
        paddingVertical: 16,
        paddingHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        minHeight: 70,
      }}
      contentContainerStyle={{ 
        paddingHorizontal: 12,
        flex: 1,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
      }}
      text2Style={{
        fontSize: 14,
        color: '#6b7280',
        lineHeight: 20,
      }}
      renderLeadingIcon={() => (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#dbeafe',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>ℹ</Text>
        </View>
      )}
    />
  ),
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "transparent", paddingTop: 0 },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "Home",
            }}
          />
          <Stack.Screen
            name="note-list"
            options={{
              title: "Notes",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="note-editor"
            options={{
              title: "Add Note",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="note-viewer"
            options={{
              title: "View Note",
              animation: "slide_from_right",
            }}
          />
        </Stack>
        <StatusBar style="auto" />
        
        {/* Toast dengan styling mirip Sonner desktop */}
        <Toast config={toastConfig} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}