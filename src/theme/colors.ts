
export type Palette = {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  danger: string;
  success: string;
};

export const lightPalette: Palette = {
  bg: "#F3F5F8",
  surface: "#FFFFFF",
  border: "#DDE3EA",
  text: "#0E1621",
  muted: "#5B6776",
  accent: "#0F766E",
  onAccent: "#FFFFFF",
  danger: "#C62828",
  success: "#15803D",
};

export const darkPalette: Palette = {
  bg: "#0B1118",
  surface: "#151D28",
  border: "#263241",
  text: "#E6EDF3",
  muted: "#98A6B6",
  accent: "#2DD4BF",
  onAccent: "#0B1118",
  danger: "#FF7B7B",
  success: "#4ADE80",
};

export type AccentName = "teal" | "blue" | "violet" | "amber" | "rose";

export const ACCENTS: Record<AccentName, { light: string; dark: string }> = {
  teal: { light: "#0F766E", dark: "#2DD4BF" },
  blue: { light: "#1D4ED8", dark: "#60A5FA" },
  violet: { light: "#6D28D9", dark: "#A78BFA" },
  amber: { light: "#B45309", dark: "#FBBF24" },
  rose: { light: "#BE123C", dark: "#FB7185" },
};
