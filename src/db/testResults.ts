import type { SQLiteDatabase } from "expo-sqlite";

import { getConfigKey } from "@/lib/configKey";
import { DEFAULT_CONFIG } from "@/lib/testParams";
import type {
  Mode,
  QuoteLength,
  TestConfig,
  TestResult,
  TestStats,
  TextStyleOption,
} from "@/types/test";

// Shape of a test_results row as SQLite returns it.
type TestResultRow = {
  id: number;
  wpm: number;
  raw_wpm: number;
  accuracy: number;
  errors: number;
  characters: number;
  elapsed_ms: number;
  mode: string;
  time: number | null;
  word_count: number | null;
  quote_length: string | null;
  text_style: string;
  text_id: number | null;
  config_key: string;
  created_at: number;
};

// Columns that don't apply to a config are stored as NULL, so fall back to
// the defaults when reading them back into a full TestConfig.
function rowToResult(row: TestResultRow): TestResult {
  return {
    id: row.id,
    wpm: row.wpm,
    rawWpm: row.raw_wpm,
    accuracy: row.accuracy,
    errors: row.errors,
    // Not stored: every typed character is either correct or an error.
    correctChars: row.characters - row.errors,
    characters: row.characters,
    elapsedMs: row.elapsed_ms,
    mode: row.mode as Mode,
    time: row.time ?? DEFAULT_CONFIG.time,
    wordCount: row.word_count ?? DEFAULT_CONFIG.wordCount,
    quoteLength: (row.quote_length as QuoteLength | null) ?? DEFAULT_CONFIG.quoteLength,
    textStyle: row.text_style as TextStyleOption,
    ...(row.text_id !== null && { textId: row.text_id }),
    configKey: row.config_key,
    createdAt: row.created_at,
  };
}

export function insertTestResult(
  db: SQLiteDatabase,
  config: TestConfig,
  stats: TestStats,
): Promise<number> {
  const usesQuoteLength =
    config.textStyle === "quote" || config.textStyle === "code";

  return db
    .runAsync(
      `INSERT INTO test_results (
        wpm, raw_wpm, accuracy, errors, characters, elapsed_ms,
        mode, time, word_count, quote_length, text_style, text_id,
        config_key, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stats.wpm,
        stats.rawWpm,
        stats.accuracy,
        stats.errors,
        stats.characters,
        stats.elapsedMs,
        config.mode,
        config.mode === "timed" ? config.time : null,
        config.mode === "words" ? config.wordCount : null,
        usesQuoteLength ? config.quoteLength : null,
        config.textStyle,
        config.textStyle === "custom" ? (config.textId ?? null) : null,
        getConfigKey(config),
        Date.now(),
      ],
    )
    .then((result) => result.lastInsertRowId);
}

export function getTestResult(
  db: SQLiteDatabase,
  id: number,
): Promise<TestResult | null> {
  return db
    .getFirstAsync<TestResultRow>("SELECT * FROM test_results WHERE id = ?", [id])
    .then((row) => (row ? rowToResult(row) : null));
}

// Newest first.
export function getAllResults(db: SQLiteDatabase): Promise<TestResult[]> {
  return db
    .getAllAsync<TestResultRow>(
      "SELECT * FROM test_results ORDER BY created_at DESC, id DESC",
    )
    .then((rows) => rows.map(rowToResult));
}

// Newest first, at most `limit` rows.
export function getRecentResults(
  db: SQLiteDatabase,
  limit: number,
): Promise<TestResult[]> {
  return db
    .getAllAsync<TestResultRow>(
      "SELECT * FROM test_results ORDER BY created_at DESC, id DESC LIMIT ?",
      [limit],
    )
    .then((rows) => rows.map(rowToResult));
}

// Best WPM overall, or for one config. Pass beforeId to only count results
// saved before that one (ids only go up), so a result can be compared with
// the best at the time it was taken. Null when there are no results.
export function getBestWpm(
  db: SQLiteDatabase,
  configKey?: string,
  beforeId?: number,
): Promise<number | null> {
  // Only fixed clause text is joined here; values always go through binding.
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (configKey !== undefined) {
    where.push("config_key = ?");
    params.push(configKey);
  }
  if (beforeId !== undefined) {
    where.push("id < ?");
    params.push(beforeId);
  }
  const whereSql = where.length ? ` WHERE ${where.join(" AND ")}` : "";

  return db
    .getFirstAsync<{ best: number | null }>(
      `SELECT MAX(wpm) AS best FROM test_results${whereSql}`,
      params,
    )
    .then((row) => row?.best ?? null);
}

export function getSummary(
  db: SQLiteDatabase,
): Promise<{ best: number; average: number; total: number }> {
  return db
    .getFirstAsync<{ best: number | null; average: number | null; total: number }>(
      "SELECT MAX(wpm) AS best, ROUND(AVG(wpm)) AS average, COUNT(*) AS total FROM test_results",
    )
    .then((row) => ({
      // MAX and AVG are NULL on an empty table.
      best: row?.best ?? 0,
      average: row?.average ?? 0,
      total: row?.total ?? 0,
    }));
}

export function deleteTestResult(db: SQLiteDatabase, id: number): Promise<void> {
  return db
    .runAsync("DELETE FROM test_results WHERE id = ?", [id])
    .then(() => undefined);
}

export function clearTestResults(db: SQLiteDatabase): Promise<void> {
  return db.runAsync("DELETE FROM test_results").then(() => undefined);
}
