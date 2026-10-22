import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { insertTestResult } from "@/db/testResults";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { generateTargetText } from "@/lib/generateTargetText";
import { computeStats } from "@/lib/stats";
import { parseTestParams, toStatsParams, toTestParams } from "@/lib/testParams";
import { withAlpha } from "@/theme/colors";

export default function Test() {
  const router = useRouter();
  const db = useSQLiteContext();
  const config = parseTestParams(useLocalSearchParams());
  const styles = makeStyles(useTheme());

  const [targetText] = useState(() =>
    config ? generateTargetText(config) : "",
  );
  const [typedText, setTypedText] = useState("");
  const [now, setNow] = useState(() => Date.now());
  // Mirrors startTimeRef so render can read it (refs can't be read during render).
  const [startTime, setStartTime] = useState<number | null>(null);

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
      : startTime === null
        ? timeLimitMs
        : timeLimitMs - (now - startTime);

  function finishTest() {
    if (hasEndedRef.current || !config) return;
    hasEndedRef.current = true;

    const elapsedMs =
      startTimeRef.current === null ? 0 : Date.now() - startTimeRef.current;
    // The interval can fire a little after time is up; don't count that overshoot.
    const cappedMs =
      timeLimitMs === null ? elapsedMs : Math.min(elapsedMs, timeLimitMs);

    const stats = computeStats(targetRef.current, typedRef.current, cappedMs);

    // Nothing typed (e.g. a timed test left alone): don't save an empty result.
    if (stats.characters === 0) {
      Alert.alert("Test not saved", "You didn't type anything.");
      router.dismissTo("/");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    insertTestResult(db, config, stats)
      .then(
        (id) => ({ resultId: String(id) }),
        (e) => {
          // Still show the result, passing the stats directly instead of an id.
          console.warn("Couldn't save result", e);
          Alert.alert("Couldn't save result");
          return { ...toTestParams(config), ...toStatsParams(stats) };
        },
      )
      .then((params) => router.replace({ pathname: "/result", params }));
  }

  // An effect event always sees the latest render, so the interval never goes stale.
  const onTick = useEffectEvent(() => {
    const current = Date.now();
    setNow(current);

    if (
      timeLimitMs !== null &&
      startTimeRef.current !== null &&
      current - startTimeRef.current >= timeLimitMs
    ) {
      finishTest();
    }
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const interval = setInterval(onTick, 250);
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
      setStartTime(startTimeRef.current);
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
      <Text style={styles.infoText}>
        {mode === "timed"
          ? `Time: ${config.time}`
          : `Word count: ${config.wordCount}`}
      </Text>
      <Text style={styles.infoText}>Quote length: {quoteLength}</Text>
      <Text style={styles.infoText}>Text style: {textStyle}</Text>
      {remainingMs !== null && (
        <Text style={styles.countdown}>
          {Math.max(0, Math.ceil(remainingMs / 1000))}
        </Text>
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

function makeStyles({ colors, fonts, spacing, textStyles, typingFontSize }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.bg,
    },
    errorText: {
      ...textStyles.body,
      color: colors.danger,
    },
    infoText: {
      ...textStyles.caption,
      color: colors.muted,
    },
    countdown: {
      ...textStyles.stat,
      color: colors.accent,
    },
    targetText: {
      marginTop: spacing.lg,
      fontFamily: fonts.mono,
      fontSize: typingFontSize,
      lineHeight: typingFontSize * 1.6,
    },
    correctChar: {
      color: colors.text,
    },
    incorrectChar: {
      color: colors.danger,
      backgroundColor: withAlpha(colors.danger, 0.15),
    },
    currentChar: {
      color: colors.text,
      backgroundColor: withAlpha(colors.accent, 0.25),
    },
    untypedChar: {
      color: colors.muted,
    },
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
  });
}
