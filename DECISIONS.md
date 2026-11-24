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
