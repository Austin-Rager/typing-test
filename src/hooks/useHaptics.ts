import * as Haptics from "expo-haptics";
import { useRef } from "react";

import { useSettings } from "@/context/SettingsContext";

// Mashing wrong keys shouldn't turn into one continuous buzz.
const ERROR_THROTTLE_MS = 80;

// Every method is a no-op when haptics are off in Settings. Haptics can fail
// (e.g. unsupported hardware), and that should never surface as an error.
export function useHaptics() {
  const { settings } = useSettings();
  const lastErrorRef = useRef(0);
  const enabled = settings.hapticsEnabled;

  function play(effect: () => Promise<void>) {
    if (!enabled) return;
    effect().catch(() => {});
  }

  return {
    error() {
      const now = Date.now();
      if (now - lastErrorRef.current < ERROR_THROTTLE_MS) return;
      lastErrorRef.current = now;
      play(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
      );
    },
    success() {
      play(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      );
    },
    light() {
      play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    },
    selection() {
      play(() => Haptics.selectionAsync());
    },
  };
}
