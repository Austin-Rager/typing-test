import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { StatBox } from "@/components/StatBox";
import { useTheme, type Theme } from "@/hooks/useTheme";
import {
  parseStatsParams,
  parseTestParams,
  toTestParams,
} from "@/lib/testParams";

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const styles = makeStyles(useTheme());

  const results = parseStatsParams(params);
  const settings = parseTestParams(params);

  // Test was replaced by Results, so this pops straight back to Home.
  const handleBackToHome = () => {
    router.dismissTo("/");
  };

  if (!results || !settings) {
    return (
      <Screen>
        <Text style={styles.errorText}>No results to show.</Text>
        <AppButton
          title="Back to home"
          variant="secondary"
          onPress={handleBackToHome}
        />
      </Screen>
    );
  }

  const handleTryAgain = () => {
    router.replace({ pathname: "/test", params: toTestParams(settings) });
  };

  const configText =
    (settings.mode === "timed"
      ? `${settings.time} seconds`
      : `${settings.wordCount} words`) +
    ` · ${settings.quoteLength} ${settings.textStyle}`;

  return (
    <Screen scroll>
      <View
        style={styles.hero}
        accessible
        accessibilityLabel={`${results.wpm} words per minute`}
      >
        <Text style={styles.wpmLabel}>words per minute</Text>
        <Text style={styles.wpm} maxFontSizeMultiplier={1.2}>
          {results.wpm}
        </Text>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatBox label="Accuracy" value={`${results.accuracy}%`} />
          <StatBox
            label="Time"
            value={settings.mode === "timed" ? `${settings.time}s` : "—"}
          />
        </View>
        <View style={styles.statRow}>
          <StatBox label="Errors" value={`${results.errors}`} tone="danger" />
          <StatBox label="Characters" value={`${results.characters}`} />
        </View>
      </View>

      <Card>
        <SectionLabel>Test config</SectionLabel>
        <Text style={styles.configValue}>{configText}</Text>
      </Card>

      <View style={styles.buttonColumn}>
        <AppButton title="Try again" onPress={handleTryAgain} />
        <AppButton
          title="Back to home"
          variant="secondary"
          onPress={handleBackToHome}
        />
      </View>
    </Screen>
  );
}

function makeStyles({ colors, fonts, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    errorText: { ...textStyles.body, color: colors.danger },
    hero: { alignItems: "center", marginTop: spacing.xl },
    wpmLabel: { ...textStyles.caption, color: colors.muted },
    wpm: {
      fontFamily: fonts.monoBold,
      fontSize: 64,
      lineHeight: 76,
      color: colors.accent,
    },
    statGrid: { gap: spacing.md },
    statRow: { flexDirection: "row", gap: spacing.md },
    configValue: { ...textStyles.body, color: colors.text },
    buttonColumn: { gap: spacing.md },
  });
}
