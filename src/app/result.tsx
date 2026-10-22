import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { StatBox } from "@/components/StatBox";
import { getCustomText } from "@/db/customTexts";
import { getTestResult } from "@/db/testResults";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { formatConfig } from "@/lib/format";
import {
  parseStatsParams,
  parseTestParams,
  toTestParams,
} from "@/lib/testParams";
import type { TestResult } from "@/types/test";

export default function Results() {
  const router = useRouter();
  const db = useSQLiteContext();
  const params = useLocalSearchParams();
  const theme = useTheme();
  const styles = makeStyles(theme);

  // Normally Test passes just the saved row's id. If saving failed, it passes
  // the config and stats as params instead, so there's no id to load.
  const idParam = Number(params.resultId);
  const resultId = Number.isInteger(idParam) && idParam > 0 ? idParam : null;

  const [saved, setSaved] = useState<TestResult | null>(null);
  // For custom-text results: the text's title, or null if it was deleted.
  const [customTitle, setCustomTitle] = useState<string | null>();
  const [loading, setLoading] = useState(resultId !== null);

  useEffect(() => {
    if (resultId === null) return;
    getTestResult(db, resultId)
      .then((result) => {
        setSaved(result);
        if (result?.textId === undefined) return;
        return getCustomText(db, result.textId).then((text) =>
          setCustomTitle(text?.title ?? null),
        );
      })
      .catch((e) => console.warn("Couldn't load result", e))
      .finally(() => setLoading(false));
  }, [db, resultId]);

  // A saved result holds both its stats and its config.
  const results = resultId === null ? parseStatsParams(params) : saved;
  const settings = resultId === null ? parseTestParams(params) : saved;

  // Test was replaced by Results, so this pops straight back to Home.
  const handleBackToHome = () => {
    router.dismissTo("/");
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator
          style={styles.fill}
          color={theme.colors.accent}
          accessibilityLabel="Loading result"
        />
      </Screen>
    );
  }

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

  const configText = formatConfig(settings, customTitle);

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
    fill: { flex: 1 },
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
