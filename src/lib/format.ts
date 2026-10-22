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

// e.g. "60s · random", "30 words · quote · long", "My text: Gettysburg"
// Custom texts need their title passed in, since the config only has the id.
export function formatConfig(config: TestConfig, customTitle?: string): string {
  if (config.textStyle === "custom") {
    return customTitle ? `My text: ${customTitle}` : "My text";
  }

  const length =
    config.mode === "timed" ? `${config.time}s` : `${config.wordCount} words`;
  if (config.textStyle === "random") return `${length} · random`;
  return `${length} · ${config.textStyle} · ${config.quoteLength}`;
}
