import { CODE_SNIPPETS } from "@/data/codeSnippets";
import { QUOTES } from "@/data/quotes";
import { pickRandomWords } from "@/data/words";
import type { TestConfig } from "@/types/test";

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function generateTargetText(
  config: TestConfig,
  customBody?: string,
): string {
  switch (config.textStyle) {
    case "random": {
      // Timed tests need enough words that nobody runs out before the clock does.
      const count = config.mode === "words" ? config.wordCount : config.time * 3;
      return pickRandomWords(count).join(" ");
    }
    case "quote":
      return pickOne(QUOTES[config.quoteLength]);
    case "code":
      return pickOne(CODE_SNIPPETS[config.quoteLength]);
    case "custom":
      return customBody ?? "";
  }
}
