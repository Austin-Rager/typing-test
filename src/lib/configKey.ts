import type { TestConfig } from "@/types/test";

// Groups results that are fair to compare, e.g. for personal bests.
// Random words don't use quote length, so it's left out of their key.
export function getConfigKey(config: TestConfig): string {
  if (config.textStyle === "custom") return `custom-${config.textId}`;

  const length =
    config.mode === "timed" ? `timed-${config.time}` : `words-${config.wordCount}`;
  if (config.textStyle === "random") return `${length}-random`;
  return `${length}-${config.textStyle}-${config.quoteLength}`;
}
