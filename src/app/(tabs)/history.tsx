import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { WpmLineChart } from "@/components/charts/WpmLineChart";
import { EmptyState } from "@/components/EmptyState";
import { HistoryItem } from "@/components/HistoryItem";
import { SectionLabel } from "@/components/SectionLabel";
import { StatBox } from "@/components/StatBox";
import { SwipeableRow } from "@/components/SwipeableRow";
import { getCustomTexts } from "@/db/customTexts";
import {
  clearTestResults,
  deleteTestResult,
  getAllResults,
  getSummary,
} from "@/db/testResults";
import { useHaptics } from "@/hooks/useHaptics";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { spacing } from "@/theme/tokens";
import type { TestResult } from "@/types/test";

const CHART_POINTS = 30;

type HistoryData = {
  summary: { best: number; average: number; total: number };
  results: TestResult[];
  textTitles: Map<number, string>; // custom text id -> title
};

export default function History() {
  const router = useRouter();
  const db = useSQLiteContext();
  const haptics = useHaptics();
  const styles = makeStyles(useTheme());

  // null until the first load, so the empty state doesn't flash on open.
  const [data, setData] = useState<HistoryData | null>(null);

  const load = useCallback(() => {
    return Promise.all([getSummary(db), getAllResults(db), getCustomTexts(db)])
      .then(([summary, results, texts]) => {
        const textTitles = new Map(texts.map((t) => [t.id, t.title]));
        setData({ summary, results, textTitles });
      })
      .catch((e) => console.warn("Couldn't load history", e));
  }, [db]);

  // Tabs stay mounted, so reload whenever this one is shown to pick up new tests.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (id: number) => {
    haptics.light();
    deleteTestResult(db, id)
      .then(load)
      .catch((e) => console.warn("Couldn't delete result", e));
  };

  const handleClear = () => {
    Alert.alert(
      "Clear history?",
      "All saved test results will be deleted. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            clearTestResults(db)
              .then(load)
              .catch((e) => console.warn("Couldn't clear history", e));
          },
        },
      ],
    );
  };

  const hasResults = !!data && data.results.length > 0;
  // Results are newest first; the chart reads left to right, oldest to newest.
  const chartData = (data?.results ?? [])
    .slice(0, CHART_POINTS)
    .reverse()
    .map((r) => r.wpm);

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        History
      </Text>
      {hasResults && (
        <View style={styles.statRow}>
          <StatBox label="Best" value={`${data.summary.best}`} tone="accent" />
          <StatBox label="Average" value={`${data.summary.average}`} />
          <StatBox label="Tests" value={`${data.summary.total}`} />
        </View>
      )}
      {hasResults && (
        <Card>
          <SectionLabel>WPM over time</SectionLabel>
          <WpmLineChart data={chartData} highlightLast />
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      {/* The FlatList is the only scroll view; the summary scrolls with it. */}
      <FlatList
        data={data?.results ?? []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <SwipeableRow onDelete={() => handleDelete(item.id)}>
            <HistoryItem
              result={item}
              customTitle={
                item.textId === undefined
                  ? undefined
                  : (data?.textTitles.get(item.textId) ?? null)
              }
              onPress={() =>
                router.push({
                  pathname: "/result",
                  params: { resultId: String(item.id) },
                })
              }
              onDelete={() => handleDelete(item.id)}
            />
          </SwipeableRow>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          data ? (
            <EmptyState
              icon={{ ios: "chart.line.uptrend.xyaxis", android: "show_chart" }}
              title="No tests yet"
              message="Finish a typing test and your results will show up here."
              action={{ title: "Start a test", onPress: () => router.navigate("/") }}
            />
          ) : null
        }
        ListFooterComponent={
          hasResults ? (
            <View style={styles.footer}>
              <AppButton
                title="Clear history"
                variant="danger"
                onPress={handleClear}
              />
            </View>
          ) : null
        }
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },
    header: { gap: spacing.lg, marginBottom: spacing.lg },
    title: { ...textStyles.largeTitle, color: colors.text },
    statRow: { flexDirection: "row", gap: spacing.md },
    footer: { marginTop: spacing.xl },
  });
}
