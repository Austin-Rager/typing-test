import type { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { withAlpha } from "@/theme/colors";

type Variant = "primary" | "secondary" | "danger";

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  icon?: ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "md" | "lg";
};

export function AppButton({
  title,
  onPress,
  variant = "primary",
  icon,
  disabled,
  fullWidth = true,
  size = "md",
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const textColor =
    variant === "secondary" ? theme.colors.text : theme.colors.onAccent;
  const rippleColor = withAlpha(
    variant === "secondary" ? theme.colors.text : theme.colors.onAccent,
    0.2,
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled }}
      android_ripple={{ color: rippleColor }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        fullWidth && styles.fullWidth,
        size === "lg" && styles.large,
        disabled && styles.disabled,
        pressed && Platform.OS === "ios" && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.title,
            size === "lg" && styles.titleLarge,
            { color: textColor },
          ]}
        >{title}</Text>
      </View>
    </Pressable>
  );
}

function makeStyles({ colors, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    base: {
      minHeight: 48,
      paddingHorizontal: spacing.xl,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      // Keeps the Android ripple inside the rounded corners.
      overflow: "hidden",
    },
    fullWidth: { alignSelf: "stretch" },
    large: { minHeight: 56 },
    primary: { backgroundColor: colors.accent },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    danger: { backgroundColor: colors.danger },
    disabled: { opacity: 0.4 },
    pressed: { opacity: 0.85 },
    content: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    title: { ...textStyles.headline },
    titleLarge: { fontSize: 18 },
  });
}
