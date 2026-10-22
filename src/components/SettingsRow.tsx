import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  // Full-width control shown under the title (segmented control, swatches, slider).
  children?: ReactNode;
};

export function SettingsRow({ title, subtitle, right, children }: Props) {
  const styles = makeStyles(useTheme());

  return (
    <View style={styles.row}>
      <View style={styles.header}>
        <View style={styles.text}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    row: { minHeight: 56, justifyContent: "center", gap: spacing.md },
    header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
    text: { flex: 1, gap: 2 },
    title: { ...textStyles.headline, color: colors.text },
    subtitle: { ...textStyles.caption, color: colors.muted },
  });
}
