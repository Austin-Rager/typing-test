import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { useTheme, type Theme } from "@/hooks/useTheme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
};

export function Screen({
  children,
  scroll = false,
  edges = ["top", "bottom", "left", "right"],
}: Props) {
  const styles = makeStyles(useTheme());

  return (
    <SafeAreaView style={styles.safeArea} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

function makeStyles({ colors, spacing }: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    content: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
    },
    fill: { flex: 1 },
  });
}
