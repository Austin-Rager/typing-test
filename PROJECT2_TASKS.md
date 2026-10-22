# Project 2 Implementation Plan (SE-3010 Typing Test)

Generated from `PROJECT2_PLAN_PROMPT.md`. Work through the tasks in order; the app should build and run at the end of every phase.

---

## Step 1: What exists today

- **Location:** routes live in `src/app/` (not `app/`). `tsconfig.json` maps `@/*` to `./src/*`, so new folders go under `src/` and are imported as `@/components/...`.
- **Screens (4 files, ~630 lines):**
  - `src/app/_layout.tsx` sets up a `Stack` with no headers and loads `JetBrainsMono_400Regular` (it shows a blank white `View` while loading). It registers `index`, `test` and **`results`**, but the file is named `result.tsx`.
  - `src/app/index.tsx` is the Home screen. It has local state for `mode` (timed/words), `time` (30/60/120), `wordCount` (10/30/50), `quoteLength` (medium/long) and `textStyle` (random/quote/code), and its Start button calls `router.push("/test", { settings: JSON.stringify(...) })`. `OptionButton` is defined inside this file.
  - `src/app/test.tsx` holds a 10-word list, 2 quotes per length, 1 code snippet per length, and `generateTargetText()`. It renders the target text per character with a hidden `TextInput`, uses a 250 ms interval timer, and gives haptics on every wrong character and on finish. `endTest()` pushes `/result` with `results` and `settings` as JSON strings.
  - `src/app/result.tsx` shows big WPM, a 2×2 `StatBox` grid (with `StatBox` defined inline), the config line, and "Try again" / "Back to home" (both `router.push`).
- **Params:** `settings` (a JSON string of the `Settings` union) goes Home → Test → Result → Test. `results` (a JSON string of `{wpm, accuracy, errors, characters}`) goes Test → Result. The `Settings` type is duplicated in `test.tsx` and `result.tsx`.
- **Packages that matter:** Expo SDK 57 (`expo ~57.0.23`), RN 0.86, React 19.2, `expo-router ~57`, `expo-haptics`, `expo-font`, `@expo-google-fonts/jetbrains-mono`, `expo-symbols`, `expo-splash-screen`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`. `app.json` has `typedRoutes` and `reactCompiler` on and `userInterfaceStyle: "automatic"`.
- **Not installed yet:** any storage library, `expo-sensors`, `react-native-svg`, a Manrope font package, a slider.
- **Styling:** all hex values are hardcoded, there's no dark mode, and the JetBrains Mono font is loaded but never applied with `fontFamily`.
- **README:** your working copy has an uncommitted edit that removed the My Texts / Settings / Device / Wireframes sections and added "Implement Gyroscope (show the user how much they shake their phone)". See the assumptions below.

## Assumptions (instead of stopping to ask)

1. **Device feature:** the prompt says shake-to-restart with the Accelerometer, and that is the core task (T25). The gyroscope "steadiness" idea from your README edit is an optional stretch task (T26), since both come from `expo-sensors`.
2. **Storage choice: `expo-sqlite`** for test results and custom texts, plus **`expo-sqlite/kv-store`** for settings. Reasons:
   - One native package covers both.
   - History needs real queries: `MAX(wpm)` per config, `AVG`, `ORDER BY date LIMIT 7`, and deleting one row. With AsyncStorage you'd load the whole JSON array, filter it in JS, and rewrite the entire array on every save or delete.
   - Having two tables shows "2 different types of data" clearly for grading.
   - `kv-store` has `getItemSync`, so settings can load synchronously on startup with no theme flash.
3. The timer starts on the **first keystroke**, not when the screen mounts. This matches common typing-test convention and makes WPM fair.
4. A **personal best** is compared per `configKey`, for example `timed-60-random`, `words-30-quote-long` or `custom-<textId>`.
5. Test on a real phone with Expo Go or a dev build. Web is out of scope because `expo-sqlite` needs extra WASM setup and the accelerometer needs HTTPS there.
6. Accent color is chosen from a fixed palette. Each option has a light and a dark variant, so contrast holds in both themes.
7. Tabs use `import { Tabs } from 'expo-router/js-tabs'`. In SDK 57, importing `Tabs` from `expo-router` is deprecated. JS tabs allow a fully custom `tabBar` component; native tabs don't.
8. Code style throughout: `.then()` chains instead of `async/await`, and full-file rewrites when a task changes a file.

---

# Phase 0: Fix the existing code (no new features)

### T1. Fix the route name and pull shared types and data out of screens
- **Files:**
  - Modify `src/app/_layout.tsx`
  - Create `src/types/test.ts`, `src/data/words.ts`, `src/data/quotes.ts`, `src/data/codeSnippets.ts`
  - Modify `src/app/test.tsx` and `src/app/result.tsx`
- **Packages:** none
- **Steps:**
  1. In `_layout.tsx`, change `<Stack.Screen name="results" />` to `name="result"`.
  2. In `src/types/test.ts`, export:
     - `type Mode = "timed" | "words"`
     - `type QuoteLength = "medium" | "long"`
     - `type TextStyleOption = "random" | "quote" | "code" | "custom"`
     - `type TestConfig = { mode: Mode; time: number; wordCount: number; quoteLength: QuoteLength; textStyle: TextStyleOption; textId?: number }`. Use a flat object instead of a union: both counts always exist and `mode` decides which one is used. This makes params and DB columns simpler.
     - `type TestStats = { wpm: number; rawWpm: number; accuracy: number; errors: number; correctChars: number; characters: number; elapsedMs: number }`
  3. In `src/data/words.ts`, export `COMMON_WORDS: string[]` with about 200 common English words (lowercase, 2–8 letters, from a "top 200 English words" list). Add `pickRandomWords(count: number): string[]` that avoids repeating the same word twice in a row.
  4. Move the quotes into `src/data/quotes.ts` (`QUOTES: Record<QuoteLength, string[]>`, at least 6 per length) and the snippets into `src/data/codeSnippets.ts` (at least 4 per length, a mix of JS and TS).
  5. Create `src/lib/generateTargetText.ts` with `generateTargetText(config: TestConfig, customBody?: string): string`.
- **Acceptance:**
  - Finishing a test opens Results with no "route not found" warning in the Metro logs.
  - A random test of 50 words shows visible variety.
  - The app looks the same as before.
- **Requirement:** reusable code and Expo conventions (known problems #1 and #4)

### T2. Correct WPM and accuracy: pure stats function and refs
- **Files:**
  - Create `src/lib/stats.ts`
  - Rewrite `src/app/test.tsx`
- **Packages:** none
- **Steps:**
  1. In `stats.ts`, add `computeStats(target: string, typed: string, elapsedMs: number): TestStats`:
     - `correctChars` = matching characters at the same index
     - `characters = typed.length`
     - `errors = characters - correctChars`
     - `MIN_ELAPSED_MS = 1000`, and `minutes = Math.max(elapsedMs, MIN_ELAPSED_MS) / 60000`
     - `wpm = Math.round(correctChars / 5 / minutes)`
     - `rawWpm` is the same calculation using `characters`
     - `accuracy = characters ? Math.round(correctChars / characters * 100) : 100`
  2. In `test.tsx`, keep `typedRef = useRef("")` and `startTimeRef = useRef<number | null>(null)` alongside the state.
     - `handleChangeText` sets `startTimeRef` on the first keystroke and updates both `typedRef.current` and the state.
  3. Add `finishTest()`, which reads **only refs**: `computeStats(targetRef.current, typedRef.current, Date.now() - startTimeRef.current)`. This removes the stale closure.
     - Keep `hasEndedRef` so the test can only finish once.
  4. Handle the end conditions:
     - Timed mode: the interval tick checks `remaining <= 0` and calls `finishTest()`.
     - Words mode: `handleChangeText` checks whether `newText.length >= target.length` and calls `finishTest()` directly. No effect needed.
  5. Add `maxLength={targetText.length}` to the `TextInput`.
- **Acceptance:**
  - Type a 10-word test perfectly. WPM should be believable (roughly 30–90) and accuracy 100%.
  - Type one wrong character. Accuracy goes below 100 and errors = 1.
  - Finish the instant the screen opens. You don't get an `Infinity` WPM.
- **Requirement:** known problems #2 and #3

### T3. Replace JSON-string params with typed, flat params
- **Files:**
  - Create `src/lib/testParams.ts`
  - Rewrite `src/app/index.tsx`, `src/app/test.tsx`, `src/app/result.tsx`
- **Packages:** none
- **Steps:**
  1. In `testParams.ts`, add:
     - `toTestParams(config: TestConfig): Record<string, string>`. All values are strings, e.g. `{ mode: "timed", time: "60", wordCount: "30", quoteLength: "medium", textStyle: "random" }`.
     - `parseTestParams(params): TestConfig | null`, which validates each field and falls back to defaults.
  2. Home calls `router.push({ pathname: "/test", params: toTestParams(config) })`.
  3. Test reads `useLocalSearchParams()` and passes it to `parseTestParams`.
  4. **Interim step until T12:** Test → Result passes the config params plus the stats as flat params (`wpm`, `accuracy`, ...). In T12 this becomes just `resultId`.
  5. Test → Result uses `router.replace`, so Back doesn't return to a finished test.
  6. "Try again" uses `router.replace({ pathname: "/test", params })`.
- **Why this approach:**
  - Primitive params are typed (typedRoutes), readable in deep links, and don't need `JSON.parse` with try/catch.
  - The result itself is stored in the DB, so only an id needs to travel.
  - A global "current test" context is overkill here, and its state is lost on reload.
- **Acceptance:**
  - Start → finish → "Try again" uses the same config.
  - Pressing Back on Results goes to Home, not to the dead test.
  - There's no `JSON.stringify` left anywhere under `src/app`.
- **Requirement:** known problem #5 and Expo Router conventions

---

# Phase 1: Theme, fonts, Settings Context

### T4. Design tokens and Manrope font
- **Files:**
  - Create `src/theme/colors.ts`, `src/theme/tokens.ts`, `src/theme/typography.ts`
  - Rewrite `src/app/_layout.tsx`
- **Packages:**
  ```bash
  npx expo install @expo-google-fonts/manrope
  ```
- **Steps:**
  1. In `colors.ts`, define `type Palette = { bg; surface; border; text; muted; accent; onAccent; danger; success }`.
     - `lightPalette`: bg `#F3F5F8`, surface `#FFFFFF`, border `#DDE3EA`, text `#0E1621`, muted `#5B6776`, accent `#0F766E`, danger `#C62828`, onAccent `#FFFFFF`
     - `darkPalette`: bg `#0B1118`, surface `#151D28`, border `#263241`, text `#E6EDF3`, muted `#98A6B6`, accent `#2DD4BF`, danger `#FF7B7B`, onAccent `#0B1118`
  2. Also in `colors.ts`, define `ACCENTS: Record<AccentName, { light: string; dark: string }>` with `teal` (the defaults above), `blue`, `violet`, `amber` and `rose`. Pick values that reach a contrast ratio of at least 4.5 against `surface`.
  3. In `tokens.ts`, add:
     - `spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }`
     - `radius = { sm: 10, md: 14, lg: 16, pill: 999 }`
     - `MIN_TOUCH = 44`
  4. In `typography.ts`, add a `fonts` object: `ui: "Manrope_400Regular"`, `uiMedium: "Manrope_600SemiBold"`, `uiBold: "Manrope_700Bold"`, `mono: "JetBrainsMono_400Regular"`, `monoBold: "JetBrainsMono_700Bold"`.
     - Use these family names instead of `fontWeight`, which Android ignores for custom fonts.
     - Add a `textStyles` scale: `largeTitle 32`, `title 22`, `headline 17`, `body 16`, `caption 13`, `stat 28 mono`.
  5. In `_layout.tsx`:
     - Load the Manrope weights and the JetBrains Mono weights with `useFonts`.
     - Call `SplashScreen.preventAutoHideAsync()` at module scope, and `SplashScreen.hideAsync()` once the fonts load. This replaces the blank white View.
- **Acceptance:**
  - The app launches with the splash screen and no white flash.
  - A temporary `<Text style={{ fontFamily: fonts.ui }}>` renders in Manrope.
- **Requirement:** professional styling (HIG/Material typography)

### T5. SettingsContext with persistence and a derived theme
- **Files:**
  - Create `src/context/SettingsContext.tsx`, `src/hooks/useTheme.ts`
  - Rewrite `src/app/_layout.tsx`
- **Packages:**
  ```bash
  npx expo install expo-sqlite
  ```
- **Steps:**
  1. Define the settings type and defaults:
     - `type ThemePreference = "system" | "light" | "dark"`
     - `type Settings = { theme: ThemePreference; accent: AccentName; typingFontSize: number; hapticsEnabled: boolean; shakeToRestart: boolean }`
     - `DEFAULT_SETTINGS = { theme: "system", accent: "teal", typingFontSize: 20, hapticsEnabled: true, shakeToRestart: true }`
  2. In `SettingsProvider`:
     - `useState<Settings>(() => loadSettingsSync())`, where `loadSettingsSync` calls `Storage.getItemSync("settings")` from `expo-sqlite/kv-store`, then `JSON.parse` inside try/catch, merged over the defaults.
     - `updateSetting<K extends keyof Settings>(key: K, value: Settings[K])` updates state, then calls `Storage.setItem("settings", JSON.stringify(next)).catch(console.warn)`.
     - Add `resetSettings()`.
  3. Export `useSettings()`. It throws if used outside the provider.
  4. Build the theme in `useTheme.ts`:
     - `useTheme(): Theme`, where `Theme = { scheme: "light" | "dark"; colors: Palette; spacing; radius; fonts; typingFontSize }`
     - Use `useColorScheme()` from `react-native` when `theme === "system"`.
     - Override `colors.accent` with `ACCENTS[accent][scheme]`.
  5. In `_layout.tsx`:
     - Wrap the tree in `<SettingsProvider>`.
     - Render `<StatusBar style={scheme === "dark" ? "light" : "dark"} />`.
     - Set the Stack's `contentStyle: { backgroundColor: colors.bg }` so screen transitions don't flash white.
- **Why Context:** theme and settings are read by every screen and most components (TypingDisplay, TabBar, buttons, charts), and they change at runtime. Passing them as props through tabs → screens → components would be prop drilling. This is the textbook case for Context.
- **Acceptance:**
  - Temporarily hardcode `theme: "dark"` in the defaults. The background turns `#0B1118`.
  - Revert the change. With `system`, switching the phone between light and dark mode changes the app live.
- **Requirement:** **uses Context appropriately**

### T6. Pull reusable UI components out of screens
- **Files:**
  - Create `src/components/OptionButton.tsx`, `src/components/StatBox.tsx`, `src/components/AppButton.tsx`, `src/components/Screen.tsx`, `src/components/Card.tsx`, `src/components/SectionLabel.tsx`
  - Rewrite `src/app/index.tsx` and `src/app/result.tsx`
- **Packages:** none
- **Steps (all components call `useTheme()` and use `StyleSheet` factories or inline token styles, with no hex values):**
  1. `OptionButton({ label, selected, disabled?, onPress, accessibilityLabel? })`
     - Min height 44, `radius.md`
     - When selected: accent border and an accent-tinted background
     - Set `accessibilityRole="button"` and `accessibilityState={{ selected, disabled }}`
  2. `StatBox({ label, value, tone?: "default" | "danger" | "accent", size?: "sm" | "lg" })`
     - Value in mono font, label in `caption` + `muted`
  3. `AppButton({ title, onPress, variant: "primary" | "secondary" | "danger", icon?, disabled? })`
     - Min height 48, full width option
     - Pressed state via `Pressable` style callback (opacity 0.85 on iOS; `android_ripple` on Android)
  4. `Screen({ children, scroll?, edges? })` is a SafeAreaView with `bg` and horizontal padding `spacing.lg`.
  5. `Card({ children, style? })` uses the `surface` color, a 1px `border`, `radius.lg` and `spacing.lg` padding.
  6. `SectionLabel({ children })` renders `caption` + `muted` text with letter spacing.
  7. Rewrite Home and Result using these components. Delete the inline component definitions.
- **Acceptance:**
  - Home and Result look polished in both light and dark mode.
  - `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/app` returns nothing.
- **Requirement:** **reusable components** and **professional styling** (known problem #6)

---

# Phase 2: Navigation

### T7. Restructure into a tab group with full-screen test and result
- **Files:**
  - Rewrite `src/app/_layout.tsx`
  - Create `src/app/(tabs)/_layout.tsx`
  - Move `src/app/index.tsx` to `src/app/(tabs)/index.tsx`
  - Create placeholder `src/app/(tabs)/history.tsx`, `src/app/(tabs)/texts.tsx`, `src/app/(tabs)/settings.tsx`
  - Keep `src/app/test.tsx` and `src/app/result.tsx` at the root
- **Packages:** none (`react-native-gesture-handler` is already installed)
- **Steps:**
  1. In the root `_layout.tsx`:
     - Wrap everything in `<GestureHandlerRootView style={{ flex: 1 }}>`, which is needed for swipe-to-delete later.
     - Use `<Stack>` with screens `(tabs)`, `test` (`gestureEnabled: false` so a stray swipe doesn't quit mid-test) and `result`.
  2. In `(tabs)/_layout.tsx`:
     - `import { Tabs } from "expo-router/js-tabs"`
     - Add `<Tabs.Screen name="index" options={{ title: "Test" }} />`, plus `history` ("History"), `texts` ("Texts") and `settings` ("Settings").
     - Set `headerShown: false`.
  3. Because test and result live **outside** `(tabs)`, they cover the tab bar automatically. You don't need `tabBarStyle: { display: "none" }` hacks.
  4. Update the Result screen's "Back to home" to `router.dismissTo("/")`. Check the `router` API in the v57 docs; if `dismissTo` isn't available, use `router.replace("/")`.
- **Acceptance:**
  - There are 4 tabs at the bottom.
  - Start opens Test full screen with no tab bar, and Result also has no tab bar.
  - "Back to home" lands on the Test tab.
- **Requirement:** navigation structure and Expo Router conventions

### T8. Custom TabBar component
- **Files:**
  - Create `src/components/TabBar.tsx`
  - Rewrite `src/app/(tabs)/_layout.tsx`
- **Packages:** none (`expo-symbols` is already installed)
- **Steps:**
  1. Add `TabBar(props: BottomTabBarProps)`. Import the type from `expo-router/js-tabs`; if it isn't exported there, use the `react-navigation/bottom-tabs` types exported by `expo-router`.
  2. Render a row of `Pressable`s, each at least 44×44, with `SymbolView` icons:
     - Test: `{ ios: "keyboard", android: "keyboard" }`
     - History: `chart.line.uptrend.xyaxis` / `show_chart`
     - Texts: `doc.text` / `article`
     - Settings: `gearshape` / `settings`
  3. Styling:
     - The active tab uses `accent`; inactive tabs use `muted`.
     - Background `surface`, top hairline `border`.
     - Bottom padding from `useSafeAreaInsets()`.
  4. Accessibility: `accessibilityRole="tab"` and `accessibilityState={{ selected }}`.
  5. Pass it in with `<Tabs tabBar={(p) => <TabBar {...p} />}>`.
  6. Delete the unused template images `assets/images/tabIcons/explore*.png` and `home*.png` if nothing references them. Check with grep first.
- **Acceptance:**
  - Icons and labels show in both themes.
  - The active tab is highlighted.
  - The bar sits above the home indicator on iPhone and the gesture bar on Android.
- **Requirement:** reusable components and HIG tab bar guidance

---

# Phase 3: Settings screen

### T9. Settings screen UI
- **Files:**
  - Create `src/components/SettingsRow.tsx`, `src/components/SegmentedControl.tsx`, `src/components/AccentSwatch.tsx`
  - Rewrite `src/app/(tabs)/settings.tsx`
- **Packages:**
  ```bash
  npx expo install @react-native-community/slider
  ```
- **Steps:**
  1. `SettingsRow({ title, subtitle?, right: ReactNode })` has a min height of 56.
  2. `SegmentedControl<T extends string>({ options: { value: T; label: string }[], value: T, onChange })` is used for the System / Light / Dark choice. Each segment is at least 44 tall.
  3. `AccentSwatch({ color, selected, onPress })` is a 44px circle with a check mark when selected. Show a row of swatches from `ACCENTS`.
  4. Typing font size: a `Slider` from 14 to 28 with step 2.
     - Show a live preview line "The quick brown fox" in mono at the chosen size.
     - Save on `onSlidingComplete`, not on every change, to avoid lots of writes.
  5. Haptics and Shake to restart use RN `Switch` with `trackColor={{ true: colors.accent }}`.
  6. Add a "Reset settings" `AppButton variant="secondary"` with an `Alert.alert` confirmation.
  7. Group the rows into `Card`s: Appearance, Typing, Feedback.
- **Acceptance:**
  - Changing the theme or accent updates every tab instantly.
  - Kill the app and reopen it. All settings are still set.
- **Requirement:** **Context**, **stores data on the device** (settings), and professional styling

---

# Phase 4: Local database

### T10. Database setup and migrations
- **Files:**
  - Create `src/db/migrate.ts`
  - Rewrite `src/app/_layout.tsx`
- **Packages:** `expo-sqlite`, already installed in T5
- **Steps:**
  1. Add `migrateDbIfNeeded(db: SQLiteDatabase): Promise<void>` using a `.then` chain:
     - Read `PRAGMA user_version`.
     - If it's below 1, run `execAsync` with:
       ```sql
       PRAGMA journal_mode = WAL;
       CREATE TABLE test_results (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         wpm INTEGER NOT NULL, raw_wpm INTEGER NOT NULL, accuracy INTEGER NOT NULL,
         errors INTEGER NOT NULL, characters INTEGER NOT NULL, elapsed_ms INTEGER NOT NULL,
         mode TEXT NOT NULL, time INTEGER, word_count INTEGER, quote_length TEXT,
         text_style TEXT NOT NULL, text_id INTEGER, config_key TEXT NOT NULL,
         created_at INTEGER NOT NULL);
       CREATE INDEX idx_results_config ON test_results(config_key);
       CREATE TABLE custom_texts (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL, body TEXT NOT NULL,
         type TEXT NOT NULL CHECK (type IN ('quote','code')),
         best_wpm INTEGER, created_at INTEGER NOT NULL);
       PRAGMA user_version = 1;
       ```
  2. In the root layout, wrap the Stack in `<SQLiteProvider databaseName="typing-test.db" onInit={migrateDbIfNeeded}>`, inside `SettingsProvider`.
- **Acceptance:**
  - The app launches with no errors.
  - Add a temporary `console.log` of `PRAGMA user_version` from `useSQLiteContext()`. It shows 1.
  - Reloading doesn't re-run the migration.
- **Requirement:** **stores data on the device**

### T11. Test results repository
- **Files:**
  - Create `src/db/testResults.ts`, `src/lib/configKey.ts`
  - Extend `src/types/test.ts`
- **Packages:** none
- **Steps:**
  1. Add `type TestResult = TestStats & TestConfig & { id: number; configKey: string; createdAt: number }`. Write a `rowToResult(row)` mapper from snake_case columns to camelCase.
  2. Add `getConfigKey(config: TestConfig): string`:
     - `custom` → `custom-<textId>`
     - `random` → `timed-60-random` or `words-30-random`. Quote length doesn't matter for random words.
     - Otherwise → `timed-60-quote-long`, etc.
  3. Add these functions. Each takes `db` as its first argument and returns a Promise built with `.then`:
     - `insertTestResult(db, config, stats): Promise<number>` returns `lastInsertRowId`.
     - `getTestResult(db, id): Promise<TestResult | null>`
     - `getAllResults(db): Promise<TestResult[]>`, newest first
     - `getRecentResults(db, limit): Promise<TestResult[]>`
     - `getBestWpm(db, configKey?, excludeId?): Promise<number | null>`
     - `getSummary(db): Promise<{ best: number; average: number; total: number }>`, using one query: `SELECT MAX(wpm), ROUND(AVG(wpm)), COUNT(*)`
     - `deleteTestResult(db, id)`
     - `clearTestResults(db)`
  4. Always use parameter binding (`?`). Never build SQL with string concatenation.
- **Acceptance:** temporarily call `insertTestResult` from a dev button and then `getAllResults`. The logged row has the right fields.
- **Requirement:** **stores data on the device** (data type #1)

### T12. Save every finished test and load results by id
- **Files:** rewrite `src/app/test.tsx` and `src/app/result.tsx`
- **Packages:** none
- **Steps:**
  1. In `finishTest()`:
     1. Compute the stats.
     2. Save the test: `insertTestResult(db, config, stats).then((id) => router.replace({ pathname: "/result", params: { resultId: String(id) } }))`.
     3. Add `.catch` to show `Alert.alert("Couldn't save result")`, then still navigate with the stats params as a fallback.
  2. In Result:
     - Read `resultId`, then `getTestResult` into state, and show a loading state until it arrives.
     - Rebuild the config from the record for "Try again" (`toTestParams`).
  3. Skip saving if `characters === 0`, for example a timed test where the user never typed. In that case go back home with a toast-style `Alert`.
- **Acceptance:**
  - Finish 3 tests, kill the app and reopen it. A temporary log of `getAllResults` shows all 3.
  - Results shows the same numbers as before.
- **Requirement:** **stores data on the device**, created from user input

---

# Phase 5: History screen

### T13. History summary and list
- **Files:**
  - Create `src/components/HistoryItem.tsx`, `src/components/EmptyState.tsx`, `src/lib/format.ts`
  - Rewrite `src/app/(tabs)/history.tsx`
- **Packages:** none
- **Steps:**
  1. In `format.ts`, add `formatDate(ms)` (using `Intl.DateTimeFormat` with `{ month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }`) and `formatConfig(config)` (for example "60s · random", "30 words · quote · long", or "My text: <title>").
  2. `HistoryItem({ result, onPress? })`:
     - WPM large in mono on the left.
     - Accuracy, errors, config and date on the right.
     - Row height at least 64.
  3. In the History screen:
     - `useFocusEffect(useCallback(() => { load() }, []))` reloads every time the tab is shown. `load` runs `Promise.all([getSummary(db), getAllResults(db)]).then(...)`.
     - A row of 3 `StatBox`es: Best, Average, Tests.
     - A `FlatList` of `HistoryItem` with `ListHeaderComponent` holding the summary and chart. Use one scroll view only; no nested ScrollView.
  4. `EmptyState({ icon, title, message, action? })` shows when there are no tests, for example "No tests yet" with a "Start a test" button.
- **Acceptance:**
  - After 3 tests, History shows correct Best, Average and Total, and 3 rows newest first.
  - With an empty database, the empty state appears.
- **Requirement:** stored data displayed, and reusable components

### T14. Swipe to delete and clear history
- **Files:**
  - Rewrite `src/components/HistoryItem.tsx`
  - Create `src/components/SwipeableRow.tsx`
  - Rewrite `src/app/(tabs)/history.tsx`
- **Packages:** none
- **Steps:**
  1. `SwipeableRow({ children, onDelete })` wraps `Swipeable` from `react-native-gesture-handler/ReanimatedSwipeable`.
     - `renderRightActions` shows a red (`danger`) "Delete" action at least 80 wide with a trash `SymbolView`.
     - Swiping fully or tapping the action calls `onDelete`.
  2. `onDelete` runs `deleteTestResult(db, id).then(load)`. Use haptic `impactAsync(Light)` if haptics are enabled; see T22.
  3. Add a "Clear history" `AppButton variant="danger"` as the list footer, shown only when there are tests. It asks for confirmation with `Alert.alert` and buttons `"Cancel"` (style cancel) and `"Clear"` (style destructive).
  4. Accessibility: give each row `accessibilityActions={[{ name: "delete", label: "Delete test" }]}` so VoiceOver and TalkBack users can delete without swiping.
- **Acceptance:**
  - Swipe left on a row and tap Delete. It disappears and the summary updates.
  - Clear history asks for confirmation, then the empty state shows.
  - Both changes persist after a restart.
- **Requirement:** stored data managed by the user, and HIG destructive-action guidance

### T15. WPM line chart
- **Files:**
  - Create `src/components/charts/WpmLineChart.tsx`
  - Rewrite `src/app/(tabs)/history.tsx`
- **Packages:**
  ```bash
  npx expo install react-native-svg
  ```
- **Steps:**
  1. Props: `WpmLineChart({ data: number[]; height?: number; compact?: boolean; highlightLast?: boolean })`.
  2. Measure the width with `onLayout`. Map the points to x/y, with `yMin = 0` and `yMax = max(data) * 1.15`.
     - `Path` for the line, using `accent` with strokeWidth 2.5 and a round join.
     - A light area fill using `accent` at 15% opacity.
     - `Circle` dots.
     - 3 horizontal gridlines in `border` color with mono labels in `muted`. Hide the gridlines and labels when `compact`.
  3. History passes the last 30 tests in oldest-to-newest order. Show it inside a `Card` titled "WPM over time".
  4. With fewer than 2 points, show the caption "Finish 2 tests to see your trend".
  5. Set `accessibilityLabel` to a text summary, for example "WPM trend, 12 tests, latest 64, best 71".
- **Why this approach:** react-native-svg is already a dependency of most chart libraries. Drawing about 60 lines of SVG yourself avoids a heavy charting package (Victory, Skia) and is themeable through Context.
- **Acceptance:**
  - After 5+ tests, the line rises and falls to match the list.
  - The chart looks right in dark mode and has no overflow on a small phone.
- **Requirement:** professional styling and data display

---

# Phase 6: My Texts

### T16. Custom texts repository
- **Files:**
  - Create `src/db/customTexts.ts`
  - Extend `src/types/test.ts`
- **Packages:** none
- **Steps:**
  1. Add `type CustomText = { id: number; title: string; body: string; type: "quote" | "code"; bestWpm: number | null; createdAt: number }`.
  2. Add these functions:
     - `insertCustomText(db, { title, body, type }): Promise<number>`
     - `getCustomTexts(db): Promise<CustomText[]>`
     - `getCustomText(db, id)`
     - `deleteCustomText(db, id)`. Leave its old results in history; they display "Deleted text".
     - `updateBestWpm(db, id, wpm)` runs `UPDATE custom_texts SET best_wpm = MAX(COALESCE(best_wpm, 0), ?) WHERE id = ?`.
- **Acceptance:** a temporary insert followed by a fetch logs the row.
- **Requirement:** **stores data on the device** (data type #2)

### T17. Add-text form with validation
- **Files:**
  - Create `src/components/TextForm.tsx`, `src/components/FormField.tsx`, `src/lib/validateText.ts`
  - Rewrite `src/app/(tabs)/texts.tsx`
- **Packages:** none
- **Steps:**
  1. `validateText({ title, body }): { title?: string; body?: string }` returns error messages. Rules:
     - Title: 1–40 characters after trimming.
     - Body: 20–1000 characters.
     - Normalize the body by replacing `\r\n` with `\n`, converting tabs to 2 spaces, and replacing smart quotes and long dashes (“ ” ‘ ’ —) with plain ASCII. Phone keyboards can't type smart quotes back, so a pasted quote containing them would be impossible to finish.
  2. `FormField({ label, value, onChangeText, error?, multiline?, maxLength?, ... })` shows the label above the input, a `danger` error message below it, and a character counter.
  3. `TextForm({ onSubmit })`:
     - Title field, body field (multiline, mono font when the type is code), and a `SegmentedControl` for Quote / Code.
     - The "Save text" button is disabled until the form is valid. Errors show only after a field loses focus or a save is attempted.
  4. On the Texts screen, show the form in a `Card` that collapses behind an "Add text" button. Use `KeyboardAvoidingView` (`behavior="padding"` on iOS).
  5. Clear the form after a successful save.
- **Acceptance:**
  - An empty title shows an error.
  - A 5-character body shows "At least 20 characters".
  - A valid form saves and the form resets.
- **Requirement:** data **created from user input**, and HIG/Material form guidance

### T18. Text list, delete, and tap to practice
- **Files:**
  - Create `src/components/TextCard.tsx`
  - Rewrite `src/app/(tabs)/texts.tsx`, `src/lib/generateTargetText.ts`, `src/app/test.tsx`
- **Packages:** none
- **Steps:**
  1. `TextCard({ text, onPress, onDelete })`:
     - Shows the title, a type chip (Quote/Code), a 2-line body preview (mono for code), and "Best: 72 WPM" or "Not practiced yet".
     - Has a delete icon button (44px) with a confirmation `Alert`.
  2. Load the list with `useFocusEffect`, using a `FlatList` with an `EmptyState`.
  3. Tapping a card pushes `/test` with `toTestParams({ mode: "words", textStyle: "custom", textId, ... })`. Custom texts always run in words mode, meaning type the whole text.
  4. In Test, when `textStyle === "custom"`, run `getCustomText(db, textId).then(t => setTargetText(normalize(t.body)))`.
  5. In `finishTest`, when `textStyle === "custom"`, chain `updateBestWpm(db, textId, stats.wpm)` before navigating.
- **Acceptance:**
  - Add a text, tap it, and type it all. Results show, and back on the Texts tab the card now says "Best: N WPM".
  - Delete the text after confirming; it disappears and stays gone after a restart.
- **Requirement:** stored data displayed, and reusable components

### T19. "My texts" as a fourth text style on Home
- **Files:** rewrite `src/app/(tabs)/index.tsx`
- **Packages:** none
- **Steps:**
  1. Add `"custom"` (label "Mine") to the text style options.
  2. When "Mine" is selected:
     - Load `getCustomTexts` and show a horizontal list of compact `OptionButton`s with the titles, defaulting to the first.
     - Hide the Quote length section, and force the mode to "words" with the mode buttons visibly disabled.
  3. If there are no saved texts, disable "Mine" and show the caption "Add a text in the Texts tab", with a link that calls `router.navigate("/texts")`.
  4. Wrap Home in a `ScrollView`, since the content is getting tall.
- **Acceptance:** with 2 saved texts, choosing Mine → text B → Start makes you type text B.
- **Requirement:** stored data used in the app flow

---

# Phase 7: Test and results improvements

### T20. TypingDisplay component in JetBrains Mono
- **Files:**
  - Create `src/components/TypingDisplay.tsx`
  - Rewrite `src/app/test.tsx`
- **Packages:** none
- **Steps:**
  1. Props: `TypingDisplay({ target: string; typed: string; fontSize: number; onPress: () => void })`.
  2. Speed up rendering by splitting the text into 4 segments instead of one `<Text>` per character:
     - typed, split into runs of correct and incorrect characters
     - the current character
     - the rest
     This cuts hundreds of nodes per keystroke down to a handful.
  3. Styling:
     - `fontFamily: fonts.mono`, with font size from settings and `lineHeight = fontSize * 1.6`.
     - Correct characters use `text`; incorrect ones use `danger` with a light danger background (wrong spaces need this to be visible); the rest use `muted`.
     - The current character gets an accent underline or background.
  4. Make the whole display a `Pressable` that refocuses the hidden input, so tapping text reopens the keyboard.
  5. For code text, keep `\n` as-is, and show a faint `↵` before each newline so users know to press Return.
  6. Header: show the config as small chips at the top, replacing the 3 plain `<Text>` lines. Add a 44px "✕" close button with `router.back()` and confirmation.
- **Acceptance:**
  - Text renders in mono.
  - Changing the font size in Settings changes the size on the test screen.
  - Typing stays smooth on a 120s random test.
- **Requirement:** reusable components and the design spec

### T21. Live stats bar and progress bar
- **Files:**
  - Create `src/components/LiveStats.tsx`, `src/components/ProgressBar.tsx`
  - Rewrite `src/app/test.tsx`
- **Packages:** none
- **Steps:**
  1. In Test, compute `liveStats = computeStats(target, typed, elapsedMs)` during render. `elapsedMs` comes from the existing 250 ms `now` tick and is 0 before the first keystroke. Since this is derived during render, no extra state is needed.
  2. `LiveStats({ wpm, accuracy, errors, remaining?: number })` shows a row of compact `StatBox`es, plus a big countdown in timed mode.
  3. `ProgressBar({ progress: number /* 0..1 */ })` is 6px tall with a `border` color track, an `accent` fill and a pill radius. Timed mode uses `elapsed / time`; words mode uses `typed.length / target.length`. Animating it with Reanimated `withTiming` is optional.
  4. Before the first keystroke, show "Start typing to begin" in `muted`.
- **Acceptance:**
  - The WPM number updates while typing, and the error count goes up on mistakes.
  - The progress bar fills in sync with the countdown.
- **Requirement:** the feature spec

### T22. Haptics that respect settings
- **Files:**
  - Create `src/hooks/useHaptics.ts`
  - Rewrite `src/app/test.tsx`
- **Packages:** none (`expo-haptics` is already installed)
- **Steps:**
  1. `useHaptics()` returns `{ error(), success(), light(), selection() }`. Each one is a no-op when `hapticsEnabled` is false and calls `.catch(() => {})` on the promise.
  2. Throttle `error()` to at most once every 80 ms so mashing keys doesn't produce a continuous buzz.
  3. Use it in Test (error on a wrong key, success on finish), TabBar (`selection` on tab change), and delete actions (`light`).
- **Acceptance:** with Haptics turned off in Settings, wrong keys and finishing a test produce no vibration.
- **Requirement:** **device feature**, controlled by **Context**

### T23. Results: personal best badge and mini chart
- **Files:**
  - Create `src/components/PersonalBestBadge.tsx`
  - Rewrite `src/app/result.tsx`
- **Packages:** none
- **Steps:**
  1. After loading the result, run `Promise.all([getBestWpm(db, result.configKey, result.id), getRecentResults(db, 7)])`.
     - `isNewBest = previousBest === null || result.wpm > previousBest`
     - The first test of a config counts as a best. **Assumption:** it shows as "First result for this config" instead of a celebration.
  2. `PersonalBestBadge({ previousBest })` is an accent pill with a star `SymbolView`, "New personal best", and "+N over previous" text.
     - When it appears, run a Reanimated `FadeIn.springify()` entering animation and play `success` haptics.
  3. Show `WpmLineChart compact highlightLast data={last7.reverse()}` in a `Card` titled "Last 7 tests".
  4. Layout:
     - Hero WPM (mono, 64pt, accent).
     - A 2×2 StatBox grid (Accuracy, Time taken from `elapsedMs`, Errors in danger, Characters).
     - Config chips.
     - Buttons: "Try again" (primary) and "Back to home" (secondary).
- **Acceptance:**
  - Beat your score on the same config and the badge appears.
  - Score lower and it doesn't.
  - A different config doesn't compare against the first one.
- **Requirement:** stored data displayed, and feature spec

### T24. Personal best card on Home
- **Files:**
  - Create `src/components/PersonalBestCard.tsx`
  - Rewrite `src/app/(tabs)/index.tsx`
- **Packages:** none
- **Steps:**
  1. `PersonalBestCard({ best, configLabel, total })` shows "Personal best · 60s random: 74 WPM" and "12 tests taken".
  2. Home runs `useFocusEffect`, then `getBestWpm(db, getConfigKey(currentConfig))` and `getSummary(db)`. Re-query when the config changes, so the card updates as you change options.
  3. When there's no best yet, show "No result for this setup yet".
  4. Make "Start test" a large primary `AppButton` placed under the card. **Assumption:** this follows the mockup order of title → PB card → options → Start pinned at the bottom.
- **Acceptance:** the PB card number matches the History best for that config and changes when you switch from 60s to 30s.
- **Requirement:** stored data displayed

---

# Phase 8: Device feature

### T25. Shake to restart (Accelerometer)
- **Files:**
  - Create `src/hooks/useShake.ts`
  - Rewrite `src/app/test.tsx`
- **Packages:**
  ```bash
  npx expo install expo-sensors
  ```
- **Steps:**
  1. Write the hook `useShake(onShake: () => void, { enabled, threshold = 1.8, debounceMs = 1200 })`:
     - Inside `useEffect`, if `!enabled`, return early.
     - Otherwise, `Accelerometer.isAvailableAsync().then(ok => { if (!ok) return; Accelerometer.setUpdateInterval(100); sub = Accelerometer.addListener(({ x, y, z }) => { ... }) })`.
     - Compute `g = Math.sqrt(x*x + y*y + z*z)`. The units are g, so about 1.0 at rest.
     - It's a shake when `g > threshold` **and** `Date.now() - lastShakeRef.current > debounceMs`.
     - Cleanup: `return () => { cancelled = true; sub?.remove(); }`. The `cancelled` flag covers unmounting before `isAvailableAsync` resolves.
     - Store `onShake` in a ref so the listener isn't re-subscribed on every render.
  2. Add `restartTest()` to Test. It:
     - generates new target text
     - resets the `typed` state and ref, `startTimeRef`, `hasEndedRef` and `now`
     - refocuses the input
     - plays `light` haptics
     - shows a brief "Restarted" toast-style overlay
  3. Call `useShake(restartTest, { enabled: settings.shakeToRestart })`. Only Test calls it, so the subscription only lives while that screen is mounted.
  4. Add a hint in the test footer: "Shake to restart" (only when enabled).
  5. Add a visible restart icon button too, so the feature isn't hidden behind the gesture.
- **Acceptance:**
  - Mid-test, a firm shake restarts the test with new text and a timer reset.
  - Walking or a gentle tilt doesn't trigger it.
  - Two quick shakes cause one restart.
  - With the setting off, shaking does nothing.
  - Leaving the screen stops sensor updates (no logs).
- **Requirement:** **uses a device feature**, controlled by **Context**

### T26. (Optional stretch) Steadiness meter with the Gyroscope
- **Files:**
  - Create `src/hooks/useMotionLevel.ts`, `src/components/SteadinessMeter.tsx`
  - Modify the test and result screens
- **Packages:** none extra (`expo-sensors`)
- **Steps:**
  1. Use `Gyroscope.addListener` at a 100 ms interval. Keep a running average of `sqrt(x²+y²+z²)` (rad/s) in a ref.
  2. Show a small meter on Test.
  3. Save `avg_motion` with the result. This needs a migration to `user_version` 2 with `ALTER TABLE test_results ADD COLUMN avg_motion REAL`.
  4. Show "Steadiness: Steady / Some movement / Shaky" on Results.
- **When to do it:** only if you want the gyroscope idea from your README edit. T25 already meets the rubric.

---

# Phase 9: Polish and documentation

### T27. Styling and accessibility audit
- **Files:** any screen or component that needs fixing
- **Packages:** none
- **Checklist:**
  - `grep -rn "#[0-9A-Fa-f]\{3,8\}" src/app src/components` is empty; hex values live only in `src/theme/colors.ts`.
  - Every `Pressable` has `minHeight` or `hitSlop` reaching 44, plus an `accessibilityRole` and label.
  - Cards use a 14–16 radius and spacing comes only from `spacing.*`.
  - Dark mode: check every screen, including Alerts and the keyboard (`keyboardAppearance={scheme}` on the inputs).
  - Dynamic Type: large accessibility text sizes don't clip the main buttons. Use `maxFontSizeMultiplier` only on the hero WPM.
  - Run `npx expo lint` and `npx tsc --noEmit` and fix all errors.
- **Acceptance:** both commands are clean, and VoiceOver or TalkBack can read every control.
- **Requirement:** **professional styling (HIG/Material)**

### T28. Wireframes and mockups
- **Files:** create `docs/wireframes.png` and `docs/mockups/*.png` (or `docs/screenshots/`)
- **Steps:**
  1. Draw or export low-fidelity wireframes for Home, Test, Results, History, My Texts and Settings. Annotate where Context, storage, the sensor and the reusable components appear.
  2. Take light and dark screenshots of each screen from your phone.
- **Requirement:** **README wireframe images**

### T29. README rewrite
- **Files:** rewrite `README.md`
- **Steps:** follow checklist (c) at the end of this file. Resolve the current uncommitted README edit (gyroscope vs. shake) so it matches what you actually built.
- **Requirement:** **README**

---

## (a) Recommended folder structure

```
src/
  app/
    _layout.tsx              # fonts, splash, SettingsProvider, SQLiteProvider, GestureHandlerRootView, root Stack
    (tabs)/
      _layout.tsx            # js-tabs + custom TabBar
      index.tsx              # Home / Test setup
      history.tsx
      texts.tsx
      settings.tsx
    test.tsx                 # full screen, no tab bar
    result.tsx               # full screen, no tab bar
  components/
    AppButton.tsx  Card.tsx  Screen.tsx  SectionLabel.tsx  EmptyState.tsx
    OptionButton.tsx  SegmentedControl.tsx  AccentSwatch.tsx  SettingsRow.tsx  FormField.tsx
    StatBox.tsx  LiveStats.tsx  ProgressBar.tsx  TypingDisplay.tsx
    HistoryItem.tsx  SwipeableRow.tsx  TextCard.tsx  TextForm.tsx
    PersonalBestBadge.tsx  PersonalBestCard.tsx  TabBar.tsx
    charts/WpmLineChart.tsx
  context/
    SettingsContext.tsx
  hooks/
    useTheme.ts  useHaptics.ts  useShake.ts  (useMotionLevel.ts)
  db/
    migrate.ts  testResults.ts  customTexts.ts
  lib/
    stats.ts  generateTargetText.ts  testParams.ts  configKey.ts  validateText.ts  format.ts
  data/
    words.ts  quotes.ts  codeSnippets.ts
  theme/
    colors.ts  tokens.ts  typography.ts
  types/
    test.ts
docs/
  wireframes.png
  mockups/
```

## (b) Manual test cases (run on a phone)

| # | Area | Steps | Expected |
|---|------|-------|----------|
| 1 | Nav | Open the app and tap all 4 tabs | Each tab loads and the active icon is highlighted |
| 2 | Nav | Start a test | Test is full screen with no tab bar; Results has no tab bar either |
| 3 | Nav | On Results, press the system Back button or swipe back | Goes to Home, not the finished test |
| 4 | Stats | 10-word test, type it perfectly | 100% accuracy, 0 errors, believable WPM |
| 5 | Stats | 10-word test with 3 mistakes | Errors = 3, accuracy < 100 |
| 6 | Stats | 30s timed test, type for 5s and stop | Finishes at 30s with WPM based on the elapsed time, not `Infinity` or `NaN` |
| 7 | Stats | Timed test, never type | Not saved; you're returned home with a message |
| 8 | Live | Type during a timed test | Live WPM and errors update, and the progress bar fills |
| 9 | Storage | Finish 3 tests, force-quit, reopen, open History | All 3 are listed, and the summary is correct |
| 10 | History | Swipe-delete one test | The row disappears, the summary updates, and the change survives a restart |
| 11 | History | Clear history → Cancel, then Clear history → Clear | Cancel keeps the data; Clear empties it and shows the empty state |
| 12 | Chart | 5+ tests | The line chart matches the list values; with 1 test it shows the "finish 2 tests" hint |
| 13 | Texts | Save with an empty title or 5-character body | Errors show and nothing is saved |
| 14 | Texts | Add a valid quote and a valid code text | Both are listed with the right type chip and survive a restart |
| 15 | Texts | Tap a text and finish it | Card shows "Best: N WPM"; repeating with a lower score keeps N |
| 16 | Texts | Delete a text → Confirm | Removed; old History rows still display |
| 17 | Home | Choose "Mine" with 0 texts, then with 2 texts | Disabled with a hint at 0; at 2 you can pick a specific text |
| 18 | PB | Beat your score on the same config | The "New personal best" badge appears |
| 19 | PB | Score lower, or use a different config | No badge, or no comparison with the other config |
| 20 | PB | Home PB card | Matches the config's best and updates when options change |
| 21 | Results | Mini chart | Shows up to the last 7 tests, with the newest highlighted |
| 22 | Settings | Theme Light / Dark / System, then toggle the phone's dark mode | Every screen recolors; System follows the phone |
| 23 | Settings | Change the accent color | Buttons, tab bar, chart and progress bar all change |
| 24 | Settings | Font size 14 → 28 | Preview and test text resize |
| 25 | Settings | Change everything, force-quit, reopen | All settings persist, with no flash of the default theme |
| 26 | Haptics | Haptics off, then make mistakes and finish | No vibration |
| 27 | Shake | Shake mid-test | Restarts with new text and the timer resets |
| 28 | Shake | Gentle tilt or walking with the phone | No restart |
| 29 | Shake | Two quick shakes | Only one restart |
| 30 | Shake | Shake-to-restart off, then shake | Nothing happens |
| 31 | A11y | VoiceOver/TalkBack across all tabs | Every control has a label; delete works without swiping |
| 32 | Code | Code-snippet test with newlines | ↵ markers show, and Return advances the test correctly |

## (c) README checklist

- [ ] **Title and one-paragraph description**: what the app does and who it's for.
- [ ] **Features list**, grouped by screen (Test, Results, History, My Texts, Settings).
- [ ] **Screenshots**: light and dark mode for each screen.
- [ ] **Wireframes**: `docs/wireframes.png`, embedded with alt text, with annotations for Context, storage, the sensor and components.
- [ ] **Mockups**: the color tokens table (light/dark) and fonts (Manrope UI, JetBrains Mono for typing and numbers).
- [ ] **HIG / Material Design**, 2–3 paragraphs:
  1. **Layout and navigation:** a bottom tab bar for 4 top-level destinations; full-screen modal-style flows for focused tasks (test/results) that hide the tabs; 44pt minimum touch targets (HIG) and 48dp (Material); consistent 4/8-pt spacing; cards with 14–16 radius.
  2. **Color, type and dark mode:** semantic color tokens instead of raw hex; system/light/dark following the OS appearance; accent colors chosen for at least 4.5:1 contrast; a type scale in Manrope with tabular mono numbers so stats don't jitter; Dynamic Type respected.
  3. **Feedback and safety:** haptics paired with visual feedback and can be turned off; destructive actions (delete, clear history, reset settings) use confirmation alerts with destructive styling and swipe actions plus accessible alternatives; inline form validation after leaving a field; empty states with a clear next action; the shake gesture has a visible button alternative.
- [ ] **Rubric mapping table:**

  | Requirement | Where |
  |---|---|
  | Context | `src/context/SettingsContext.tsx`, `src/hooks/useTheme.ts`, consumed by every screen and component |
  | Device storage (2+ types) | SQLite `test_results` and `custom_texts` (`src/db/`), plus settings in `expo-sqlite/kv-store` |
  | Device feature | Accelerometer shake-to-restart (`src/hooks/useShake.ts`) and haptics (`src/hooks/useHaptics.ts`) |
  | Reusable components | `src/components/*` (list them) |
  | Professional styling | `src/theme/*`, HIG/Material section above |
  | Expo / RN conventions | expo-router file-based routes and groups, `npx expo install`, typed routes |

- [ ] **Packages used**, with one line each: expo-sqlite, expo-sensors, expo-haptics, react-native-svg, @react-native-community/slider, @expo-google-fonts/manrope and jetbrains-mono, expo-symbols, react-native-gesture-handler.
- [ ] **Getting started**: `npm install`, `npx expo start`, and a note that you need a physical device for the shake feature.
- [ ] **Known limitations / future work**: for example web not supported, no cloud sync.
- [ ] **Author and course.**
