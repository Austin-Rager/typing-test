import { Fragment, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { withAlpha } from "@/theme/colors";

type Props = {
  target: string;
  typed: string;
  fontSize: number;
  onPress: () => void;
};

type Run = { start: number; end: number; correct: boolean };

// Groups the typed part into runs of correct and incorrect characters, so a
// whole run renders as one <Text> instead of one node per character.
function splitRuns(target: string, typed: string): Run[] {
  const runs: Run[] = [];
  for (let i = 0; i < typed.length; i++) {
    const correct = typed[i] === target[i];
    const last = runs[runs.length - 1];
    if (last && last.correct === correct) {
      last.end = i + 1;
    } else {
      runs.push({ start: i, end: i + 1, correct });
    }
  }
  return runs;
}

// Shows a "↵" before each newline so it's clear Return needs to be pressed.
function withReturnMarks(
  text: string,
  markStyle?: StyleProp<TextStyle>,
): ReactNode {
  if (!text.includes("\n")) return text;
  return text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <Text style={markStyle}>↵</Text>}
      {i > 0 && "\n"}
      {line}
    </Fragment>
  ));
}

export function TypingDisplay({ target, typed, fontSize, onPress }: Props) {
  const styles = makeStyles(useTheme(), fontSize);

  const runs = splitRuns(target, typed);
  const current = target[typed.length] ?? "";
  const rest = target.slice(typed.length + 1);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Text to type: ${target}`}
      accessibilityHint="Shows the keyboard"
    >
      <Text style={styles.text}>
        {runs.map((run) => (
          <Text
            key={run.start}
            style={run.correct ? styles.correct : styles.incorrect}
          >
            {withReturnMarks(
              target.slice(run.start, run.end),
              run.correct ? styles.returnMark : undefined,
            )}
          </Text>
        ))}
        {current !== "" && (
          <Text style={styles.current}>
            {current === "\n" ? withReturnMarks("\n") : current}
          </Text>
        )}
        <Text style={styles.rest}>
          {withReturnMarks(rest, styles.returnMark)}
        </Text>
      </Text>
    </Pressable>
  );
}

function makeStyles({ colors, fonts }: Theme, fontSize: number) {
  return StyleSheet.create({
    text: {
      fontFamily: fonts.mono,
      fontSize,
      lineHeight: fontSize * 1.6,
    },
    correct: { color: colors.text },
    // The background keeps a mistyped space visible.
    incorrect: {
      color: colors.danger,
      backgroundColor: withAlpha(colors.danger, 0.15),
    },
    current: {
      color: colors.text,
      backgroundColor: withAlpha(colors.accent, 0.25),
      textDecorationLine: "underline",
      textDecorationColor: colors.accent,
    },
    rest: { color: colors.muted },
    returnMark: { opacity: 0.4 },
  });
}
