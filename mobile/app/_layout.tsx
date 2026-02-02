import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import "../global.css";

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
              animation: "slide_from_bottom", // Modal-like feel
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
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
