import { StyleSheet, Text, View } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { getConfigParts } from "@/lib/format";
import type { TestConfig } from "@/types/test";

type Props = {
  config: TestConfig;
  customTitle?: string | null;
};

export function ConfigChips({ config, customTitle }: Props) {
  const styles = makeStyles(useTheme());
  const parts = getConfigParts(config, customTitle);

  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`Test config: ${parts.join(", ")}`}
    >
      {parts.map((part) => (
        <View key={part} style={styles.chip}>
          <Text style={styles.label} numberOfLines={1}>
            {part}
          </Text>
        </View>
      ))}
    </View>
  );
}

function makeStyles({ colors, radius, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
    chip: {
      maxWidth: 200,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    label: { ...textStyles.caption, color: colors.muted },
  });
}
