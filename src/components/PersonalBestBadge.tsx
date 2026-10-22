import { SymbolView } from "expo-symbols";
import { useEffect, useEffectEvent } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  wpm: number;
  // Best WPM for this config before this test; null if it's the first one.
  previousBest: number | null;
};

// Only render this when the result is a new best for its config.
export function PersonalBestBadge({ wpm, previousBest }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const haptics = useHaptics();

  // A first result is a best by default, so it's noted but not celebrated.
  const isFirst = previousBest === null;

  const celebrate = useEffectEvent(() => {
    if (!isFirst) haptics.success();
  });
  useEffect(() => {
    celebrate();
  }, []);

  if (isFirst) {
    return (
      <Animated.View entering={FadeIn} style={[styles.pill, styles.firstPill]}>
        <Text style={styles.firstText}>First result for this config</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.springify()}
      style={[styles.pill, styles.bestPill]}
      accessible
      accessibilityLabel={`New personal best, ${wpm - previousBest} over previous`}
    >
      <SymbolView
        name={{ ios: "star.fill", android: "star" }}
        size={18}
        tintColor={theme.colors.onAccent}
      />
      <View>
        <Text style={styles.bestTitle}>New personal best</Text>
        <Text style={styles.bestDetail}>
          +{wpm - previousBest} over previous
        </Text>
      </View>
    </Animated.View>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    pill: {
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
    },
    bestPill: { backgroundColor: colors.accent },
    firstPill: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    bestTitle: {
      ...textStyles.body,
      fontFamily: fonts.uiBold,
      color: colors.onAccent,
    },
    bestDetail: { ...textStyles.caption, color: colors.onAccent },
    firstText: { ...textStyles.caption, color: colors.muted },
  });
}
