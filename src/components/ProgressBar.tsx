import { StyleSheet, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  progress: number; // 0..1
};

export function ProgressBar({ progress }: Props) {
  const styles = makeStyles(useTheme());
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      style={styles.track}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

function makeStyles({ colors, radius }: Theme) {
  return StyleSheet.create({
    track: {
      height: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    fill: {
      height: "100%",
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
    },
  });
}
