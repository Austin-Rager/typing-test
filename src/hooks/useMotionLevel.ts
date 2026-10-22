import { Gyroscope } from "expo-sensors";
import { useEffect, useEffectEvent, useRef, useState } from "react";

const UPDATE_INTERVAL_MS = 100;
// The meter doesn't need 10 renders a second; this keeps typing smooth.
const RENDER_INTERVAL_MS = 300;
// Weight of each new sample in the smoothed level the meter shows.
const SMOOTHING = 0.3;

// Tracks how much the phone is rotating (rad/s) from the gyroscope.
// `level` is a smoothed live value for a meter. While `recording` is true,
// every sample also goes into a running average, read with getAverage().
export function useMotionLevel({ recording }: { recording: boolean }) {
  const [available, setAvailable] = useState(false);
  const [level, setLevel] = useState(0);

  const smoothedRef = useRef(0);
  const sumRef = useRef(0);
  const countRef = useRef(0);
  const lastRenderRef = useRef(0);

  const onSample = useEffectEvent((magnitude: number) => {
    smoothedRef.current =
      smoothedRef.current * (1 - SMOOTHING) + magnitude * SMOOTHING;

    if (recording) {
      sumRef.current += magnitude;
      countRef.current += 1;
    }

    const now = Date.now();
    if (now - lastRenderRef.current >= RENDER_INTERVAL_MS) {
      lastRenderRef.current = now;
      setLevel(smoothedRef.current);
    }
  });

  useEffect(() => {
    let cancelled = false;
    let subscription: { remove: () => void } | undefined;

    Gyroscope.isAvailableAsync()
      .then((ok) => {
        if (!ok || cancelled) return;
        setAvailable(true);
        Gyroscope.setUpdateInterval(UPDATE_INTERVAL_MS);
        subscription = Gyroscope.addListener(({ x, y, z }) => {
          onSample(Math.sqrt(x * x + y * y + z * z));
        });
      })
      .catch((e) => console.warn("Gyroscope unavailable", e));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  return {
    available,
    level,
    // Average rad/s while recording, or null if nothing was recorded.
    getAverage(): number | null {
      return countRef.current > 0 ? sumRef.current / countRef.current : null;
    },
    reset() {
      sumRef.current = 0;
      countRef.current = 0;
      smoothedRef.current = 0;
      setLevel(0);
    },
  };
}
