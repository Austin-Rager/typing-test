import type { TextStyle } from "react-native";

export const fonts = {
  ui: "Manrope_400Regular",
  uiMedium: "Manrope_600SemiBold",
  uiBold: "Manrope_700Bold",
  mono: "JetBrainsMono_400Regular",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export type TextStyleName =
  | "largeTitle"
  | "title"
  | "headline"
  | "body"
  | "caption"
  | "stat";

export const textStyles: Record<TextStyleName, TextStyle> = {
  largeTitle: { fontFamily: fonts.uiBold, fontSize: 32, lineHeight: 40 },
  title: { fontFamily: fonts.uiBold, fontSize: 22, lineHeight: 28 },
  headline: { fontFamily: fonts.uiMedium, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.ui, fontSize: 16, lineHeight: 22 },
  caption: { fontFamily: fonts.ui, fontSize: 13, lineHeight: 18 },
  stat: { fontFamily: fonts.monoBold, fontSize: 28, lineHeight: 34 },
};
