import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

const RANDOM_WORDS = [
  "the",
  "quick",
  "brown",
  "fox",
  "jumps",
  "over",
  "lazy",
  "dog",
  "type",
  "fast",
];

const QUOTES = {
  medium: [
    "The only way to do great work is to love what you do.",
    "In the middle of difficulty lies opportunity.",
  ],
  long: [
    "It is not the critic who counts; not the man who points out how the strong man stumbles, or where the doer of deeds could have done them better.",
    "Success is not final, failure is not fatal: it is the courage to continue that counts, and that has made all the difference.",
  ],
};

const CODE_SNIPPETS = {
  medium: ["function add(a, b) {\n  return a + b;\n}"],
  long: [
    "function fibonacci(n) {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}",
  ],
};

export default function Test() {
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

  const settingsParams = useLocalSearchParams<{ settings?: string }>();
  const parsedParams = settingsParams.settings
    ? (JSON.parse(settingsParams.settings) as Settings)
    : null;

  if (!parsedParams) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No settings provided.</Text>
      </View>
    );
  }

  const { mode, quoteLength, textStyle } = parsedParams;

  function generateTargetText(settings: Settings): string {
    switch (settings.textStyle) {
      case "random": {
        const wordCount =
          settings.mode === "words" ? settings.wordCount : settings.time * 3;

        const words: string[] = [];
        for (let i = 0; i < wordCount; i++) {
          words.push(
            RANDOM_WORDS[Math.floor(Math.random() * RANDOM_WORDS.length)],
          );
        }
        return words.join(" ");
      }
      case "quote": {
        const quotes = QUOTES[settings.quoteLength];
        return quotes[Math.floor(Math.random() * quotes.length)];
      }
      case "code": {
        const snippets = CODE_SNIPPETS[settings.quoteLength];
        return snippets[Math.floor(Math.random() * snippets.length)];
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text>
        {mode === "timed"
          ? `Time: ${parsedParams.time}`
          : `Word count: ${parsedParams.wordCount}`}
      </Text>
      <Text>Quote length: {quoteLength}</Text>
      <Text>Text style: {textStyle}</Text>
    </View>
  );
}
