export type Mode = "timed" | "words";
export type QuoteLength = "medium" | "long";
export type TextStyleOption = "random" | "quote" | "code" | "custom";

export type TestConfig = {
  mode: Mode;
  time: number; // seconds, used when mode is "timed"
  wordCount: number; // used when mode is "words"
  quoteLength: QuoteLength;
  textStyle: TextStyleOption;
  textId?: number; // only set when textStyle is "custom"
};

export type TestStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  errors: number;
  correctChars: number;
  characters: number;
  elapsedMs: number;
};
