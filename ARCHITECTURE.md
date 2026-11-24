# Architecture

## Tech stack — ตัดสินใจ: Vanilla JS (ES Modules) + JSDoc types, ไม่มี build step
| ทางเลือก | ข้อดี | ข้อเสีย |
|---|---|---|
| **✅ Vanilla ES Modules + JSDoc + `tsc --checkJs`** | ไม่มี dependency, GitHub Pages เสิร์ฟตรงได้เลย, เบาสุด (เร็วบน iPhone), พีเปิดอ่านโค้ดเข้าใจง่าย, ใกล้กับแอปเดิม | ต้องเขียน render/state เอง (เล็ก ๆ) |
| Vite + TypeScript + Preact/Svelte | ecosystem ใหญ่ | ต้องมี build + GitHub Actions, dependency เยอะ, ทดสอบในเครื่อง Claude ไม่ได้ (ติดตั้ง package ไม่ได้ในตอนนี้) |

เหตุผลหลัก: ข้อกำหนด "ไม่เพิ่ม dependency ที่ไม่จำเป็น" + "Type safety" ทำได้ทั้งคู่ด้วย JSDoc ที่ `tsc` ตรวจ (มีในเครื่องแล้ว) + ทุกอย่างทดสอบได้จริงก่อนส่ง

## โครงสร้างไฟล์
```
index.html                 app shell (โหลด src/app.js)
manifest.webmanifest, sw.js   PWA (Phase 11)
assets/brand/              โลโก้ SVG, icons (Phase 04)
src/
  app.js                   boot: โหลด settings → ธีม → router
  router.js                hash router (#/today, #/work/week …) — ใช้ได้บน GitHub Pages, ปุ่ม back ทำงาน
  store.js                 state กลาง + subscribe; เขียน localStorage ผ่าน data layer เท่านั้น
  data/                    ✅ schema, backup, schedule (+ work.js, finance.js คำนวณ — ย้าย logic เดิมมาแบบเทียบผลกับแอปเดิม)
  i18n/th.js, en.js        คำแปลแบบ key (แทนระบบแทนข้อความเดิม)
  ui/                      components: button, card, sheet, dialog, toast, segmented, list-row, number, chart…
  features/today|work|money|settings/   แต่ละหน้า
  styles/tokens.css        design tokens (สี ขนาด ระยะ เงา motion) — แก้ที่เดียวเปลี่ยนทั้งแอป
  styles/base.css, components.css
tests/                     node:test (logic) + browser tests (playwright, ใช้ในเครื่อง Claude)
```

## กฎ
- UI ห้ามแตะ localStorage ตรง ๆ → ผ่าน `store` → `data/` เสมอ
- Logic คำนวณ (ชั่วโมง, ทิป, ยอดยกมา, recurring) ต้องมีเทสต์ที่ **ให้ผลเท่ากับแอปเดิม** ก่อนนำไปใช้
- `innerHTML` ใช้ได้เฉพาะผ่าน helper ที่ escape ข้อความผู้ใช้
- ไม่มีข้อมูลส่วนตัวในโค้ด (repo public)
- ตรวจก่อน commit ทุกครั้ง: `npm test` + `npm run typecheck`

## Deploy
GitHub Pages จาก branch `main` (root) · rollback = revert commit หรือเลือกเวอร์ชันเก่า · แอปเดิมยังอยู่ที่ลิงก์ Claude
