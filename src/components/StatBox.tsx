import { StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  label: string;
  value: string;
  tone?: "default" | "danger" | "accent";
  size?: "sm" | "lg";
};

export function StatBox({ label, value, tone = "default", size = "lg" }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const toneColor =
    tone === "danger"
      ? theme.colors.danger
      : tone === "accent"
        ? theme.colors.accent
        : theme.colors.text;

  return (
    <View
      style={[styles.box, size === "sm" && styles.boxSm]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          styles.value,
          size === "sm" && styles.valueSm,
          { color: toneColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function makeStyles({ colors, radius, spacing, textStyles, fonts }: Theme) {
  return StyleSheet.create({
    box: {
      flex: 1,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: spacing.xs,
    },
    boxSm: { padding: spacing.sm },
    label: { ...textStyles.caption, color: colors.muted },
    value: { ...textStyles.stat },
    valueSm: { fontFamily: fonts.monoBold, fontSize: 18, lineHeight: 24 },
  });
}
