import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { formatConfig, formatDate } from "@/lib/format";
import type { TestResult } from "@/types/test";

type Props = {
  result: TestResult;
  // For custom-text results: the text's title, or null if it was deleted.
  customTitle?: string | null;
  onPress?: () => void;
  // Exposed as a screen reader action, so deleting doesn't need a swipe.
  onDelete?: () => void;
};

export function HistoryItem({ result, customTitle, onPress, onDelete }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const config = formatConfig(result, customTitle);
  const date = formatDate(result.createdAt);
  const errorLabel = result.errors === 1 ? "error" : "errors";

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={`${result.wpm} words per minute, ${result.accuracy}% accuracy, ${result.errors} ${errorLabel}. ${config}. ${date}`}
      accessibilityActions={
        onDelete ? [{ name: "delete", label: "Delete test" }] : undefined
      }
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") onDelete?.();
      }}
      android_ripple={onPress ? { color: theme.colors.border } : undefined}
      style={({ pressed }) => [
        styles.row,
        pressed && Platform.OS === "ios" && styles.pressed,
      ]}
    >
      <View style={styles.wpmColumn}>
        <Text style={styles.wpm} maxFontSizeMultiplier={1.2}>
          {result.wpm}
        </Text>
        <Text style={styles.wpmUnit}>wpm</Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.config} numberOfLines={1}>
          {config}
        </Text>
        <Text style={styles.meta}>
          {result.accuracy}% accuracy · {result.errors} {errorLabel}
        </Text>
        <Text style={styles.meta}>{date}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles({ colors, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    row: {
      minHeight: 64,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      // Keeps the Android ripple inside the rounded corners.
      overflow: "hidden",
    },
    pressed: { opacity: 0.7 },
    wpmColumn: { minWidth: 56, alignItems: "center" },
    wpm: { ...textStyles.stat, color: colors.accent },
    wpmUnit: { ...textStyles.caption, color: colors.muted },
    details: { flex: 1, gap: 2 },
    config: { ...textStyles.headline, color: colors.text },
    meta: { ...textStyles.caption, color: colors.muted },
  });
}
