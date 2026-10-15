import Slider from "@react-native-community/slider";
import { useState } from "react";
import { Alert, StyleSheet, Switch, Text, View } from "react-native";

import { AccentSwatch } from "@/components/AccentSwatch";
import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { Screen } from "@/components/Screen";
import { SectionLabel } from "@/components/SectionLabel";
import { SegmentedControl } from "@/components/SegmentedControl";
import { SettingsRow } from "@/components/SettingsRow";
import {
  useSettings,
  type ThemePreference,
} from "@/context/SettingsContext";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { ACCENTS, type AccentName } from "@/theme/colors";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const ACCENT_NAMES = Object.keys(ACCENTS) as AccentName[];

const MIN_FONT_SIZE = 14;
const MAX_FONT_SIZE = 28;

function capitalize(value: string) {
  return value[0].toUpperCase() + value.slice(1);
}

export default function Settings() {
  const theme = useTheme();
  const styles = makeStyles(theme);
  const { colors, scheme } = theme;
  const { settings, updateSetting, resetSettings } = useSettings();

  // Live value while dragging; only saved to storage when the drag ends.
  const [draftFontSize, setDraftFontSize] = useState<number | null>(null);
  const fontSize = draftFontSize ?? settings.typingFontSize;

  const switchTrack = { false: colors.border, true: colors.accent };

  const handleReset = () => {
    Alert.alert(
      "Reset settings?",
      "Theme, accent, font size and feedback options go back to their defaults.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetSettings },
      ],
    );
  };

  return (
    <Screen scroll edges={["top", "left", "right"]}>
      <Text style={styles.title} accessibilityRole="header">
        Settings
      </Text>

      <View style={styles.group}>
        <SectionLabel>Appearance</SectionLabel>
        <Card>
          <SettingsRow title="Theme" subtitle="System follows your phone">
            <SegmentedControl
              options={THEME_OPTIONS}
              value={settings.theme}
              onChange={(value) => updateSetting("theme", value)}
            />
          </SettingsRow>

          <View style={styles.divider} />

          <SettingsRow title="Accent color">
            <View style={styles.swatchRow} accessibilityRole="radiogroup">
              {ACCENT_NAMES.map((name) => (
                <AccentSwatch
                  key={name}
                  label={capitalize(name)}
                  color={ACCENTS[name][scheme]}
                  selected={settings.accent === name}
                  onPress={() => updateSetting("accent", name)}
                />
              ))}
            </View>
          </SettingsRow>
        </Card>
      </View>

      <View style={styles.group}>
        <SectionLabel>Typing</SectionLabel>
        <Card>
          <SettingsRow
            title="Font size"
            right={<Text style={styles.value}>{fontSize}</Text>}
          >
            <Slider
              minimumValue={MIN_FONT_SIZE}
              maximumValue={MAX_FONT_SIZE}
              step={2}
              value={settings.typingFontSize}
              onValueChange={setDraftFontSize}
              onSlidingComplete={(value) => {
                updateSetting("typingFontSize", value);
                setDraftFontSize(null);
              }}
              minimumTrackTintColor={colors.accent}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.accent}
              accessibilityLabel="Typing font size"
            />
            <View style={styles.preview}>
              <Text
                style={[
                  styles.previewText,
                  { fontSize, lineHeight: fontSize * 1.6 },
                ]}
                numberOfLines={1}
              >
                The quick brown fox
              </Text>
            </View>
          </SettingsRow>
        </Card>
      </View>

      <View style={styles.group}>
        <SectionLabel>Feedback</SectionLabel>
        <Card>
          <SettingsRow
            title="Haptics"
            subtitle="Vibrate on mistakes and when a test ends"
            right={
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={(value) => updateSetting("hapticsEnabled", value)}
                trackColor={switchTrack}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Haptics"
              />
            }
          />

          <View style={styles.divider} />

          <SettingsRow
            title="Shake to restart"
            subtitle="Shake your phone during a test to start over"
            right={
              <Switch
                value={settings.shakeToRestart}
                onValueChange={(value) => updateSetting("shakeToRestart", value)}
                trackColor={switchTrack}
                ios_backgroundColor={colors.border}
                accessibilityLabel="Shake to restart"
              />
            }
          />
        </Card>
      </View>

      <AppButton
        title="Reset settings"
        variant="secondary"
        onPress={handleReset}
      />
    </Screen>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    title: { ...textStyles.largeTitle, color: colors.text, marginTop: spacing.sm },
    group: { gap: spacing.sm },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
    value: { fontFamily: fonts.monoBold, fontSize: 17, color: colors.accent },
    preview: {
      backgroundColor: colors.bg,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    previewText: { fontFamily: fonts.mono, color: colors.text },
  });
}
