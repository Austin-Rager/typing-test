import { useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback } from "react";

import { PlaceholderScreen } from "@/components/PlaceholderScreen";
import { getAllResults, getSummary } from "@/db/testResults";

export default function History() {
  const db = useSQLiteContext();

  // TEMP (T10–T12 check): log the DB contents every time this tab is opened.
  useFocusEffect(
    useCallback(() => {
      db.getFirstAsync<{ user_version: number }>("PRAGMA user_version").then((r) =>
        console.log("user_version:", r?.user_version),
      );
      getSummary(db).then((s) => console.log("summary:", s));
      getAllResults(db).then((rows) => console.log("results:", rows));
    }, [db]),
  );

  return (
    <PlaceholderScreen
      title="History"
      message="Your past tests will show up here."
    />
  );
}
