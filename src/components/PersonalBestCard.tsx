import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  best: number | null; // null when this config has no results yet
  configLabel: string; // e.g. "60s · random"
  total: number; // tests taken across every config
};

export function PersonalBestCard({ best, configLabel, total }: Props) {
  const styles = makeStyles(useTheme());
  const totalText = `${total} ${total === 1 ? "test" : "tests"} taken`;

  return (
    <Card>
      <View
        accessible
        accessibilityLabel={
          best === null
            ? `Personal best for ${configLabel}: no result yet. ${totalText}`
            : `Personal best for ${configLabel}: ${best} words per minute. ${totalText}`
        }
      >
        <Text style={styles.label} numberOfLines={1}>
          Personal best · {configLabel}
        </Text>
        {best === null ? (
          <Text style={styles.empty}>No result for this setup yet</Text>
        ) : (
          <Text style={styles.value}>
            {best}
            <Text style={styles.unit}> WPM</Text>
          </Text>
        )}
        <Text style={styles.total}>{totalText}</Text>
      </View>
    </Card>
  );
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    label: { ...textStyles.caption, color: colors.muted },
    value: {
      ...textStyles.stat,
      color: colors.accent,
      marginVertical: spacing.xs,
    },
    unit: { ...textStyles.body, color: colors.muted },
    empty: {
      ...textStyles.headline,
      color: colors.text,
      marginVertical: spacing.xs,
    },
    total: { ...textStyles.caption, color: colors.muted },
  });
}
