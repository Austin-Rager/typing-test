import { StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { getSteadiness, MAX_MOTION } from "@/lib/steadiness";

type Props = {
  motion: number; // rad/s, live or averaged
  label?: string;
};

export function SteadinessMeter({ motion, label = "Steadiness" }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const steadiness = getSteadiness(motion);
  const fill = Math.min(motion / MAX_MOTION, 1);
  const color =
    steadiness === "Steady"
      ? theme.colors.success
      : steadiness === "Some movement"
        ? theme.colors.accent
        : theme.colors.danger;

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${label}: ${steadiness}`}
    >
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${fill * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[styles.value, { color }]}>{steadiness}</Text>
    </View>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    label: { ...textStyles.caption, color: colors.muted },
    track: {
      flex: 1,
      height: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.border,
      overflow: "hidden",
    },
    fill: { height: "100%", borderRadius: radius.pill },
    value: {
      ...textStyles.caption,
      fontFamily: fonts.uiMedium,
      // Fixed width so the bar doesn't jump as the label changes.
      minWidth: 104,
      textAlign: "right",
    },
  });
}
