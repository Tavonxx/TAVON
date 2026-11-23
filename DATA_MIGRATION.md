# Data Migration (เริ่มจาก Phase 01)
## Schema ปัจจุบัน (v2) — ต้องอ่านได้ตลอด
`pee-work-tracker`, `pee-work-tracker-version`="excel-complete-v2", `pee-workplaces`, `pee-finance-v1`, `pee-finance-categories-v1`, `pee-finance-subcategories-v1`, `pee-finance-recurring-v1`, `pee-finance-restore-food-v1`, `pee-theme`, `pee-language`, `bk-last` (รายละเอียดใน AUDIT_PHASE01.md ข้อ 3)

## ความเสี่ยงที่ต้องแก้ก่อน
- R1 seed overwrite เมื่อ version ไม่ตรง (สำคัญสุด)
- R2 localStorage แยกตาม browser/โดเมน/Home Screen
- R3 import ไม่ validate, ไม่มี auto-backup ก่อนทับ

## Rollback ตอนนี้
- Source เดิม: `backup_PP_Space_2.0_live.html` + version `1792245900-f3a5` ใน artifact
- ข้อมูล: ใช้ปุ่ม "ส่งออกข้อมูลสำรอง" ในแอป ก่อนเปลี่ยนแปลงทุกครั้ง
