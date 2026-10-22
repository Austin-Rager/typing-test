import { SymbolView } from "expo-symbols";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { withAlpha } from "@/theme/colors";
import { MIN_TOUCH } from "@/theme/tokens";
import type { CustomText } from "@/types/test";

type Props = {
  text: CustomText;
  onPress: () => void;
  onDelete: () => void;
};

export function TextCard({ text, onPress, onDelete }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const isCode = text.type === "code";
  const typeLabel = isCode ? "Code" : "Quote";
  const bestLabel =
    text.bestWpm === null ? "Not practiced yet" : `Best: ${text.bestWpm} WPM`;

  const confirmDelete = () => {
    Alert.alert(
      `Delete "${text.title}"?`,
      "Past results stay in your history.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${text.title}, ${typeLabel}. ${bestLabel}`}
      accessibilityHint="Starts a test with this text"
      // The trash button isn't reachable inside an accessible row, so offer it here.
      accessibilityActions={[{ name: "delete", label: "Delete text" }]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === "delete") confirmDelete();
      }}
      android_ripple={{ color: theme.colors.border }}
      style={({ pressed }) => [
        styles.card,
        pressed && Platform.OS === "ios" && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>
          {text.title}
        </Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>{typeLabel}</Text>
        </View>
        <Pressable
          onPress={confirmDelete}
          hitSlop={4}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <SymbolView
            name={{ ios: "trash", android: "delete" }}
            size={20}
            tintColor={theme.colors.muted}
          />
        </Pressable>
      </View>

      <Text style={[styles.preview, isCode && styles.previewCode]} numberOfLines={2}>
        {text.body}
      </Text>
      <Text style={[styles.best, text.bestWpm !== null && styles.bestSet]}>
        {bestLabel}
      </Text>
    </Pressable>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    card: {
      gap: spacing.sm,
      padding: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      // Keeps the Android ripple inside the rounded corners.
      overflow: "hidden",
    },
    pressed: { opacity: 0.7 },
    headerRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    title: { ...textStyles.headline, color: colors.text, flex: 1 },
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: withAlpha(colors.accent, 0.12),
    },
    chipText: { ...textStyles.caption, fontFamily: fonts.uiMedium, color: colors.accent },
    deleteButton: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      marginRight: -spacing.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    preview: { ...textStyles.body, color: colors.muted },
    previewCode: { fontFamily: fonts.mono, fontSize: 13, lineHeight: 18 },
    best: { ...textStyles.caption, color: colors.muted },
    bestSet: { fontFamily: fonts.uiMedium, color: colors.text },
  });
}
