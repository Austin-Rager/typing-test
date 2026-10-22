import type { TestConfig } from "@/types/test";

// Built once; creating a DateTimeFormat for every row is slow.
const dateFormat = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// e.g. "Oct 22, 3:41 PM"
export function formatDate(ms: number): string {
  return dateFormat.format(ms);
}

// e.g. "12.4s" under a minute, "1:05" from a minute up.
export function formatDuration(ms: number): string {
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// e.g. ["60s", "random"], ["30 words", "quote", "long"], ["My text", "Gettysburg"]
// Custom texts need their title passed in, since the config only has the id:
// undefined means the title isn't known, null means the text was deleted.
export function getConfigParts(
  config: TestConfig,
  customTitle?: string | null,
): string[] {
  if (config.textStyle === "custom") {
    if (customTitle === null) return ["Deleted text"];
    return customTitle ? ["My text", customTitle] : ["My text"];
  }

  const length =
    config.mode === "timed" ? `${config.time}s` : `${config.wordCount} words`;
  if (config.textStyle === "random") return [length, "random"];
  return [length, config.textStyle, config.quoteLength];
}

// e.g. "60s · random", "30 words · quote · long", "My text: Gettysburg"
export function formatConfig(
  config: TestConfig,
  customTitle?: string | null,
): string {
  if (config.textStyle === "custom" && customTitle) {
    return `My text: ${customTitle}`;
  }
  return getConfigParts(config, customTitle).join(" · ");
}
