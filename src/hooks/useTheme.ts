import { useColorScheme } from "react-native";

import { useSettings } from "@/context/SettingsContext";
import { ACCENTS, darkPalette, lightPalette, type Palette } from "@/theme/colors";
import { radius, spacing } from "@/theme/tokens";
import { fonts, textStyles } from "@/theme/typography";

export type Theme = {
  scheme: "light" | "dark";
  colors: Palette;
  spacing: typeof spacing;
  radius: typeof radius;
  fonts: typeof fonts;
  textStyles: typeof textStyles;
  typingFontSize: number;
};

export function useTheme(): Theme {
  const { settings } = useSettings();
  const systemScheme = useColorScheme();

  const scheme =
    settings.theme === "system"
      ? systemScheme === "dark"
        ? "dark"
        : "light"
      : settings.theme;

  const base = scheme === "dark" ? darkPalette : lightPalette;

  return {
    scheme,
    colors: { ...base, accent: ACCENTS[settings.accent][scheme] },
    spacing,
    radius,
    fonts,
    textStyles,
    typingFontSize: settings.typingFontSize,
  };
}
