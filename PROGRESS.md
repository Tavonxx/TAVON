# Progress
## ✅ Phase 01 — Existing Website Audit (23 พ.ย. 2026)
- ตรวจ PP Space 2.0 version `1792245900-f3a5` · ผลอยู่ใน AUDIT_PHASE01.md
- สำรอง source เดิม: `backup_PP_Space_2.0_live.html` (ไม่ได้แก้ของจริง)
- ทดสอบ: โหลดได้, ไม่มี console error, Dark mode OK

## ✅ ตัดสินใจแล้ว (ดู DECISIONS.md)
- Hosting = GitHub Pages (repo Tavonxx/TAVON, public) · ชื่อแอป = TAVON · ย้ายตารางกะเป็นการตั้งค่า
- หมายเหตุ: source เดิมมีข้อมูลส่วนตัวฝังอยู่ → ไม่ commit ไฟล์เดิมลง repo public

## ✅ Phase 02 — Data Backup & Compatibility Planning (23 พ.ย. 2026)
- แก้บั๊ก R1 ในแอปเดิม → `docs/legacy-fix.md` · ✅ ใส่ในลิงก์จริงแล้ว (พีอนุญาต)
- Data layer ใหม่ `src/data/` (schema, backup/import/snapshot/restore, ตารางกะ) · `npm test` 11/11 ผ่าน
- แผนเต็มใน DATA_MIGRATION.md

## ✅ Phase 03 — Product Strategy & UX Architecture (23 พ.ย. 2026) · อนุมัติแล้ว
- Stack: Vanilla ES Modules + JSDoc + tsc (ARCHITECTURE.md) · `npm run typecheck` ผ่าน
- IA, navigation, quick actions, flows, feature mapping (UX_ARCHITECTURE.md)

## ✅ Phase 04 — TAVON Branding & Logo Design (23 พ.ย. 2026) · รออนุมัติ
- โลโก้: สัญลักษณ์ C ขาวดำ (ช่องว่าง 5) + wordmark Inter Display Medium (outline) · lockup · โหมดสว่าง/มืด
- ไอคอน iPhone 1024/180, PWA 192/512/maskable, favicon (svg/png/ico) · พาเลตต์แบรนด์ · BRAND_GUIDELINES.md · assets/brand/brand-sheet.png
- ยังไม่ได้ติดตั้งในแอป (ทำใน Phase 06/11) · สี accent ของ UI ยังไม่เลือก → Phase 05

## ▶ ถัดไป: Phase 05 — Global Design System
- design tokens (สี/ตัวอักษร/ระยะ/มุม/motion), สี accent, components พื้นฐาน, หน้าตัวอย่าง (style guide)

## Phase 05 - Global Design System: DONE (awaiting approval)
Tokens, base + component CSS, icon sprite, UI helpers, appearance settings, styleguide.html, 34 passing tests, typecheck clean. Open item: choose accent colour (Pee).
Accent decision made: Terracotta. GitHub Pages live at https://tavonxx.github.io/TAVON/ (style guide viewed on iPhone).

## Phase 06 - Layout & Navigation: DONE (awaiting approval)
App shell in `index.html` + `src/app/` (main, router, i18n): 4 tabs + centre + button (Quick Actions sheet, items marked "Soon"), hash router with 404, large titles, tap current tab = scroll to top, swipe from left edge = back on sub-pages, focus moves to page title on navigation, Thai/English labels, working Settings > Appearance (+ reset with Undo) and Language. Pages Home/Work/Money are placeholders (phases 07-08). Only new keys written: `tavon-appearance`, `tavon-lang`. 37 tests pass, typecheck clean, flows verified in headless Chrome (iPhone viewport).

## Phase 07 - Home dashboard: DONE (awaiting approval)
`src/data/stats.js` (read-only calculations, 10 tests), `src/app/dashboard.js` (render, escaped), `demo.js` (sample data in memory only). Widgets: today, month balance (carried over + income - expense in cents), this week (hours worked/planned, tips, 7-day strip with shapes), latest 5 money items, upcoming recurring bills (14 days, never generated), backup reminder (never / 7+ days). Verified: rendering writes nothing to storage; hostile text is escaped; empty state is honest. NOT included yet: tip entry button (Phase 08, needs safe writes), widget hide/reorder (Phase 09).
Known limit: the new site is a different address from the Claude artifact, so it cannot see the old data until Phase 12 import.

## Phase 08 (part 1) - Work hours + Finance pages with safe editing: DONE (awaiting approval)
`src/data/store.js` (every write: validated, refuses damaged data, one snapshot before first edit, read-back verify, undo info), `src/app/editors.js` (work-day sheet, money sheet), `src/app/datapages.js` (Work: week + month calendar; Finance: month nav, balance, search, type/category filter, add/edit/delete with Undo). Quick Actions now work (tip, expense, income, update today); Home "add tip" works. Preview mode never writes. 63 tests pass; e2e verified in headless Chrome (add, edit, delete+undo, damaged data untouched, preview writes nothing).
NOT yet (part 2): transactions calendar view, category share chart, recurring + subcategory management, workplace management, swap shift, weekly schedule editor, tip breakdown by place/day.
Note: data typed into the new site now is TEST data; Phase 12 import replaces it (after auto-snapshot).

## Phase 08 (part 1b) - feedback round: DONE (awaiting approval)
Labels: planned -> "วันทำงาน", leave -> "วันลา". Less typing: Home "confirm worked" one-tap + banner "N past days not confirmed" with confirm-all (batch, one undo); week rows have a one-tap check; day editor = status + hours + tips (place/note hidden), tap-to-fill recent tip chips. Finance: calendar view (per-day counts, income = green circle, expense = red square, number = entries, tap a day to see/add), quick "repeat frequent entry" chips (one tap, undo), editor focuses amount, category chips ranked by use with the most-used preselected, "Save & add another", "Repeat today" on edit. Tests: 68 + e2e.

## Phase 08 (part 2a) - Shortcut buttons: DONE (awaiting approval)
`tavon-shortcuts` key (in backups), `src/data/shortcuts.js` (validated CRUD, order, use = N plain entries in one write, optional "keep this price"), `src/app/shortcuts.js` (adaptive grid 1/2/3 columns, confirm sheet with editable price and x1-x3, editor, manage page Settings > Shortcuts with up/down order, "make a shortcut" from an entry). Shown on Home and Finance. Entries use the old item shape exactly (note = shortcut name). Undo removes all entries of one tap. 73 tests + e2e.
Still pending in part 2: recurring bills, category/workplace/weekly-schedule editors, swap shift, category chart, suggestion banner for repeated entries.

## Phase 08 (part 2b) - Weekly schedule + recurring bills editors: DONE (awaiting approval)
`src/data/plans.js` (setWeekday/replaceSchedule/restoreSchedule, add/update/remove/restoreRecurring; validated, snapshot-guarded, undo), `src/app/plans.js`, Settings > Work hours (weekly schedule, "suggest from my history") and Settings > Finance (recurring bills). Old-app recurring fields (generatedMonths etc.) preserved on edit. 79 tests + e2e.
Still pending in part 2: category/subcategory/workplace editors, swap shift, category share chart.

## Phase 08 (part 2c) - Swap work day, categories, spending chart: DONE (awaiting approval)
Quick action "สลับวันทำงาน" (planSwap in stats.js + saveWorkDays batch, undo), Settings > Categories (add/rename only, no delete: entries store the code; `src/data/categories.js`), Finance "spending by category" bars (categoryShare, % always written out). Tab/page renamed "การงาน". Workplaces stay free text (no list needed yet). 84 tests + e2e. Phase 08 feature set complete.

## Backup UI (pulled forward from Phase 12 at Pee's request): DONE (awaiting approval)
Settings > Data & backup (`src/app/backup-ui.js`): "Back up now" builds one dated JSON file and opens the iPhone share sheet (Save to Files / iCloud), falling back to a download; `bk-last` (ms) is only set after the share/download succeeds. Import: file picker, validation, now-vs-file counts, explicit confirm, automatic snapshot first, undo button after. Accepts TAVON and PP Space 2.0 files. Home backup card now links to this page; reminder after 7 days (Pee's choice). Not yet tested on a real iPhone.

## Phase 08.5 (Visual Identity Refresh): step 1 DONE (awaiting approval)
Pee chose direction "A, warm tone" then "concentric rings (style 3) as the main dial". Built in the real app:
- Home restructured: banners (pending days / backup, only when relevant) -> Today card with 3-ring dial (today hours, week hours, week work days; legend writes every number so colour is never the only signal) -> shortcut buttons -> compact balance row -> week strip (navigation + day panel kept) -> "Latest and upcoming bills" folded in a details block. No feature removed.
- `ringStats` (stats.js, tested), `src/ui/dial.js` (pure SVG, tested), ring draw-in animation (off with reduced motion / motion=off).
- Warmer tokens: light bg/surface warmed, dark theme is now warm brown instead of neutral black; forest accent darkened slightly to keep AA. Logo now switches ink/paper by theme (was invisible in dark mode).
Honest limit: the outer ring is 0 or full (the app records confirmed days, not live hours). Partial fill would need a clock-in feature.

## Pay periods (Pee's payroll check): DONE (awaiting approval)
Pay periods are 1-15 and 16-end of month. Home dial middle ring + third ring now = this pay period (hours, work days); legend label reads like "16-30 พ.ย."; week hours stay in the line under the week strip. Work tab has a new "Pay period" view (สัปดาห์ / รอบเงินเดือน / เดือน): period navigation, confirmed hours vs planned-not-confirmed kept apart, tips, per-day list, "confirm all in this period". No copy/share button, no break deduction, no pay date (Pee: hours only, no breaks). `payPeriod/stepPeriod/periodSummary` tested incl. Feb, leap year, year change; hours summed in hundredths.

## Pay rates per workplace: DONE (awaiting approval)
`tavon-pay-rates` (in backups): [{id, place ('' = every workplace), rate, from ('' = since start)}]; `src/data/pay.js` (CRUD with undo, rateFor, periodPay), `src/app/pay-ui.js` (Settings > Pay rates). Matching is by the day's workplace text (ignoring case/spaces). Own-place rate beats the "every workplace" rate; newest start date <= the day wins, so a raise never changes old periods. Pay period view shows "earned so far" (confirmed hours) and "if you work the plan", labelled before tax / estimate; hours with no rate are reported ("N h not counted"), never guessed. Hours grouped by rate and rounded to the cent once per group. No overtime/holiday pay. 93 tests + e2e (hand-checked $503.00 / $1,223.00).

## Phase 08.5 step 2: DONE (awaiting approval)
Tap the Home dial -> "this week" sheet (7 days, status, place/time, hours, week totals). Day off/leave/swapped: Today card shows "next work day" (looks 28 days ahead, `nextWorkDay` in stats.js). 94 tests, e2e checked.

## Phase 09 step 1: Arrange Home: DONE (awaiting approval)
`tavon-home-layout` {order, hidden} (in backups); `src/data/homelayout.js`, `src/app/home-ui.js`, Settings > Arrange Home. 4 sections (shortcuts, balance, week, recent/bills) can be hidden and reordered; Today card, confirm-days card and backup reminder stay fixed. Read cleans odd data; hiding never deletes data. 99 tests + e2e.
