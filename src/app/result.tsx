import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Results = {
  wpm: number;
  accuracy: number;
  errors: number;
  characters: number;
};

type Settings =
  | {
      mode: "timed";
      time: number;
      quoteLength: "medium" | "long";
      textStyle: "random" | "quote" | "code";
    }
  | {
      mode: "words";
      wordCount: number;
      quoteLength: "medium" | "long";
      textStyle: "random" | "quote" | "code";
    };

export default function Results() {
  const router = useRouter();
  const params = useLocalSearchParams<{ results?: string; settings?: string }>();

  const results: Results | null = params.results
    ? JSON.parse(params.results)
    : null;

  const settings: Settings | null = params.settings
    ? JSON.parse(params.settings)
    : null;

  if (!results || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No results to show.</Text>
      </SafeAreaView>
    );
  }

  function handleTryAgain() {
    router.push({
      pathname: "/test",
      params: { settings: JSON.stringify(settings) },
    });
  }

  function handleBackToHome() {
    router.push("/");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.wpmLabel}>words per minute</Text>
      <Text style={styles.wpm}>{results.wpm}</Text>

      <View style={styles.statGrid}>
        <StatBox label="Accuracy" value={`${results.accuracy}%`} />
        <StatBox
          label="Time"
          value={settings.mode === "timed" ? `${settings.time}s` : "—"}
        />
        <StatBox label="Errors" value={`${results.errors}`} danger />
        <StatBox label="Characters" value={`${results.characters}`} />
      </View>

      <View style={styles.configRow}>
        <Text style={styles.configLabel}>Test config</Text>
        <Text style={styles.configValue}>
          {settings.mode === "timed"
            ? `${settings.time} seconds`
            : `${settings.wordCount} words`}
          {" · "}
          {settings.quoteLength} {settings.textStyle}
        </Text>
      </View>

      <View style={styles.buttonColumn}>
        <Pressable style={styles.primaryButton} onPress={handleTryAgain}>
          <Text style={styles.primaryButtonText}>Try again</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={handleBackToHome}>
          <Text style={styles.secondaryButtonText}>Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function StatBox({
  label,
  value,
  danger,
}: {
  label: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, danger && styles.statValueDanger]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  errorText: { color: "red" },
  wpmLabel: { textAlign: "center", color: "#666", fontSize: 13, marginTop: 24 },
  wpm: { textAlign: "center", fontSize: 56, fontWeight: "600", marginBottom: 24 },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flexBasis: "47%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 12,
  },
  statLabel: { fontSize: 13, color: "#666" },
  statValue: { fontSize: 22, fontWeight: "600", marginTop: 2 },
  statValueDanger: { color: "red" },
  configRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#ccc",
    paddingTop: 12,
    marginBottom: 24,
  },
  configLabel: { fontSize: 13, color: "#666", marginBottom: 4 },
  configValue: { fontSize: 14 },
  buttonColumn: { gap: 10 },
  primaryButton: {
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  secondaryButtonText: { fontSize: 16 },
});