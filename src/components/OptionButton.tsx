import { Pressable, StyleSheet, Text } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { withAlpha } from "@/theme/colors";
import { MIN_TOUCH } from "@/theme/tokens";

type Props = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  // Sizes to its label instead of sharing the row; for horizontal scroll lists.
  compact?: boolean;
};

export function OptionButton({
  label,
  selected,
  disabled,
  onPress,
  accessibilityLabel,
  compact,
}: Props) {
  const styles = makeStyles(useTheme());

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled: !!disabled }}
    >
      <Text
        style={[styles.label, selected && styles.labelSelected]}
        numberOfLines={1}
        // Four options share a row on Home; shrink a little rather than cut off.
        adjustsFontSizeToFit={!compact}
        minimumFontScale={0.8}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function makeStyles({ colors, radius, spacing, textStyles, fonts }: Theme) {
  return StyleSheet.create({
    button: {
      flex: 1,
      minHeight: MIN_TOUCH,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    compact: { flex: 0, maxWidth: 200, paddingHorizontal: spacing.md },
    selected: {
      borderColor: colors.accent,
      backgroundColor: withAlpha(colors.accent, 0.12),
    },
    pressed: { opacity: 0.85 },
    label: { ...textStyles.body, color: colors.text },
    labelSelected: { fontFamily: fonts.uiBold, color: colors.accent },
  });
}
