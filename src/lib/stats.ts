import type { TestStats } from "@/types/test";

// Floor for elapsed time so finishing instantly can't divide by ~0.
const MIN_ELAPSED_MS = 1000;

export function computeStats(
  target: string,
  typed: string,
  elapsedMs: number,
): TestStats {
  let correctChars = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === target[i]) correctChars++;
  }

  const characters = typed.length;
  const minutes = Math.max(elapsedMs, MIN_ELAPSED_MS) / 60000;

  return {
    wpm: Math.round(correctChars / 5 / minutes),
    rawWpm: Math.round(characters / 5 / minutes),
    accuracy: characters ? Math.round((correctChars / characters) * 100) : 100,
    errors: characters - correctChars,
    correctChars,
    characters,
    elapsedMs,
  };
}
