import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { WpmLineChart } from "@/components/charts/WpmLineChart";
import { ConfigChips } from "@/components/ConfigChips";
import { PersonalBestBadge } from "@/components/PersonalBestBadge";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { StatBox } from "@/components/StatBox";
import { SteadinessMeter } from "@/components/SteadinessMeter";
import { getCustomText } from "@/db/customTexts";
import {
  getBestWpm,
  getRecentResults,
  getTestResult,
} from "@/db/testResults";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { formatDuration } from "@/lib/format";
import {
  parseStatsParams,
  parseTestParams,
  toTestParams,
} from "@/lib/testParams";
import type { TestResult } from "@/types/test";

const RECENT_COUNT = 7;

type SavedData = {
  result: TestResult;
  // For custom-text results: the text's title, or null if it was deleted.
  customTitle?: string | null;
  previousBest: number | null; // best for this config before this test
  recentWpm: number[]; // oldest to newest
};

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

  const [saved, setSaved] = useState<SavedData | null>(null);
  const [loading, setLoading] = useState(resultId !== null);

  useEffect(() => {
    if (resultId === null) return;
    getTestResult(db, resultId)
      .then((result) => {
        if (!result) return;
        return Promise.all([
          getBestWpm(db, result.configKey, result.id),
          getRecentResults(db, RECENT_COUNT),
          result.textId === undefined
            ? undefined
            : getCustomText(db, result.textId).then((t) => t?.title ?? null),
        ]).then(([previousBest, recent, customTitle]) =>
          setSaved({
            result,
            customTitle,
            previousBest,
            recentWpm: recent.map((r) => r.wpm).reverse(),
          }),
        );
      })
      .catch((e) => console.warn("Couldn't load result", e))
      .finally(() => setLoading(false));
  }, [db, resultId]);

  // A saved result holds both its stats and its config.
  const results = resultId === null ? parseStatsParams(params) : saved?.result;
  const settings = resultId === null ? parseTestParams(params) : saved?.result;

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

  const isNewBest =
    saved !== null &&
    (saved.previousBest === null || results.wpm > saved.previousBest);

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

      {isNewBest && (
        <PersonalBestBadge
          wpm={results.wpm}
          previousBest={saved.previousBest}
        />
      )}

      <View style={styles.statGrid}>
        <View style={styles.statRow}>
          <StatBox label="Accuracy" value={`${results.accuracy}%`} />
          <StatBox label="Time taken" value={formatDuration(results.elapsedMs)} />
        </View>
        <View style={styles.statRow}>
          <StatBox label="Errors" value={`${results.errors}`} tone="danger" />
          <StatBox label="Characters" value={`${results.characters}`} />
        </View>
      </View>

      {/* Null for older results and phones without a gyroscope. */}
      {saved?.result.avgMotion != null && (
        <Card>
          <SteadinessMeter motion={saved.result.avgMotion} />
        </Card>
      )}

      <ConfigChips config={settings} customTitle={saved?.customTitle} />

      {saved !== null && (
        <Card>
          <SectionLabel>{`Last ${RECENT_COUNT} tests`}</SectionLabel>
          <WpmLineChart
            data={saved.recentWpm}
            height={80}
            compact
            highlightLast
          />
        </Card>
      )}

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
    buttonColumn: { gap: spacing.md },
  });
}
