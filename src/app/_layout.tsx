import {
  JetBrainsMono_400Regular,
  useFonts,
} from "@expo-google-fonts/jetbrains-mono";
import { Stack } from "expo-router";
import { View } from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JetBrainsMono_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="test" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
