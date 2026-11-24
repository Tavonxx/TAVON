# Decisions
- 2026-11-23 · Phase 01 เป็นการตรวจอย่างเดียว ไม่แก้ artifact จริง
- 2026-11-23 · ข้อมูลจริงอยู่ที่ลิงก์ Claude artifact (Safari) → ย้ายด้วย Export/Import
- 2026-11-23 · ชื่อแอป: **TAVON**
- 2026-11-23 · ย้ายตารางกะที่ฝังในโค้ดไปเป็นการตั้งค่าในแอป (Claude เลือกวิธีเอง)
- 2026-11-23 · Hosting: **GitHub Pages** (repo public → ต้องเอาข้อมูลส่วนตัวที่ฝังในโค้ดออกก่อน push)
- 2026-11-23 · Schema v3 = keys เดิมของ v2 คงไว้เป็นข้อมูลหลัก + เพิ่ม key `tavon-*` เท่านั้น (rollback ไม่ต้องแปลง)
- 2026-11-23 · Import = แทนที่ + snapshot อัตโนมัติก่อนเสมอ (ไม่ merge → ไม่มีข้อมูลซ้ำ)
- 2026-11-23 · Validator รายงานอย่างเดียว ไม่ลบข้อมูล
- 2026-11-23 · ตารางกะ: เดาจากบันทึกจริง แล้วให้พียืนยัน (ไม่ฝังในโค้ด)
- 2026-11-23 · เทสต์ใช้ node:test ในตัว ไม่เพิ่ม dependency
- 2026-11-23 · ใส่ตัวแก้ R1 ในลิงก์ Claude จริงแล้ว (พีอนุญาต)
- 2026-11-23 · Stack: Vanilla ES Modules + JSDoc + tsc, ไม่มี build step, hash router
- 2026-11-23 · Nav: tab bar 5 ช่อง (วันนี้ / งาน / ＋ / เงิน / ตั้งค่า), ＋ แทนปุ่มลอย, เลิก drawer/more-sheet
- 2026-11-23 · Phase 03 อนุมัติ · แท็บแรกชื่อ "หน้าแรก" (Home) ไว้ก่อน เปลี่ยนได้ทีหลัง · การ์ดหน้าแรก 6 ใบตามแผน
- 2026-11-23 · โลโก้: เลือกสัญลักษณ์ C (3 บล็อก, ช่องว่าง 5 หน่วย) แบบขาวดำ ไม่ใส่สี · ทดลองสีและตัวอักษรต่อกัน (ligature) แล้วไม่เลือก
- 2026-11-23 · ฟอนต์ตัวหนังสือ TAVON: ยังไม่เลือก (ตัวเลือกอยู่ในแชท: Inter Display, Montserrat, DM Sans, Adventor, Poppins) — เปลี่ยนได้ทุกเมื่อ
- 2026-11-23 · โลโก้สุดท้าย: สัญลักษณ์ C ขาวดำ ช่องว่าง 5 + wordmark ฟอนต์ 1 (Inter Display Medium, tracking 0.12em) · ไอคอนแอปพื้น Ink + สัญลักษณ์ Paper
- 2026-11-23 · พาเลตต์แบรนด์ = Ink / Paper / Graphite / Stone / Line · สี accent ของ UI ตัดสินใน Phase 05

## D-Phase05
- Appearance stored in separate key `tavon-appearance`; legacy keys untouched.
- Accent default terracotta; 4 options kept so Pee can choose in the live style guide.
- Native `<dialog>` for sheets/alerts; no component library.
- Accent chosen by Pee: **Terracotta** (default). Other accents stay available as a user setting.

## D-Phase06
- Hash router (no server config needed on GitHub Pages). Language stored in its own key `tavon-lang`; legacy `pee-language` is left untouched until Phase 12 migration.
- Quick Actions items are visible but marked "Soon" and show a toast, instead of being hidden.

- Labels renamed per Pee: tab/page "งาน" -> "ชั่วโมงงาน", "เงิน" -> "การเงิน"; the word "กะ" removed from app text.

## D-Phase07
- Dashboard is strictly read-only. Recurring bills shown as upcoming, never generated on load (the old app wrote them on load).
- Tips are shown separately and not added to money, per the old business rule.
- Preview uses in-memory sample data so Pee can judge the design without real data.

## D-Phase08
- All writes go through src/data/store.js; damaged data is never overwritten; a snapshot is taken once per session before the first edit.
- Undo toast (5 s) instead of confirm dialogs for entry deletes; confirm dialogs reserved for bigger deletes (categories, workplaces) in part 2.
- Adding a tip on a day with no record preselects status "worked".

## D-Phase08b
- Reducing typing is a core requirement: smart defaults (schedule hours, most-used category, today/selected date), one-tap repeat and batch confirm, all undoable. Never auto-confirm silently: the person taps once.
- Calendar colours: income green, expense red (same as the +/- amounts) plus shape (circle/square) and a number, so it is not colour-only.

## D-Roadmap
- Added Phase 08.5 (Visual Identity Refresh) at Pee request, after Phase 08 and before 09, so customization and animation use the final look. Numbering of other phases unchanged. Style is token-driven, so the refresh does not touch data or features.

## D-Phase08c
- Shortcuts replace the auto-picked "frequent entries" chips: Pee controls the buttons; order never reorders itself (muscle memory).
- Shortcut entries use the legacy item shape unchanged (note = label), so no schema change for money data. Shortcut definitions live in new key tavon-shortcuts.
- Superseded the "commute bundle on confirm" idea: pressing a shortcut only when it really happened avoids fixing wrong auto-entries.

- Pee later renamed tab/page "ชั่วโมงงาน" -> "การงาน" (EN: Work). Swap feature is always worded "สลับวันทำงาน".

## D-Phase08d
- Categories: add + rename only. Deleting would orphan old entries (they store the code). Codes never change.
- Workplaces are free text per day/schedule; a managed list deferred unless Pee wants quick-pick chips.
- Swap: from-day -> status swapped, 0 hours; to-day -> planned/worked with the same place/time/hours. Refuses if from is not a work day or to already is.

## D-Backup
- Reminder fixed at 7 days (Pee chose weekly); no interval setting (not needed).
- Import REPLACES (no merge, no duplicates), always snapshots first. Phase 12 still owns the careful migration of the old app data, with its own backup and explicit permission.

## D-Phase085a
- Direction: dial (A) in warm tone, concentric rings (3). Rings = today hours / week hours / week work days. Tips live in the detail view, not a ring.
- Outer ring cannot show partial progress: data model has confirmed days only. Not faked.
- Home slimmed by folding recent + upcoming bills into a details block (nothing deleted).
