import type { SQLiteDatabase } from "expo-sqlite";

import type { CustomText, CustomTextType } from "@/types/test";

// Shape of a custom_texts row as SQLite returns it.
type CustomTextRow = {
  id: number;
  title: string;
  body: string;
  type: string;
  best_wpm: number | null;
  created_at: number;
};

function rowToCustomText(row: CustomTextRow): CustomText {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type as CustomTextType,
    bestWpm: row.best_wpm,
    createdAt: row.created_at,
  };
}

export function insertCustomText(
  db: SQLiteDatabase,
  text: { title: string; body: string; type: CustomTextType },
): Promise<number> {
  return db
    .runAsync(
      "INSERT INTO custom_texts (title, body, type, created_at) VALUES (?, ?, ?, ?)",
      [text.title, text.body, text.type, Date.now()],
    )
    .then((result) => result.lastInsertRowId);
}

// Newest first.
export function getCustomTexts(db: SQLiteDatabase): Promise<CustomText[]> {
  return db
    .getAllAsync<CustomTextRow>(
      "SELECT * FROM custom_texts ORDER BY created_at DESC, id DESC",
    )
    .then((rows) => rows.map(rowToCustomText));
}

export function getCustomText(
  db: SQLiteDatabase,
  id: number,
): Promise<CustomText | null> {
  return db
    .getFirstAsync<CustomTextRow>("SELECT * FROM custom_texts WHERE id = ?", [id])
    .then((row) => (row ? rowToCustomText(row) : null));
}

// Results typed from this text stay in test_results; History shows them as
// "Deleted text" since their text_id no longer matches a row here.
export function deleteCustomText(db: SQLiteDatabase, id: number): Promise<void> {
  return db
    .runAsync("DELETE FROM custom_texts WHERE id = ?", [id])
    .then(() => undefined);
}

// Only ever raises the stored best, so a slower run can't overwrite it.
export function updateBestWpm(
  db: SQLiteDatabase,
  id: number,
  wpm: number,
): Promise<void> {
  return db
    .runAsync(
      "UPDATE custom_texts SET best_wpm = MAX(COALESCE(best_wpm, 0), ?) WHERE id = ?",
      [wpm, id],
    )
    .then(() => undefined);
}
