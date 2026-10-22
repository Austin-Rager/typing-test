import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

import { useTheme, type Theme } from "@/hooks/useTheme";
import { MIN_TOUCH } from "@/theme/tokens";

type Props = {
  color: string;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function AccentSwatch({ color, label, selected, onPress }: Props) {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.swatch,
        { backgroundColor: color },
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="radio"
      accessibilityLabel={`${label} accent`}
      accessibilityState={{ selected, checked: selected }}
    >
      {selected ? (
        <SymbolView
          name={{ ios: "checkmark", android: "check" }}
          size={20}
          weight="bold"
          tintColor={theme.colors.onAccent}
        />
      ) : null}
    </Pressable>
  );
}

function makeStyles({ colors }: Theme) {
  return StyleSheet.create({
    swatch: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      borderRadius: MIN_TOUCH / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    // Ring in the text color so the selection reads in both themes.
    selected: { borderWidth: 3, borderColor: colors.text },
    pressed: { opacity: 0.75 },
  });
}
