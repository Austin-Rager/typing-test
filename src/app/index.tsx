import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Mode = "timed" | "words";
type QuoteLength = "medium" | "long";
type TextStyleOption = "random" | "quote" | "code";

const TIME_OPTIONS = [30, 60, 120];
const WORD_OPTIONS = [10, 30, 50];
const QUOTE_LENGTH_OPTIONS: QuoteLength[] = ["medium", "long"];
const TEXT_STYLE_OPTIONS: TextStyleOption[] = ["random", "quote", "code"];

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("timed");
  const [time, setTime] = useState(60);
  const [wordCount, setWord] = useState(30);
  const [quoteLength, setQuote] = useState<QuoteLength>("medium");
  const [textStyle, setTextStyle] = useState<TextStyleOption>("random");

  const handleStart = () => {
    const settings =
      mode === "timed"
        ? { mode, time, quoteLength, textStyle }
        : { mode, wordCount, quoteLength, textStyle };
    router.push({
      pathname: "/test",
      params: { settings: JSON.stringify(settings) },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Type Test</Text>

      <Pressable style={styles.startButton} onPress={handleStart}>
        <Text style={styles.startButtonText}>Start</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.label}>Mode</Text>
        <View style={styles.row}>
          <OptionButton
            label="Timed"
            selected={mode === "timed"}
            onPress={() => setMode("timed")}
          />
          <OptionButton
            label="Words"
            selected={mode === "words"}
            onPress={() => setMode("words")}
          />
        </View>
      </View>

      <View
        style={[styles.section, mode !== "timed" && styles.disabledSection]}
      >
        <Text style={styles.label}>Time</Text>
        <View style={styles.row}>
          {TIME_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}s`}
              selected={mode === "timed" && time === option}
              disabled={mode !== "timed"}
              onPress={() => setTime(option)}
            />
          ))}
        </View>
      </View>

      <View
        style={[styles.section, mode !== "words" && styles.disabledSection]}
      >
        <Text style={styles.label}>Word count</Text>
        <View style={styles.row}>
          {WORD_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}`}
              selected={mode === "words" && wordCount === option}
              disabled={mode !== "words"}
              onPress={() => setWord(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quote length</Text>
        <View style={styles.row}>
          {QUOTE_LENGTH_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={option[0].toUpperCase() + option.slice(1)}
              selected={quoteLength === option}
              onPress={() => setQuote(option)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Text style</Text>
        <View style={styles.row}>
          {TEXT_STYLE_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={option[0].toUpperCase() + option.slice(1)}
              selected={textStyle === option}
              onPress={() => setTextStyle(option)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function OptionButton({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.optionButton, selected && styles.optionButtonSelected]}
      disabled={disabled}
      onPress={onPress}
    >
      <Text
        style={[
          styles.optionButtonText,
          selected && styles.optionButtonTextSelected,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 32,
  },
  startButton: {
    alignSelf: "center",
    backgroundColor: "#1a1a1a",
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginBottom: 32,
  },
  startButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  section: { marginBottom: 20 },
  disabledSection: { opacity: 0.4 },
  label: { fontSize: 13, color: "#666", marginBottom: 8 },
  row: { flexDirection: "row", gap: 8 },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  optionButtonSelected: {
    borderColor: "#1a1a1a",
    borderWidth: 2,
    backgroundColor: "#f0f0f0",
  },
  optionButtonText: { fontSize: 14, color: "#1a1a1a" },
  optionButtonTextSelected: { fontWeight: "600" },
});
