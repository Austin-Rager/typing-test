import { StyleSheet, Text } from "react-native";

import { Screen } from "@/components/Screen";
import { useTheme, type Theme } from "@/hooks/useTheme";

// Temporary body for tabs that are built in later phases.
export function PlaceholderScreen({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  const styles = makeStyles(useTheme());

  return (
    <Screen edges={["top", "left", "right"]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </Screen>
  );
}

function makeStyles({ colors, textStyles }: Theme) {
  return StyleSheet.create({
    title: { ...textStyles.largeTitle, color: colors.text },
    message: { ...textStyles.body, color: colors.muted },
  });
}
