# Changelog
## 2026-11-23
- Phase 04: brand assets (symbol, wordmark, lockup SVG, app/PWA icons, favicons), BRAND_GUIDELINES.md
- Phase 03: ARCHITECTURE.md, UX_ARCHITECTURE.md, typecheck script
- Legacy app: R1 fix deployed to the Claude link
- Phase 02: data layer `src/data/` (schema v3, backup/import/snapshot/restore, weekly schedule), tests, legacy R1 fix (not deployed)
- Phase 01: audit + project memory docs

## Phase 05
- Add design tokens (light/dark, 4 accents, type, spacing, motion, density), components, icons, UI helpers, appearance settings, style guide, contrast tests, bundled Inter subset fonts.

## Phase 06
- Add app shell, tab bar, router, i18n (TH/EN), Quick Actions sheet, Settings > Appearance/Language, index.html with TAVON icons.

## Phase 07
- Home dashboard (6 widgets), read-only stats module, sample-data preview mode, honest empty state.

## Phase 08 (part 1)
- Safe data store; Work hours (week/month) and Finance (month, search, filter, add/edit/delete+undo) pages; Quick Actions wired; friendly bilingual error messages.

## Phase 08 (feedback round)
- Renamed statuses; one-tap/batch confirm of scheduled work days; recent tip chips; finance calendar with counts; quick repeat entries; faster entry editor.

- Home week strip can move to other weeks (prev/next/this week) and tapping a day opens its editor.

- Home week strip: tap a day to see its details in a panel under the strip (same renderer as the Today card), with Edit and one-tap Confirm; tap again to close; tapping today scrolls to the Today card.

## Phase 08 (part 2a)
- User-defined shortcut buttons (TTC x2, Vape...) on Home and Finance, with confirm sheet, manage page and undo.

## Phase 08 (part 2b)
- Weekly schedule editor (with suggestion from history) and recurring bills manager in Settings, with undo.

## Phase 08 (part 2c)
- Swap work day quick action, category editor, spending-by-category bars; tab renamed to "การงาน".

## Backup UI
- Back up now (share sheet to iCloud Files), import with confirmation + undo, Home card links to it.

## Phase 08.5 step 1
- Home redesigned with a 3-ring dial; warmer light/dark themes; dark-mode logo fix.

## Pay periods
- Dial rings 2-3 follow the pay period (1-15 / 16-end); new Pay period view in the Work tab.

## Pay rates
- Hourly pay per workplace with start dates; gross estimate in the pay period view.

## Home dial
- Tap the dial for a week detail sheet; on days off the Today card shows the next work day.

## Arrange Home
- Show/hide and reorder Home sections from Settings.
- Drag-to-reorder by the grip handle (arrows stay for accessibility).
- Press feedback (2% squeeze) on tappable cards. Buttons, tabs, shortcut tiles and the page fade-in already existed.
