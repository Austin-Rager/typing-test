import {
  useFonts
} from "@expo-google-fonts/jetbrains-mono";
import { Stack } from "expo-router";
import { View } from "react-native";
import { fonts } from "../theme/typography";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    fonts,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#fff" }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="test" />
      <Stack.Screen name="result" />
    </Stack>
  );
}
