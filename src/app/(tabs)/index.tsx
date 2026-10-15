import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { OptionButton } from "@/components/OptionButton";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { toTestParams } from "@/lib/testParams";
import type { Mode, QuoteLength, TextStyleOption } from "@/types/test";

const TIME_OPTIONS = [30, 60, 120];
const WORD_OPTIONS = [10, 30, 50];
const QUOTE_LENGTH_OPTIONS: QuoteLength[] = ["medium", "long"];
const TEXT_STYLE_OPTIONS: TextStyleOption[] = ["random", "quote", "code"];

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

export default function Home() {
  const router = useRouter();
  const styles = makeStyles(useTheme());

  const [mode, setMode] = useState<Mode>("timed");
  const [time, setTime] = useState(60);
  const [wordCount, setWord] = useState(30);
  const [quoteLength, setQuote] = useState<QuoteLength>("medium");
  const [textStyle, setTextStyle] = useState<TextStyleOption>("random");

  const handleStart = () => {
    router.push({
      pathname: "/test",
      params: toTestParams({ mode, time, wordCount, quoteLength, textStyle }),
    });
  };

  return (
    <Screen scroll edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Type Test
        </Text>
        <Text style={styles.subtitle}>Pick a setup, then start typing.</Text>
      </View>

      <Card>
        <Section label="Mode">
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
        </Section>

        <Section label="Time" disabled={mode !== "timed"}>
          {TIME_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}s`}
              accessibilityLabel={`${option} seconds`}
              selected={mode === "timed" && time === option}
              disabled={mode !== "timed"}
              onPress={() => setTime(option)}
            />
          ))}
        </Section>

        <Section label="Word count" disabled={mode !== "words"}>
          {WORD_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}`}
              accessibilityLabel={`${option} words`}
              selected={mode === "words" && wordCount === option}
              disabled={mode !== "words"}
              onPress={() => setWord(option)}
            />
          ))}
        </Section>
      </Card>

      <Card>
        <Section label="Text style">
          {TEXT_STYLE_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={capitalize(option)}
              selected={textStyle === option}
              onPress={() => setTextStyle(option)}
            />
          ))}
        </Section>

        <Section label="Quote length">
          {QUOTE_LENGTH_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={capitalize(option)}
              selected={quoteLength === option}
              onPress={() => setQuote(option)}
            />
          ))}
        </Section>
      </Card>

      <AppButton title="Start test" onPress={handleStart} />
    </Screen>
  );
}

function Section({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const styles = makeStyles(useTheme());
  return (
    <View style={[styles.section, disabled && styles.disabled]}>
      <SectionLabel>{label}</SectionLabel>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    header: { gap: spacing.xs, marginTop: spacing.sm },
    title: { ...textStyles.largeTitle, color: colors.text },
    subtitle: { ...textStyles.body, color: colors.muted },
    section: { gap: spacing.sm },
    disabled: { opacity: 0.4 },
    row: { flexDirection: "row", gap: spacing.sm },
  });
}
