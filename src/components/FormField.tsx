import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { MIN_TOUCH } from "@/theme/tokens";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  multiline?: boolean;
  maxLength?: number;
  mono?: boolean;
};

export function FormField({
  label,
  value,
  onChangeText,
  error,
  multiline,
  maxLength,
  mono,
  ...inputProps
}: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        maxLength={maxLength}
        accessibilityLabel={label}
        accessibilityHint={error}
        placeholderTextColor={theme.colors.muted}
        style={[
          styles.input,
          multiline && styles.multiline,
          mono && styles.mono,
          !!error && styles.inputError,
        ]}
      />
      <View style={styles.footer}>
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error ?? ""}
        </Text>
        {maxLength !== undefined && (
          <Text
            style={styles.counter}
            accessibilityLabel={`${value.length} of ${maxLength} characters`}
          >
            {value.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

function makeStyles({ colors, fonts, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    field: { gap: spacing.xs },
    label: { ...textStyles.caption, fontFamily: fonts.uiMedium, color: colors.text },
    input: {
      ...textStyles.body,
      minHeight: MIN_TOUCH,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      backgroundColor: colors.bg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
    },
    multiline: { minHeight: 120, textAlignVertical: "top" },
    mono: { fontFamily: fonts.mono, fontSize: 14 },
    inputError: { borderColor: colors.danger },
    footer: { flexDirection: "row", gap: spacing.sm },
    error: { ...textStyles.caption, color: colors.danger, flex: 1 },
    counter: { ...textStyles.caption, fontFamily: fonts.mono, color: colors.muted },
  });
}
