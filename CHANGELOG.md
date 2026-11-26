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
- Entry dialogs (tip/work/money editors, shortcut) float in the upper-middle instead of a bottom sheet, so the keyboard does not cover them.
- All fill-in dialogs (tip, work, money, shortcut, quick add, pay rates, schedule/recurring/categories, backup) are centred in the visible area and re-centre when the keyboard opens (visualViewport). Week detail stays a bottom sheet.
- Phase 10: a soft highlight on the row/day/card you just added or confirmed (flashNext/runFlash in ui.js). Removing a row has no exit animation (the page redraws).
- Day off: a sleeping original character replaces the dial (period hours/days stay below), and the whole app switches to a calm dusk tone (data-rest). Setting "Calm tone on days off" in Appearance (default on). Not applied to brand-new users with no schedule/data, or in preview mode. Contrast tested for all 4 accents.
- Day-off character redrawn in a soft storybook style (original design): plush with ears, star blanket, sleepy moon, nose bubble.
- Day-off character is now an original sleeping kitten on a blue duvet beside a night light, hand-drawn look with paper grain and warm glow.
- Day-off character: back to the first design (round-faced bun under a blanket with moon and Zzz), by request.
- Day-off character animates: breathing blanket, head bob, hair tuft sway, twinkling stars, glowing moon, rising Zzz. All off with "Reduce animations" / device Reduce Motion (Zzz then stay visible).
- Day-off scene: a small warm night light with a softly flickering glow.
- Night light is now a minimal cozy table lamp (cream shade, slim stand).
- Lamp animation: glow breathes and flickers, shade brightens and dims, light cone pulses, tiny light specks float up. Off with reduced motion.
- PWA: manifest + iOS full-screen meta; "Add to Home Screen" tip on Home (iPhone Safari only).
- Offline: service worker keeps a copy of the app files (network first, so no stale versions); Settings > App files to clear it. Data is never in it.
- Launch screen: in-app logo splash (fades after first screen, min 1.3 s, safety 8 s), early theme set before first paint (no light flash in dark mode), iOS apple-touch-startup-image for 11 iPhone sizes x light/dark (assets/brand/splash). theme-color now matches --bg.
- Launch colours: the day-off tone and the theme colour are painted from the first frame (device-only flag tavon-rest-last, excluded from backups); html background follows --bg. Fixes a dark brown band at the top of the launch screen.
- Import: new "Paste backup text" option (old app export text or TAVON backup JSON); same check, same confirm screen, same auto-snapshot and undo.

- Money editor: sub-categories per category (e.g. Transport > TTC), remembered in the old app's own key (`pee-finance-subcategories-v1`, same shape); last one used is pre-picked; add / manage / undo; entries show "Category · Sub"; editor layout redone (amount on top, category + sub grouped, date and note side by side).
- Work-day editor: workplace shows as tap-to-pick chips (from schedule, past days and rates); still free to type a new one.
- Settings > Workplaces: rename a workplace everywhere (days, schedule, pay rates) or merge two names; safety copy + undo.
- Workplaces: each has its own page (name, first/last day, pay rates with start dates); workplaces you left are not offered in pick lists. New key tavon-place-info.
- Settings: removed the separate Pay rates row (rates now live inside each workplace page; old link still opens). Pay links on Work page go to Workplaces.
