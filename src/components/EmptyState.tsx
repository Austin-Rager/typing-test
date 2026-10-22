import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  icon: SymbolViewProps["name"];
  title: string;
  message: string;
  action?: { title: string; onPress: () => void };
};

export function EmptyState({ icon, title, message, action }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <View style={styles.container}>
      <SymbolView name={icon} size={48} tintColor={theme.colors.muted} />
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <View style={styles.action}>
          <AppButton
            title={action.title}
            onPress={action.onPress}
            fullWidth={false}
          />
        </View>
      )}
    </View>
  );
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    title: { ...textStyles.title, color: colors.text, textAlign: "center" },
    message: { ...textStyles.body, color: colors.muted, textAlign: "center" },
    action: { marginTop: spacing.md },
  });
}
