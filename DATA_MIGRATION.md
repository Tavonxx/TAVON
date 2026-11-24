# Data Migration & Backup Plan

## หลักการ (Schema v3 = v2 + ของใหม่)
- **keys เดิมของ PP Space 2.0 ยังเป็นข้อมูลหลัก ห้ามเปลี่ยนชื่อหรือรูปแบบ** → TAVON อ่าน/เขียน key เดิมโดยตรง
- TAVON **เพิ่ม** key ใหม่ขึ้นต้นด้วย `tavon-` เท่านั้น → ถ้า rollback กลับแอปเดิม แอปเดิมยังอ่านข้อมูลได้ทันที ไม่ต้องแปลงกลับ
- Validator **รายงานปัญหา แต่ไม่ลบ/แก้ข้อมูลเอง** (ต่างจากแอปเดิมที่ซ่อนรายการที่ไม่ผ่านแบบเงียบ ๆ)
- ไม่มีข้อมูลส่วนตัวในโค้ด (repo เป็น public)

## Keys
| Key | สถานะ |
|---|---|
| `pee-work-tracker`, `pee-workplaces`, `pee-finance-v1`, `pee-finance-categories-v1`, `pee-finance-subcategories-v1`, `pee-finance-recurring-v1`, `pee-finance-restore-food-v1`, `pee-theme`, `pee-language` | เดิม — คงไว้ |
| `pee-work-tracker-version` | เดิม — TAVON ตั้งเป็น `excel-complete-v2` เสมอเมื่อมีข้อมูลงาน (กันแอปเดิมเขียนทับ) |
| `bk-last` | เดิม — ไม่อยู่ใน backup |
| `tavon-meta` | ใหม่ — schema version + ประวัติ migration |
| `tavon-shift-schedule` | ใหม่ — ตารางกะรายสัปดาห์ `[{weekday, place, time, hours, from?, to?}]` แทนตารางที่ฝังในโค้ดเดิม |
| `tavon-snapshots` | ใหม่ — สำเนาอัตโนมัติก่อน import/restore (เก็บ 3 อันล่าสุด, ไม่อยู่ใน backup) |

## ระบบ Backup (`src/data/backup.js`)
- **Export**: ไฟล์ JSON `{format:'tavon-backup', schema:3, exportedAt, summary, data:{key: rawString}}` เก็บค่าแบบตรงตัวทุกไบต์
- **Import**: รับทั้งไฟล์ TAVON และข้อความ "ส่งออกข้อมูลสำรอง" ของ PP Space 2.0 → ตรวจ JSON ทุก key → แสดงสรุป (จำนวนวันทำงาน/รายการเงิน) ให้ยืนยัน
- Import = **แทนที่** (ไม่ merge) → ไม่มีทางเกิดข้อมูลซ้ำ
- **ก่อน import ถ่าย snapshot อัตโนมัติเสมอ** · ถ้าเขียนล้มเหลวกลางทาง (เช่นพื้นที่เต็ม) → คืนค่าเดิมอัตโนมัติ
- **Undo/Rollback**: `restoreSnapshot()` — และการ restore เองก็ถ่าย snapshot ก่อน จึงย้อนกลับได้อีกชั้น

## ตารางกะ (`src/data/schedule.js`)
- `suggestWeeklySchedule()` เดาตารางจากบันทึกงานจริง 8 สัปดาห์ล่าสุด → ให้พียืนยันในหน้าตั้งค่า (ไม่บันทึกเอง)
- `shiftForDate()` ใช้แทน `scheduleForDate()` ที่ฝังในโค้ดเดิม

## ขั้นตอนย้ายข้อมูลจริง (ทำใน Phase 12 — ต้องได้รับอนุญาตก่อน)
1. แอปเดิม: กด "ส่งออกข้อมูลสำรอง" → เก็บใน Notes/iCloud (สำเนา 2 ที่)
2. เปิด TAVON → Add to Home Screen → เปิดจาก Home Screen
3. นำเข้าข้อมูลสำรอง **ในแอปบน Home Screen** (iOS แยกข้อมูลจาก Safari)
4. เทียบตัวเลขสรุปกับแอปเดิม (วันทำงาน, จำนวนรายการ, ยอดคงเหลือเดือนนี้)
5. ใช้คู่กันสักระยะ แอปเดิมยังอยู่ = rollback ได้ทันที

## ความเสี่ยง
| | สถานะ |
|---|---|
| R1 แอปเดิมเขียนทับข้อมูลงานเมื่อ version ไม่ตรง | ✅ แก้แล้วในโค้ด (`docs/legacy-fix.md`) · ⏸ รออนุญาตก่อนใส่ในลิงก์จริง · TAVON ตั้ง marker ให้เสมอ |
| R2 ข้อมูลอยู่เครื่องเดียว | ลดด้วย backup เป็นไฟล์ + เตือนให้สำรอง (Phase 08–09) · sync ข้ามเครื่อง = ทางเลือกอนาคต |
| R3 import ไม่ validate / ไม่มี undo | ✅ แก้ใน data layer ใหม่ |
| R4 แอปเดิมซ่อนรายการเงินที่ไม่ผ่าน validItem | TAVON รายงานเป็น warning แทน ไม่ลบ |
| R5 localStorage ~5 MB | ตอนนี้ข้อมูลเล็กมาก · snapshot 3 อัน · ถ้าเต็ม import หยุดและไม่เปลี่ยนอะไร |

## ทดสอบ
`npm test` — 11 เทสต์ (round-trip ตรงทุกไบต์, รับ backup เก่า, กัน re-seed, ปฏิเสธไฟล์เสีย, ไม่ลบรายการแปลก, snapshot/undo, ไม่ซ้ำ, พื้นที่เต็ม, ตารางกะ)
