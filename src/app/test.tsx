import { useLocalSearchParams, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { SymbolView } from "expo-symbols";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfigChips } from "@/components/ConfigChips";
import { LiveStats } from "@/components/LiveStats";
import { ProgressBar } from "@/components/ProgressBar";
import { SteadinessMeter } from "@/components/SteadinessMeter";
import { TypingDisplay } from "@/components/TypingDisplay";
import { useSettings } from "@/context/SettingsContext";
import { getCustomText, updateBestWpm } from "@/db/customTexts";
import { insertTestResult } from "@/db/testResults";
import { useHaptics } from "@/hooks/useHaptics";
import { useMotionLevel } from "@/hooks/useMotionLevel";
import { useShake } from "@/hooks/useShake";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { generateTargetText } from "@/lib/generateTargetText";
import { computeStats } from "@/lib/stats";
import { parseTestParams, toStatsParams, toTestParams } from "@/lib/testParams";
import { normalizeText } from "@/lib/validateText";
import { MIN_TOUCH } from "@/theme/tokens";

const TOAST_MS = 1200;

export default function Test() {
  const router = useRouter();
  const db = useSQLiteContext();
  const config = parseTestParams(useLocalSearchParams());
  const theme = useTheme();
  const styles = makeStyles(theme);
  const haptics = useHaptics();
  const { settings } = useSettings();

  // Custom texts live in the DB, so they start empty and load below.
  const customTextId =
    config?.textStyle === "custom" ? config.textId : undefined;
  const [targetText, setTargetText] = useState(() =>
    config && customTextId === undefined ? generateTargetText(config) : "",
  );
  const [customTitle, setCustomTitle] = useState<string>();
  const [typedText, setTypedText] = useState("");
  const [now, setNow] = useState(() => Date.now());
  // Mirrors startTimeRef so render can read it (refs can't be read during render).
  const [startTime, setStartTime] = useState<number | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // finishTest reads only these refs, so it never sees stale state.
  const targetRef = useRef(targetText);
  const typedRef = useRef("");
  const startTimeRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);

  const timeLimitMs = config?.mode === "timed" ? config.time * 1000 : null;

  // Motion is only averaged once typing has started.
  const motion = useMotionLevel({ recording: startTime !== null });

  // The clock starts on the first keystroke. `now` only ticks every 250 ms, so
  // it can lag just behind startTime; clamp so nothing goes negative.
  const elapsedMs =
    startTime === null
      ? 0
      : Math.min(
          Math.max(now - startTime, 0),
          timeLimitMs ?? Number.POSITIVE_INFINITY,
        );
  const liveStats = computeStats(targetText, typedText, elapsedMs);

  function finishTest() {
    if (hasEndedRef.current || !config) return;
    hasEndedRef.current = true;

    const actualMs =
      startTimeRef.current === null ? 0 : Date.now() - startTimeRef.current;
    // The interval can fire a little after time is up; don't count that overshoot.
    const cappedMs =
      timeLimitMs === null ? actualMs : Math.min(actualMs, timeLimitMs);

    const stats = computeStats(targetRef.current, typedRef.current, cappedMs);

    // Nothing typed (e.g. a timed test left alone): don't save an empty result.
    if (stats.characters === 0) {
      Alert.alert("Test not saved", "You didn't type anything.");
      router.dismissTo("/");
      return;
    }

    haptics.success();
    const avgMotion = motion.getAverage();

    // A failed best-WPM update shouldn't stop the result from being saved.
    const saveBest =
      customTextId === undefined
        ? Promise.resolve()
        : updateBestWpm(db, customTextId, stats.wpm).catch((e) =>
            console.warn("Couldn't update best WPM", e),
          );

    saveBest
      .then(() => insertTestResult(db, config, stats, avgMotion))
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

  function restartTest() {
    // Not once the test is finishing/quit, or while a custom text still loads.
    if (!config || hasEndedRef.current || targetRef.current === "") return;

    // A custom text is fixed, so it restarts with the same text.
    const next =
      customTextId === undefined
        ? generateTargetText(config)
        : targetRef.current;
    targetRef.current = next;
    setTargetText(next);
    typedRef.current = "";
    setTypedText("");
    startTimeRef.current = null;
    setStartTime(null);
    setNow(Date.now());
    motion.reset();

    inputRef.current?.focus();
    haptics.light();
    AccessibilityInfo.announceForAccessibility("Test restarted");
    clearTimeout(toastTimerRef.current);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), TOAST_MS);
  }

  useShake(restartTest, { enabled: settings.shakeToRestart });

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

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
    if (customTextId === undefined) return;
    getCustomText(db, customTextId)
      .then((text) => {
        if (!text) {
          Alert.alert("Text not found", "It may have been deleted.");
          router.back();
          return;
        }
        const body = normalizeText(text.body);
        targetRef.current = body;
        setTargetText(body);
        setCustomTitle(text.title);
      })
      .catch((e) => {
        console.warn("Couldn't load text", e);
        Alert.alert("Couldn't load text");
        router.back();
      });
  }, [db, router, customTextId]);

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
      haptics.error();
    }

    // Any mode ends once the whole text is typed (maxLength stops input there).
    if (targetText.length > 0 && newText.length >= targetText.length) {
      finishTest();
    }
  }

  function handleClose() {
    // Nothing to lose before the first keystroke.
    if (startTimeRef.current === null) {
      router.back();
      return;
    }
    Alert.alert("Quit test?", "This test won't be saved.", [
      { text: "Keep typing", style: "cancel" },
      {
        text: "Quit",
        style: "destructive",
        onPress: () => {
          hasEndedRef.current = true;
          router.back();
        },
      },
    ]);
  }

  const progress =
    timeLimitMs !== null
      ? elapsedMs / timeLimitMs
      : targetText.length > 0
        ? typedText.length / targetText.length
        : 0;

  const hint = [
    startTime === null && "Start typing to begin",
    settings.shakeToRestart && "Shake to restart",
  ]
    .filter(Boolean)
    .join(" · ");

  const remainingSeconds =
    timeLimitMs === null
      ? undefined
      : Math.max(0, Math.ceil((timeLimitMs - elapsedMs) / 1000));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.chips}>
          <ConfigChips config={config} customTitle={customTitle} />
        </View>
        <Pressable
          onPress={restartTest}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Restart test"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <SymbolView
            name={{ ios: "arrow.counterclockwise", android: "restart_alt" }}
            size={20}
            tintColor={theme.colors.text}
          />
        </Pressable>
        <Pressable
          onPress={handleClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quit test"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <LiveStats
        wpm={liveStats.wpm}
        accuracy={liveStats.accuracy}
        errors={liveStats.errors}
        remaining={remainingSeconds}
      />
      <ProgressBar progress={progress} />
      {motion.available && <SteadinessMeter motion={motion.level} />}

      {/* Above the text, since the keyboard covers the bottom of the screen. */}
      {hint !== "" && <Text style={styles.hint}>{hint}</Text>}

      <ScrollView
        style={styles.textScroll}
        keyboardShouldPersistTaps="always"
      >
        {targetText === "" ? (
          <Text style={styles.hint}>Loading text…</Text>
        ) : (
          <TypingDisplay
            target={targetText}
            typed={typedText}
            fontSize={theme.typingFontSize}
            onPress={() => inputRef.current?.focus()}
          />
        )}
      </ScrollView>

      {/* multiline so Return types the newlines in code snippets. */}
      <TextInput
        value={typedText}
        onChangeText={handleChangeText}
        maxLength={targetText.length}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        spellCheck={false}
        ref={inputRef}
        style={styles.hiddenInput}
      />

      {toastVisible && (
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={styles.toastWrap}
        >
          <Text style={styles.toast}>Restarted</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

function makeStyles({ colors, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.bg,
    },
    errorText: {
      ...textStyles.body,
      color: colors.danger,
    },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    chips: { flex: 1 },
    iconButton: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      borderRadius: radius.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.6 },
    closeText: { ...textStyles.headline, color: colors.text },
    hint: {
      ...textStyles.caption,
      color: colors.muted,
      textAlign: "center",
    },
    textScroll: { flex: 1 },
    toastWrap: {
      position: "absolute",
      top: "35%",
      left: 0,
      right: 0,
      alignItems: "center",
      pointerEvents: "none",
    },
    toast: {
      ...textStyles.headline,
      color: colors.bg,
      backgroundColor: colors.text,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      overflow: "hidden",
    },
    hiddenInput: {
      position: "absolute",
      opacity: 0,
      height: 1,
      width: 1,
    },
  });
}
