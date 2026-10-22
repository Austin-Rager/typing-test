import { StyleSheet, Text } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";

export function SectionLabel({ children }: { children: string }) {
  const styles = makeStyles(useTheme());
  return (
    <Text style={styles.label} accessibilityRole="header">
      {children.toUpperCase()}
    </Text>
  );
}

function makeStyles({ colors, fonts, textStyles }: Theme) {
  return StyleSheet.create({
    label: {
      ...textStyles.caption,
      fontFamily: fonts.uiMedium,
      color: colors.muted,
      letterSpacing: 0.8,
    },
  });
}
