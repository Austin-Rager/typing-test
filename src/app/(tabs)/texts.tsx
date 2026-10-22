import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/AppButton";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { TextCard } from "@/components/TextCard";
import { TextForm } from "@/components/TextForm";
import {
  deleteCustomText,
  getCustomTexts,
  insertCustomText,
} from "@/db/customTexts";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { DEFAULT_CONFIG, toTestParams } from "@/lib/testParams";
import { spacing } from "@/theme/tokens";
import type { CustomText, CustomTextType } from "@/types/test";

export default function Texts() {
  const router = useRouter();
  const db = useSQLiteContext();
  const styles = makeStyles(useTheme());

  // null until the first load, so the empty state doesn't flash on open.
  const [texts, setTexts] = useState<CustomText[] | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(() => {
    return getCustomTexts(db)
      .then(setTexts)
      .catch((e) => console.warn("Couldn't load texts", e));
  }, [db]);

  // Reload on focus so a new best WPM shows after practicing a text.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleSubmit = (text: {
    title: string;
    body: string;
    type: CustomTextType;
  }) => {
    return insertCustomText(db, text)
      .then(() => {
        setFormOpen(false);
        return load();
      })
      .catch((e) => {
        console.warn("Couldn't save text", e);
        Alert.alert("Couldn't save text", "Please try again.");
        throw e; // so the form keeps what was typed
      });
  };

  const handleDelete = (id: number) => {
    deleteCustomText(db, id)
      .then(load)
      .catch((e) => console.warn("Couldn't delete text", e));
  };

  // Custom texts are typed in full, so they always run in words mode.
  const handlePractice = (id: number) => {
    router.push({
      pathname: "/test",
      params: toTestParams({
        ...DEFAULT_CONFIG,
        mode: "words",
        textStyle: "custom",
        textId: id,
      }),
    });
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.title} accessibilityRole="header">
        My Texts
      </Text>
      <Text style={styles.subtitle}>
        Save your own quotes and code, then tap one to practice it.
      </Text>
      <AppButton
        title={formOpen ? "Cancel" : "Add text"}
        variant={formOpen ? "secondary" : "primary"}
        onPress={() => setFormOpen((open) => !open)}
      />
      {formOpen && (
        <Card>
          <TextForm onSubmit={handleSubmit} />
        </Card>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* The FlatList is the only scroll view; the form scrolls with it. */}
        <FlatList
          data={texts ?? []}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TextCard
              text={item}
              onPress={() => handlePractice(item.id)}
              onDelete={() => handleDelete(item.id)}
            />
          )}
          ListHeaderComponent={header}
          ListEmptyComponent={
            texts && !formOpen ? (
              <EmptyState
                icon={{ ios: "doc.text", android: "article" }}
                title="No texts yet"
                message="Add a quote or code snippet you want to get faster at typing."
              />
            ) : null
          }
          ItemSeparatorComponent={Separator}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Separator() {
  return <View style={{ height: spacing.sm }} />;
}

function makeStyles({ colors, spacing, textStyles }: Theme) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg },
    fill: { flex: 1 },
    content: { padding: spacing.lg },
    header: { gap: spacing.md, marginBottom: spacing.lg },
    title: { ...textStyles.largeTitle, color: colors.text },
    subtitle: { ...textStyles.body, color: colors.muted },
  });
}
