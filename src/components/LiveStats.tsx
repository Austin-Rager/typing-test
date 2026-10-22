import { StyleSheet, Text, View } from "react-native";

import { StatBox } from "@/components/StatBox";
import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  wpm: number;
  accuracy: number;
  errors: number;
  remaining?: number; // seconds left, timed mode only
};

export function LiveStats({ wpm, accuracy, errors, remaining }: Props) {
  const styles = makeStyles(useTheme());

  return (
    <View style={styles.container}>
      {remaining !== undefined && (
        <Text
          style={styles.countdown}
          maxFontSizeMultiplier={1.2}
          accessibilityLabel={`${remaining} seconds left`}
        >
          {remaining}
        </Text>
      )}
      <View style={styles.row}>
        <StatBox label="WPM" value={`${wpm}`} tone="accent" size="sm" />
        <StatBox label="Accuracy" value={`${accuracy}%`} size="sm" />
        <StatBox label="Errors" value={`${errors}`} tone="danger" size="sm" />
      </View>
    </View>
  );
}

function makeStyles({ colors, fonts, spacing }: Theme) {
  return StyleSheet.create({
    container: { gap: spacing.sm },
    countdown: {
      fontFamily: fonts.monoBold,
      fontSize: 48,
      lineHeight: 56,
      color: colors.accent,
      textAlign: "center",
    },
    row: { flexDirection: "row", gap: spacing.sm },
  });
}
