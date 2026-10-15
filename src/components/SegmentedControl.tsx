import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { MIN_TOUCH } from "@/theme/tokens";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  const styles = makeStyles(useTheme());

  return (
    <View style={styles.track} accessibilityRole="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.segmentSelected,
              pressed && !selected && styles.pressed,
            ]}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected, checked: selected }}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    track: {
      flexDirection: "row",
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    segment: {
      flex: 1,
      minHeight: MIN_TOUCH,
      borderRadius: radius.sm,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentSelected: { backgroundColor: colors.accent },
    pressed: { opacity: 0.6 },
    label: { ...textStyles.body, color: colors.text },
    labelSelected: { fontFamily: fonts.uiBold, color: colors.onAccent },
  });
}
