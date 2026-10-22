import Storage from "expo-sqlite/kv-store";
import { createContext, useContext, useState, type ReactNode } from "react";

import { ACCENTS, type AccentName } from "@/theme/colors";

export type ThemePreference = "system" | "light" | "dark";

export type Settings = {
  theme: ThemePreference;
  accent: AccentName;
  typingFontSize: number;
  hapticsEnabled: boolean;
  shakeToRestart: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  accent: "teal",
  typingFontSize: 20,
  hapticsEnabled: true,
  shakeToRestart: true,
};

const STORAGE_KEY = "settings";
const THEMES: ThemePreference[] = ["system", "light", "dark"];

type SettingsContextValue = {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

// Reads synchronously so the first frame already has the saved theme (no flash).
function loadSettingsSync(): Settings {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const saved = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as Settings;

    // A bad stored value shouldn't crash the theme lookup.
    if (!THEMES.includes(saved.theme)) saved.theme = DEFAULT_SETTINGS.theme;
    if (!(saved.accent in ACCENTS)) saved.accent = DEFAULT_SETTINGS.accent;
    return saved;
  } catch (e) {
    console.warn("Couldn't load settings", e);
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  Storage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(console.warn);
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => loadSettingsSync());

  function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
  }

  function resetSettings() {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }

  return (
    <SettingsContext.Provider
      value={{ settings, updateSetting, resetSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used inside a SettingsProvider");
  }
  return context;
}
