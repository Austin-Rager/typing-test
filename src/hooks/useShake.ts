import { Accelerometer } from "expo-sensors";
import { useEffect, useEffectEvent, useRef } from "react";

type Options = {
  enabled: boolean;
  threshold?: number; // total acceleration in g; about 1.0 at rest
  debounceMs?: number; // one shake keeps reading high for a while; count it once
};

// Calls onShake when the phone is shaken firmly. The accelerometer is only
// subscribed while enabled and the calling screen is mounted.
export function useShake(
  onShake: () => void,
  { enabled, threshold = 1.8, debounceMs = 1200 }: Options,
) {
  const lastShakeRef = useRef(0);
  // Always calls the latest onShake without re-subscribing on every render.
  const handleShake = useEffectEvent(onShake);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    Accelerometer.isAvailableAsync()
      .then((available) => {
        // The screen may have unmounted before availability came back.
        if (!available || cancelled) return;
        Accelerometer.setUpdateInterval(100);
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          const g = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();
          if (g > threshold && now - lastShakeRef.current > debounceMs) {
            lastShakeRef.current = now;
            handleShake();
          }
        });
      })
      .catch((e) => console.warn("Accelerometer unavailable", e));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, threshold, debounceMs]);
}
