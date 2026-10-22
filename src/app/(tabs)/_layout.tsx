import { Tabs } from "expo-router/js-tabs";

import { TabBar } from "@/components/TabBar";
import { useTheme } from "@/hooks/useTheme";

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Test" }} />
      <Tabs.Screen name="history" options={{ title: "History" }} />
      <Tabs.Screen name="texts" options={{ title: "Texts" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
