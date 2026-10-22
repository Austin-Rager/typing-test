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

// A finished test as stored in the test_results table.
export type TestResult = TestStats &
  TestConfig & {
    id: number;
    configKey: string;
    createdAt: number; // ms since epoch
  };

export type CustomTextType = "quote" | "code";

// A user-added text from the custom_texts table.
export type CustomText = {
  id: number;
  title: string;
  body: string;
  type: CustomTextType;
  bestWpm: number | null; // null until the text has been practiced
  createdAt: number; // ms since epoch
};
