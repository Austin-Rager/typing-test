import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, style }: Props) {
  const styles = makeStyles(useTheme());
  return <View style={[styles.card, style]}>{children}</View>;
}

function makeStyles({ colors, radius, spacing }: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
    },
  });
}
