import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { generateTargetText } from "@/lib/generateTargetText";
import { computeStats } from "@/lib/stats";
import { parseTestParams, toStatsParams, toTestParams } from "@/lib/testParams";

export default function Test() {
  const router = useRouter();
  const config = parseTestParams(useLocalSearchParams());

  const [targetText] = useState(() =>
    config ? generateTargetText(config) : "",
  );
  const [typedText, setTypedText] = useState("");
  const [now, setNow] = useState(Date.now());

  const inputRef = useRef<TextInput>(null);

  // finishTest reads only these refs, so it never sees stale state.
  const targetRef = useRef(targetText);
  const typedRef = useRef("");
  const startTimeRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);

  const timeLimitMs = config?.mode === "timed" ? config.time * 1000 : null;

  // The clock starts on the first keystroke, so the full time shows until then.
  const remainingMs =
    timeLimitMs === null
      ? null
      : startTimeRef.current === null
        ? timeLimitMs
        : timeLimitMs - (now - startTimeRef.current);

  function finishTest() {
    if (hasEndedRef.current || !config) return;
    hasEndedRef.current = true;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const elapsedMs =
      startTimeRef.current === null ? 0 : Date.now() - startTimeRef.current;
    // The interval can fire a little after time is up; don't count that overshoot.
    const cappedMs =
      timeLimitMs === null ? elapsedMs : Math.min(elapsedMs, timeLimitMs);

    const stats = computeStats(targetRef.current, typedRef.current, cappedMs);

    router.replace({
      pathname: "/result",
      params: { ...toTestParams(config), ...toStatsParams(stats) },
    });
  }

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (
        timeLimitMs !== null &&
        startTimeRef.current !== null &&
        current - startTimeRef.current >= timeLimitMs
      ) {
        finishTest();
      }
    }, 250);
    return () => clearInterval(interval);
  }, []);

  if (!config) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No settings provided.</Text>
      </View>
    );
  }

  const { mode, quoteLength, textStyle } = config;

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

  function handleChangeText(newText: string) {
    if (hasEndedRef.current) return;

    if (startTimeRef.current === null && newText.length > 0) {
      startTimeRef.current = Date.now();
    }

    typedRef.current = newText;
    setTypedText(newText);

    const newIndex = newText.length - 1;
    if (newIndex >= 0 && newText[newIndex] !== targetText[newIndex]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    // Any mode ends once the whole text is typed (maxLength stops input there).
    if (targetText.length > 0 && newText.length >= targetText.length) {
      finishTest();
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text>
        {mode === "timed"
          ? `Time: ${config.time}`
          : `Word count: ${config.wordCount}`}
      </Text>
      <Text>Quote length: {quoteLength}</Text>
      <Text>Text style: {textStyle}</Text>
      {remainingMs !== null && (
        <Text>{Math.max(0, Math.ceil(remainingMs / 1000))}</Text>
      )}
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
        maxLength={targetText.length}
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
