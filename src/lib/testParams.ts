import type {
  Mode,
  QuoteLength,
  TestConfig,
  TestStats,
  TextStyleOption,
} from "@/types/test";

export const DEFAULT_CONFIG: TestConfig = {
  mode: "timed",
  time: 60,
  wordCount: 30,
  quoteLength: "medium",
  textStyle: "random",
};

const MODES: Mode[] = ["timed", "words"];
const QUOTE_LENGTHS: QuoteLength[] = ["medium", "long"];
const TEXT_STYLES: TextStyleOption[] = ["random", "quote", "code", "custom"];

type RawParams = Record<string, string | string[] | undefined>;

// Expo Router gives an array when a param is repeated; we only want one value.
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function pickOption<T extends string>(
  value: string | undefined,
  options: T[],
  fallback: T,
): T {
  return options.includes(value as T) ? (value as T) : fallback;
}

function toPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export function toTestParams(config: TestConfig): Record<string, string> {
  const params: Record<string, string> = {
    mode: config.mode,
    time: String(config.time),
    wordCount: String(config.wordCount),
    quoteLength: config.quoteLength,
    textStyle: config.textStyle,
  };
  if (config.textId !== undefined) params.textId = String(config.textId);
  return params;
}

export function parseTestParams(params: RawParams): TestConfig | null {
  const textStyle = pickOption(
    first(params.textStyle),
    TEXT_STYLES,
    DEFAULT_CONFIG.textStyle,
  );
  const textId = first(params.textId);

  // A custom text test means nothing without the text it points to.
  if (textStyle === "custom" && textId === undefined) return null;

  return {
    mode: pickOption(first(params.mode), MODES, DEFAULT_CONFIG.mode),
    time: toPositiveInt(first(params.time), DEFAULT_CONFIG.time),
    wordCount: toPositiveInt(first(params.wordCount), DEFAULT_CONFIG.wordCount),
    quoteLength: pickOption(
      first(params.quoteLength),
      QUOTE_LENGTHS,
      DEFAULT_CONFIG.quoteLength,
    ),
    textStyle,
    ...(textStyle === "custom" && {
      textId: toPositiveInt(textId, 0),
    }),
  };
}

// Fallback for when saving to the DB fails: stats travel as flat params instead.
export function toStatsParams(stats: TestStats): Record<string, string> {
  return {
    wpm: String(stats.wpm),
    rawWpm: String(stats.rawWpm),
    accuracy: String(stats.accuracy),
    errors: String(stats.errors),
    correctChars: String(stats.correctChars),
    characters: String(stats.characters),
    elapsedMs: String(stats.elapsedMs),
  };
}

export function parseStatsParams(params: RawParams): TestStats | null {
  const read = (key: keyof TestStats) => {
    const n = Number(first(params[key]));
    return Number.isFinite(n) ? n : null;
  };

  const wpm = read("wpm");
  const accuracy = read("accuracy");
  if (wpm === null || accuracy === null) return null;

  return {
    wpm,
    rawWpm: read("rawWpm") ?? wpm,
    accuracy,
    errors: read("errors") ?? 0,
    correctChars: read("correctChars") ?? 0,
    characters: read("characters") ?? 0,
    elapsedMs: read("elapsedMs") ?? 0,
  };
}
