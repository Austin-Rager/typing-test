import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { OptionButton } from "@/components/OptionButton";
import { PersonalBestCard } from "@/components/PersonalBestCard";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { getCustomTexts } from "@/db/customTexts";
import { getBestWpm, getSummary } from "@/db/testResults";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { getConfigKey } from "@/lib/configKey";
import { formatConfig } from "@/lib/format";
import { toTestParams } from "@/lib/testParams";
import { MIN_TOUCH } from "@/theme/tokens";
import type {
  CustomText,
  Mode,
  QuoteLength,
  TestConfig,
  TextStyleOption,
} from "@/types/test";

const TIME_OPTIONS = [30, 60, 120];
const WORD_OPTIONS = [10, 30, 50];
const QUOTE_LENGTH_OPTIONS: QuoteLength[] = ["medium", "long"];
const TEXT_STYLE_OPTIONS: { value: TextStyleOption; label: string }[] = [
  { value: "random", label: "Random" },
  { value: "quote", label: "Quote" },
  { value: "code", label: "Code" },
  { value: "custom", label: "Mine" },
];

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

export default function Home() {
  const router = useRouter();
  const db = useSQLiteContext();
  const styles = makeStyles(useTheme());

  const [mode, setMode] = useState<Mode>("timed");
  const [time, setTime] = useState(60);
  const [wordCount, setWord] = useState(30);
  const [quoteLength, setQuote] = useState<QuoteLength>("medium");
  const [textStyle, setTextStyle] = useState<TextStyleOption>("random");
  const [customTexts, setCustomTexts] = useState<CustomText[]>([]);
  const [customTextId, setCustomTextId] = useState<number | null>(null);
  // null until the first load, so the card doesn't flash "no result".
  const [personalBest, setPersonalBest] = useState<{
    best: number | null;
    total: number;
  } | null>(null);

  // Home stays mounted as a tab, so refresh when texts are added or deleted elsewhere.
  useFocusEffect(
    useCallback(() => {
      getCustomTexts(db)
        .then(setCustomTexts)
        .catch((e) => console.warn("Couldn't load texts", e));
    }, [db]),
  );

  const hasCustomTexts = customTexts.length > 0;
  // Falls back if the chosen text (or every text) was deleted in the meantime.
  const effectiveStyle =
    textStyle === "custom" && !hasCustomTexts ? "random" : textStyle;
  const isCustom = effectiveStyle === "custom";
  const selectedText =
    customTexts.find((t) => t.id === customTextId) ?? customTexts[0];
  // Custom texts are typed in full, so they always run in words mode.
  const effectiveMode: Mode = isCustom ? "words" : mode;

  const config: TestConfig = {
    mode: effectiveMode,
    time,
    wordCount,
    quoteLength,
    textStyle: effectiveStyle,
    ...(isCustom && { textId: selectedText.id }),
  };
  const configKey = getConfigKey(config);

  // Re-runs on focus (new results) and whenever the options change the config.
  useFocusEffect(
    useCallback(() => {
      // Ignore a slow query that finishes after the config has changed again.
      let active = true;
      Promise.all([getBestWpm(db, configKey), getSummary(db)])
        .then(([best, summary]) => {
          if (active) setPersonalBest({ best, total: summary.total });
        })
        .catch((e) => console.warn("Couldn't load personal best", e));
      return () => {
        active = false;
      };
    }, [db, configKey]),
  );

  const handleStart = () => {
    router.push({ pathname: "/test", params: toTestParams(config) });
  };

  return (
    <Screen
      scroll
      edges={["top", "left", "right"]}
      footer={<AppButton title="Start test" size="lg" onPress={handleStart} />}
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Type Test
        </Text>
        <Text style={styles.subtitle}>Pick a setup, then start typing.</Text>
      </View>

      {personalBest && (
        <PersonalBestCard
          best={personalBest.best}
          configLabel={formatConfig(config, selectedText?.title)}
          total={personalBest.total}
        />
      )}

      <Card>
        <Section label="Mode" disabled={isCustom}>
          <OptionButton
            label="Timed"
            selected={effectiveMode === "timed"}
            disabled={isCustom}
            onPress={() => setMode("timed")}
          />
          <OptionButton
            label="Words"
            selected={effectiveMode === "words"}
            disabled={isCustom}
            onPress={() => setMode("words")}
          />
        </Section>

        <Section label="Time" disabled={effectiveMode !== "timed"}>
          {TIME_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}s`}
              accessibilityLabel={`${option} seconds`}
              selected={effectiveMode === "timed" && time === option}
              disabled={effectiveMode !== "timed"}
              onPress={() => setTime(option)}
            />
          ))}
        </Section>

        {/* A custom text is typed in full, so its length isn't a word count. */}
        <Section
          label="Word count"
          disabled={effectiveMode !== "words" || isCustom}
        >
          {WORD_OPTIONS.map((option) => (
            <OptionButton
              key={option}
              label={`${option}`}
              accessibilityLabel={`${option} words`}
              selected={
                effectiveMode === "words" && !isCustom && wordCount === option
              }
              disabled={effectiveMode !== "words" || isCustom}
              onPress={() => setWord(option)}
            />
          ))}
        </Section>
      </Card>

      <Card>
        <Section label="Text style">
          {TEXT_STYLE_OPTIONS.map((option) => {
            const unavailable = option.value === "custom" && !hasCustomTexts;
            return (
              <OptionButton
                key={option.value}
                label={option.label}
                accessibilityLabel={
                  option.value === "custom" ? "My texts" : option.label
                }
                selected={effectiveStyle === option.value}
                disabled={unavailable}
                onPress={() => setTextStyle(option.value)}
              />
            );
          })}
        </Section>

        {!hasCustomTexts && (
          <Pressable
            onPress={() => router.navigate("/texts")}
            accessibilityRole="link"
            style={styles.link}
          >
            <Text style={styles.linkText}>Add a text in the Texts tab</Text>
          </Pressable>
        )}

        {isCustom ? (
          <View style={styles.section}>
            <SectionLabel>Text</SectionLabel>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {customTexts.map((text) => (
                <OptionButton
                  key={text.id}
                  compact
                  label={text.title}
                  selected={text.id === selectedText.id}
                  onPress={() => setCustomTextId(text.id)}
                />
              ))}
            </ScrollView>
          </View>
        ) : (
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
        )}
      </Card>
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
    link: { minHeight: MIN_TOUCH, justifyContent: "center", marginTop: -spacing.sm },
    linkText: {
      ...textStyles.caption,
      color: colors.accent,
      textDecorationLine: "underline",
    },
  });
}
