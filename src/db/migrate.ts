import type { SQLiteDatabase } from "expo-sqlite";

const DATABASE_VERSION = 1;

// Runs once per launch from SQLiteProvider's onInit. user_version tracks which
// migrations have already been applied, so reloading doesn't re-run them.
export function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  return db
    .getFirstAsync<{ user_version: number }>("PRAGMA user_version")
    .then((row) => {
      const currentVersion = row?.user_version ?? 0;
      if (currentVersion >= DATABASE_VERSION) return;

      // Version 0 -> 1: initial schema.
      return db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE test_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wpm INTEGER NOT NULL,
          raw_wpm INTEGER NOT NULL,
          accuracy INTEGER NOT NULL,
          errors INTEGER NOT NULL,
          characters INTEGER NOT NULL,
          elapsed_ms INTEGER NOT NULL,
          mode TEXT NOT NULL,
          time INTEGER,
          word_count INTEGER,
          quote_length TEXT,
          text_style TEXT NOT NULL,
          text_id INTEGER,
          config_key TEXT NOT NULL,
          created_at INTEGER NOT NULL
        );
        CREATE INDEX idx_results_config ON test_results(config_key);
        CREATE TABLE custom_texts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('quote', 'code')),
          best_wpm INTEGER,
          created_at INTEGER NOT NULL
        );
        PRAGMA user_version = ${DATABASE_VERSION};
      `);
    });
}
