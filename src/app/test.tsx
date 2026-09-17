import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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


export default function Test() {
  const router = useRouter();
  const settingsParams = useLocalSearchParams<{ settings?: string }>();
  const parsedParams = settingsParams.settings
    ? (JSON.parse(settingsParams.settings) as Settings)
    : null;

  const [targetText, setTargetText] = useState("");
  const [typedText, setTypedText] = useState("");

  const inputRef = useRef<TextInput>(null)

  const [startTime] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const elapsedSeconds = (now - startTime) / 1000;
  const hasEndedRef = useRef(false);
  const mode = parsedParams?.mode;

  const remaining =
    parsedParams && parsedParams.mode === "timed"
      ? parsedParams.time - elapsedSeconds
      : null;

  useEffect(() => {
    if (parsedParams) {
      setTargetText(generateTargetText(parsedParams));
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
  const interval = setInterval(() => setNow(Date.now()), 250);
  return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  if (mode === "timed" && remaining !== null && remaining <= 0) {
    endTest();
    }
  }, [remaining]);

  useEffect(() => {
    if (mode === "words" && typedText.length >= targetText.length && targetText.length > 0) {
      endTest();
    }
  }, [typedText]);


  if (!parsedParams) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No settings provided.</Text>
      </View>
    );
  }

  const { quoteLength, textStyle } = parsedParams;

  // Depends on typedText, which changes every keystroke — must live in the
  // component body so it always sees the current values.
  function getCharStyle(i: number) {
    if (i < typedText.length) {
      return typedText[i] === targetText[i]
        ? styles.correctChar
        : styles.incorrectChar;
    }
    if (i === typedText.length) {
      return styles.currentChar;
    }
    return styles.untypedChar;
  }

  function endTest(){
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    console.log("test ended")
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    let correctChars = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === targetText[i]) correctChars++;
    }

    const elapsedMinutes = elapsedSeconds / 60;
    const wpm = Math.round((correctChars / 5) / elapsedMinutes);
    const accuracy = typedText.length > 0 ? Math.round((correctChars / typedText.length) * 100) : 0;
    const errors = typedText.length - correctChars;

    const results = {
      wpm,
      accuracy,
      errors,
      characters: typedText.length,
    };

    router.push({
      pathname: "/result",
      params: {
        results: JSON.stringify(results),
        settings: JSON.stringify(parsedParams),
      },
    });
  }

  function handleChangeText(newText: string) {
  setTypedText(newText);

  const newIndex = newText.length - 1;
  if (newIndex >= 0 && newText[newIndex] !== targetText[newIndex]) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } 



  return (
    <SafeAreaView style={styles.container}>
      <Text>
        {mode === "timed"
          ? `Time: ${parsedParams.time}`
          : `Word count: ${parsedParams.wordCount}`}
      </Text>
      <Text>Quote length: {quoteLength}</Text>
      <Text>Text style: {textStyle}</Text>
      {mode === "timed" && <Text>{Math.ceil(remaining!)}</Text>}
      <Text style={styles.targetText}>
        {targetText.split("").map((char, i) => (
          <Text key={i} style={getCharStyle(i)}>
            {char}
          </Text>
        ))}
      </Text>
      <TextInput
        value={typedText}
        onChangeText={handleChangeText}
        placeholder="Click here to type"
        autoCorrect={false}
        autoCapitalize="none"
        ref={inputRef}
        style={styles.hiddenInput}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  errorText: {
    color: "red",
  },
  targetText: {
    marginTop: 16,
    fontSize: 18,
  },
  correctChar: {
    color: "black",
  },
  incorrectChar: {
    color: "red",
  },
  currentChar: {
    backgroundColor: "#cce5ff",
  },
  untypedChar: {
    color: "gray",
  },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    height: 1,
    width: 1,
  },
});