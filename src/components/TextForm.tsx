import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { FormField } from "@/components/FormField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { useTheme, type Theme } from "@/hooks/useTheme";
import {
  BODY_MAX,
  TITLE_MAX,
  normalizeText,
  validateText,
} from "@/lib/validateText";
import type { CustomTextType } from "@/types/test";

const TYPE_OPTIONS: { value: CustomTextType; label: string }[] = [
  { value: "quote", label: "Quote" },
  { value: "code", label: "Code" },
];

type Props = {
  // Resolves once saved; the form clears itself then.
  onSubmit: (text: {
    title: string;
    body: string;
    type: CustomTextType;
  }) => Promise<void>;
};

export function TextForm({ onSubmit }: Props) {
  const styles = makeStyles(useTheme());

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<CustomTextType>("quote");
  // Errors stay hidden until a field has been left, so typing isn't nagged.
  const [touched, setTouched] = useState({ title: false, body: false });
  const [saving, setSaving] = useState(false);

  const errors = validateText({ title, body });
  const isValid = !errors.title && !errors.body;
  const isCode = type === "code";

  const handleSave = () => {
    if (!isValid || saving) return;
    setSaving(true);
    onSubmit({ title: title.trim(), body: normalizeText(body), type })
      .then(() => {
        setTitle("");
        setBody("");
        setType("quote");
        setTouched({ title: false, body: false });
      })
      // The screen reports the failure; keep what was typed so it can be retried.
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <View style={styles.form}>
      <FormField
        label="Title"
        value={title}
        onChangeText={setTitle}
        onBlur={() => setTouched((t) => ({ ...t, title: true }))}
        error={touched.title ? errors.title : undefined}
        maxLength={TITLE_MAX}
        placeholder="e.g. Favorite quote"
        returnKeyType="next"
      />
      <SegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />
      <FormField
        label="Text"
        value={body}
        onChangeText={setBody}
        onBlur={() => setTouched((t) => ({ ...t, body: true }))}
        error={touched.body ? errors.body : undefined}
        maxLength={BODY_MAX}
        multiline
        mono={isCode}
        placeholder={isCode ? "Paste a code snippet" : "Paste or type a quote"}
        // Autocorrect would "fix" code and the exact wording of quotes.
        autoCorrect={false}
        autoCapitalize={isCode ? "none" : "sentences"}
        spellCheck={!isCode}
      />
      <AppButton
        title={saving ? "Saving…" : "Save text"}
        onPress={handleSave}
        disabled={!isValid || saving}
      />
    </View>
  );
}

function makeStyles({ spacing }: Theme) {
  return StyleSheet.create({
    form: { gap: spacing.md },
  });
}
