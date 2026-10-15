import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from "@expo-google-fonts/manrope";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { SettingsProvider } from "@/context/SettingsContext";
import { useTheme } from "@/hooks/useTheme";

// Keep the native splash up until fonts are ready, instead of a blank View.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_600SemiBold,
    Manrope_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
  });

  // On a font error, fall back to system fonts rather than hanging on the splash.
  const ready = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    // Needed at the root for gesture-based components (swipe-to-delete later).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SettingsProvider>
        <RootStack />
      </SettingsProvider>
    </GestureHandlerRootView>
  );
}

// Separate component so it can read the theme from SettingsProvider.
function RootStack() {
  const { scheme, colors } = useTheme();

  return (
    <>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" />
        {/* No swipe-back mid-test; test and result sit outside (tabs) so they hide the tab bar. */}
        <Stack.Screen name="test" options={{ gestureEnabled: false }} />
        <Stack.Screen name="result" />
      </Stack>
    </>
  );
}
