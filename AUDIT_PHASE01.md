# TAVON — Phase 01: Existing Website Audit
วันที่: 23 พ.ย. 2026 · เวอร์ชันที่ตรวจ: PP Space 2.0 (Claude artifact `2oFKURpXtUksqnrEPt6hjz`, version `1792245900-f3a5`)

> ตรวจจาก **source code** + เปิดหน้าเว็บจริงใน browser จำลอง iPhone (390×844)
> ข้อมูลจริงของพีอยู่ใน browser บน iPhone ของพีเท่านั้น — ผมมองไม่เห็นข้อมูลจริง เห็นแค่โค้ด

---

## 1. ภาพรวมเทคนิค

| หัวข้อ | สิ่งที่เจอ |
|---|---|
| รูปแบบ | ไฟล์ HTML เดียว 322 KB / 1,763 บรรทัด ไม่มี framework, ไม่มี build step |
| CSS | 7 บล็อก `<style>` รวม 112 KB, ใช้ `!important` **203 จุด**, 29 media queries |
| JavaScript | 15 บล็อก `<script>` ~120 KB, ตัวหลัก 2 ก้อน (Work 30 KB, Finance 47 KB) + patch เล็ก ๆ อีก 11 ก้อน |
| DOM patching | `MutationObserver` 12 ตัว คอยแก้หน้าตาหลัง render (เป็น "แพตช์ทับแพตช์") |
| ภาษา TH/EN | แปลด้วยพจนานุกรม 15 KB ที่ "หาข้อความไทยแล้วแทนด้วยอังกฤษ" ใน DOM |
| โลโก้ | PNG base64 ฝังในไฟล์ 55 KB (ไม่ใช่ SVG, มีพื้นขาว ไม่ปรับตาม Dark mode) |
| เก็บข้อมูล | `localStorage` ของ browser อย่างเดียว ไม่มี server/database |
| PWA | ❌ ไม่มี manifest, ❌ ไม่มี apple-touch-icon, ❌ ไม่มี service worker (มีแค่ `viewport-fit=cover`) |
| ผลทดสอบ | โหลดได้ ~0.26 วินาที, **ไม่มี console error**, JS ทุกก้อน syntax ผ่าน, Dark mode ทำงาน |

## 2. ฟีเจอร์ทั้งหมดที่ต้องรักษา (Feature Inventory)

**หน้าแรก** — ทักทาย, กะงานวันนี้, ยอดคงเหลือปลายเดือน (+รายรับ/−รายจ่าย), การ์ด Work Day Tracker (ความคืบหน้าวันทำงาน), การ์ดรายรับ–รายจ่าย, ปุ่ม + (FAB)

**งาน (Work)** — 3 แท็บ: สัปดาห์ / ปฏิทิน / สรุป
- สัปดาห์: กะวันนี้, เพิ่มทิปวันนี้ (quick tip), อัปเดตวันนี้, สลับกะ (swap), สถิติชั่วโมง/ทิป/วันทำงาน, ตารางสัปดาห์ก่อน–ถัดไป
- ปฏิทินรายเดือน: แตะวันเพื่อบันทึก/แก้ (สถานะ ทำงานแล้ว/รอทำงาน/หยุด/ลา, ชั่วโมง, ทิป, โน้ต, ร้าน)
- สรุปรายเดือน: ชั่วโมงจริง vs ตามตาราง, ชั่วโมงและทิปแยกร้าน, dialog แจกแจงทิป, dialog รายละเอียดรายเดือน
- จัดการร้าน: เพิ่ม/แก้ร้าน, วันเริ่ม–วันออก (ออกแล้ว = ซ่อนกะหลังวันสุดท้าย)

**การเงิน (Money)** — รายรับ/รายจ่ายรายเดือน, ยอดยกมาจากเดือนก่อน (carried-over balance), Category + Subcategory (เพิ่ม/แก้/ซ่อน), รายจ่ายอัตโนมัติรายเดือน (recurring), ปฏิทินรายการ, analytics + สัดส่วนตามหมวด, ลบรายการพร้อมยืนยัน

**ตั้งค่า** — หน้าตา อัตโนมัติ/สว่าง/มืด, ภาษา ไทย/EN, จัดการร้าน, ตั้งค่ารายรับ–รายจ่าย, Backup Export/Import + เตือนเมื่อไม่ได้สำรองเกิน 7 วัน

**Interaction ที่มีแล้ว** — ตัวเลขวิ่ง (animated numbers), กดแล้วยุบ (press feedback), toast "บันทึกแล้ว", รองรับ reduced motion

## 3. โครงสร้างข้อมูล (localStorage keys)

| Key | เก็บอะไร | รูปแบบ |
|---|---|---|
| `pee-work-tracker` | บันทึกรายวัน | `{ "YYYY-MM-DD": {status, hours, tips, note, place, time} }` |
| `pee-work-tracker-version` | เวอร์ชันข้อมูลงาน | `"excel-complete-v2"` |
| `pee-workplaces` | ร้าน | `{ "ชื่อร้าน": {status, startDate, endDate} }` |
| `pee-finance-v1` | รายการเงิน | `[ {id, type, amount, date, category, note, subcategoryId, subcategoryName, recurringId?, recurringMonth?, updatedAt} ]` |
| `pee-finance-categories-v1` | หมวด | `{income:[[id,th,en,active]], expense:[...]}` |
| `pee-finance-subcategories-v1` | หมวดย่อย | object ตาม category |
| `pee-finance-recurring-v1` | กฎรายจ่ายอัตโนมัติ | `[ {id, amount, day, category, startMonth, generatedMonths[] ...} ]` |
| `pee-finance-restore-food-v1` | flag migration เก่า | `"done"` |
| `pee-theme` / `pee-language` | การตั้งค่า | string |
| `bk-last` | เวลา backup ล่าสุด | timestamp |

ความสัมพันธ์: งาน ↔ ร้านผูกกันด้วย **ชื่อร้าน** (ไม่ใช่ ID) · การเงิน ↔ หมวดผูกด้วย category id · รายจ่ายอัตโนมัติผูกด้วย `recurringId` + `recurringMonth` (กันลงซ้ำ) · ทิปจากงาน **ไม่ได้** ไหลเข้าการเงินอัตโนมัติ (ตรงกับกฎของพี: ทิปนับเป็นรายได้เมื่อยืนยันแล้วเท่านั้น)

## 4. 🔴 ความเสี่ยงด้านข้อมูล (สำคัญที่สุด)

1. **ข้อมูลงานถูกเขียนทับได้** — ถ้า `pee-work-tracker-version` ไม่ใช่ `"excel-complete-v2"` แอปจะ **เขียนทับ `pee-work-tracker` ด้วยข้อมูลตัวอย่างที่ฝังในโค้ด** (ส.ค.–ก.ย. 2026) ทันที
   - เกิดได้เมื่อ: import backup ที่ไม่มี key นี้หรือเป็นเวอร์ชันอื่น (ข้อมูลที่เพิ่ง import จะหายหลัง reload), เปิดบนเครื่อง/โดเมนใหม่, หรือมีคนแก้โค้ดเปลี่ยนค่านี้ในอนาคต
   - ผมยืนยันแล้ว: เปิดใน browser ใหม่ แอปสร้างข้อมูลงาน 6 KB เองทันที
2. **ข้อมูลอยู่เครื่องเดียว** — localStorage ผูกกับ browser + โดเมน: ล้างข้อมูล Safari = หาย, Safari กับแอปบน Home Screen ของ iOS **เก็บข้อมูลแยกกัน**, ย้ายจาก chatgpt.site → Claude ข้อมูลไม่ตามมาเอง (ต้อง export/import)
3. **Import ไม่มี safety net** — ไม่ตรวจ schema, ไม่สำรองข้อมูลเดิมอัตโนมัติก่อนทับ, ไม่มี Undo
4. **Backup แบบ copy-paste ข้อความ** — ใช้ได้ แต่ไม่มีปุ่มดาวน์โหลดไฟล์ (ต้อง copy ไปวางใน Notes เอง)

## 5. 🟠 Technical Debt

- CSS ซ้อนกัน 7 ชั้น + `!important` 203 จุด → แก้สีจุดเดียวต้องไล่หลายที่ ไม่มี design tokens กลางจริง
- 12 MutationObservers แก้ DOM หลัง render → ช้าลงเมื่อข้อมูลเยอะ และพังง่ายเวลาแก้โค้ด
- ระบบภาษาแบบแทนข้อความ → ถ้าแก้คำไทยนิดเดียว คำแปลอังกฤษหายเงียบ ๆ
- **ข้อมูลฝังในโค้ด**: ตารางกะของร้านที่ทำงาน, วันที่ 2026, ร้าน default → ถ้าเปลี่ยนงานต้องแก้โค้ด
- โค้ดเก่าค้าง: drawer menu, more-sheet, ปุ่ม nav calendar/summary ที่ซ่อนอยู่
- งาน ↔ ร้าน ผูกด้วยชื่อ → เปลี่ยนชื่อร้านเสี่ยงประวัติไม่ตรงกัน
- ใช้ `confirm()` ของ browser (หน้าตาไม่เข้ากับแอป) และ `innerHTML` 37 จุด (การเงินมี escapeHtml แล้ว ต้องเช็คฝั่งงานต่อ)

## 6. 🟡 ปัญหา UX/UI ที่เห็นจากหน้าจอ

- ปุ่ม **+ ลอยทับเนื้อหา** (ทับการ์ดหน้าแรก, ทับส่วนสำรองข้อมูลในตั้งค่า)
- ส่วน **Backup ถูกซ่อนใต้ bottom nav** ในหน้าตั้งค่า — ฟีเจอร์สำคัญที่สุดกลับหายาก
- ภาษาปนกัน: "Work Day Tracker", "MONEY TRACKER", "HRS/TIP" ในโหมดไทย
- โลโก้ TAVON เป็นรูป raster พื้นขาว → ดูแปลกใน Dark mode, ไม่คม
- ยังไม่มี Undo หลังลบ/แก้ไข, ไม่มี Search/Filter รายการเงิน
- หน้าแรกยังไม่ปรับแต่งได้ (ซ่อน/เรียงการ์ดไม่ได้)
- ดีไซน์ฟ้า-ส้มดูดี แต่ยังเป็นสไตล์ "แอปทั่วไป" ยังไม่มีเอกลักษณ์ TAVON

## 7. ข้อเสนอ: รักษา / ปรับ / ออกแบบใหม่

| ส่วน | ข้อเสนอ |
|---|---|
| Logic คำนวณชั่วโมง ทิป ยอดยกมา recurring | **รักษา** (ย้ายเป็นโมดูลแยก + เขียนเทสต์ครอบก่อนแตะ) |
| localStorage keys + schema เดิม | **รักษา + อ่านได้ตลอด** (backward compatible) |
| Seed/ข้อมูลฝังในโค้ด | **ปลดออก** — ย้ายตารางกะไปเป็นค่าที่ตั้งได้ในแอป และไม่เขียนทับข้อมูลเดิมเด็ดขาด |
| Backup | **ปรับ** — ดาวน์โหลดไฟล์ได้, ตรวจ schema, สำรองอัตโนมัติก่อน import, Undo |
| CSS/ภาษา/patch scripts | **เขียนใหม่** เป็น design tokens + i18n แบบ key |
| Layout/Nav/Dashboard | **ออกแบบใหม่** ตาม Phase 03–07 |
| PWA | **เพิ่ม** manifest, icons, service worker (ขึ้นกับว่าจะ host ที่ไหน — ดูข้อ 8) |

## 8. เรื่องที่ต้องให้พีตัดสินใจก่อน Phase 02

1. **จะ host เว็บที่ไหน?** PWA เต็มรูปแบบ (offline + icon + standalone) ต้องใช้ manifest และ service worker
   - A) อยู่บน Claude artifact ต่อ — ง่ายสุด แต่ **ผมยังไม่ได้ยืนยัน** ว่า artifact รองรับ service worker/manifest ได้ครบ
   - B) ย้ายไป GitHub + GitHub Pages (ฟรี) — PWA ได้ครบ, มี Git history/rollback จริง (ต้องเชื่อม GitHub กับ Claude ก่อน)
2. **ข้อมูลจริงตอนนี้อยู่ที่ไหน?** Safari ที่ลิงก์ Claude, เว็บ chatgpt.site เดิม, หรือแอปบน Home Screen? → ก่อนแก้อะไร ให้กด **ส่งออกข้อมูลสำรอง** เก็บไว้ใน Notes/iCloud ก่อนทุกครั้ง
3. **ชื่อแอป**: ใช้ "TAVON" เป็นชื่อแอปเลย หรือ "Pee's Space by TAVON"?
4. ยืนยันว่า **ย้ายตารางกะที่ฝังในโค้ดไปเป็นการตั้งค่า** ได้ (ข้อมูลเดิมไม่หาย)

## 9. ขั้นต่อไป (Phase 02 — Data Backup & Compatibility Planning)
แก้ความเสี่ยงข้อ 4.1 แบบเล็กที่สุดก่อน (กันเขียนทับ) · ออกแบบ schema v3 ที่อ่านข้อมูล v2 ได้ · ระบบ backup/restore/rollback · เขียนเทสต์ migration
