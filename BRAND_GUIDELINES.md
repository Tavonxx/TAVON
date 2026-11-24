# TAVON — Brand Guidelines (v1)

บุคลิก: Premium · Minimal · Timeless · Futuristic · Elegant · Intelligent · Precision
ภาพรวมไฟล์: `assets/brand/brand-sheet.png`

## 1. สัญลักษณ์ (Symbol)
สี่เหลี่ยมมุมมนที่ถูกแบ่งด้วย **ช่องว่าง** เป็น 3 บล็อก ช่องว่างนั้นเองคือตัว **T** (negative space) · 3 บล็อก = โมดูลของ Personal OS ที่จะเติบโตต่อ
- สัดส่วน (กริด 100×100): สี่เหลี่ยม 4→96, มุมโค้ง 22, ช่องว่างทุกเส้น **5 หน่วย**, เส้นแนวนอนอยู่ที่ y=34
- ขาวดำเท่านั้น ไม่มีสีประจำบล็อก (ตัดสินใจแล้ว — ดู DECISIONS.md)

## 2. ตัวหนังสือ (Wordmark)
`TAVON` ตัวพิมพ์ใหญ่ · Inter Display Medium · ระยะห่างตัวอักษร 0.12em · แปลงเป็นเส้นวาด (outline) แล้ว ไม่ต้องติดตั้งฟอนต์
(Inter เผยแพร่ภายใต้ SIL Open Font License — ใช้ทำโลโก้ได้)

## 3. Lockup (สัญลักษณ์ + ตัวหนังสือ)
ความสูงตัวพิมพ์ใหญ่ ≈ 51% ของสัญลักษณ์ · ระยะระหว่างสัญลักษณ์กับตัวหนังสือ ≈ 29% ของสัญลักษณ์ · จัดกึ่งกลางแนวตั้ง

## 4. พื้นที่รอบโลโก้ และขนาดต่ำสุด
- เว้นว่างรอบโลโก้อย่างน้อย **¼ ของความสูงสัญลักษณ์**
- สัญลักษณ์เล็กสุด **16 px** (favicon) · lockup สูงอย่างน้อย **28 px** ถ้าเล็กกว่านั้นใช้สัญลักษณ์อย่างเดียว

## 5. สี
| ชื่อ | ค่า | ใช้กับ |
|---|---|---|
| Ink | `#141414` | โลโก้, ข้อความ, พื้นโหมดมืด |
| Paper | `#F4F1EA` | พื้นโหมดสว่าง (ขาวอุ่น), โลโก้บนพื้นมืด |
| Graphite | `#3A3936` | ข้อความรองบนพื้นสว่าง |
| Stone | `#8C897F` | ข้อความจาง, ไอคอนไม่ active |
| Line | `#DDD8CC` | เส้นแบ่งบนพื้นสว่าง |

สีเน้น (accent) ของตัวแอป เช่น ปุ่ม กราฟ สถานะ — **ยังไม่กำหนด** จะเลือกใน Phase 05 (Design System) แบรนด์เองคงเป็นขาวดำ

## 6. ตัวอักษร
- แบรนด์/หัวข้อใหญ่: Inter Display Medium
- ตัวแอป (แนะนำ): Inter + ฟอนต์ไทยของระบบ iPhone (Inter ไม่มีอักษรไทย iPhone จะใช้ฟอนต์ไทยของระบบแทนอัตโนมัติ) — ยืนยันใน Phase 05

## 7. ห้ามทำ
ใส่สี · ไล่เฉด (gradient) · เงา · ขอบเรืองแสง · ยืด/บีบ/หมุนโลโก้ · เปลี่ยนช่องว่างหรือสัดส่วน · วางบนพื้นที่ตัดกันน้อย · แต่งตัวหนังสือ TAVON ด้วยฟอนต์อื่น

## 8. ไฟล์ (`assets/brand/`)
| ไฟล์ | ใช้เมื่อ |
|---|---|
| `tavon-symbol.svg` | ในเว็บ — สีตาม CSS (`color`) จึงปรับตามโหมดสว่าง/มืดได้ |
| `tavon-symbol-ink.svg` / `-paper.svg` | ที่ต้องกำหนดสีตายตัว: ดำ / ขาวอุ่น |
| `tavon-wordmark.svg`, `-ink`, `-paper` | ตัวหนังสืออย่างเดียว |
| `tavon-logo.svg`, `-ink`, `-paper` | lockup หลัก |
| `icons/app-icon-1024.png` | ไอคอนต้นฉบับสำหรับ iPhone (เต็มกรอบ ไม่โปร่งใส ไม่ตัดมุม — iOS ตัดมุมเอง) |
| `icons/apple-touch-icon.png` (180) | Add to Home Screen บน iPhone |
| `icons/icon-192.png`, `icon-512.png` | PWA ปกติ |
| `icons/icon-maskable-512.png` | PWA แบบ maskable (สัญลักษณ์อยู่ในโซนปลอดภัย) |
| `icons/favicon.svg` | แท็บเบราว์เซอร์ — เปลี่ยนสีตามโหมดมืด/สว่างของเบราว์เซอร์ |
| `icons/favicon-32.png`, `favicon-16.png`, `favicon.ico` | ตัวสำรอง |

ไอคอนแอป: พื้น Ink + สัญลักษณ์ Paper ขนาด 58% ของไอคอน (maskable 50%)

## 9. การนำไปใช้ในแอป (ทำใน Phase 06/11)
```html
<link rel="icon" href="assets/brand/icons/favicon.svg" type="image/svg+xml">
<link rel="icon" href="assets/brand/icons/favicon.ico" sizes="48x48">
<link rel="apple-touch-icon" href="assets/brand/icons/apple-touch-icon.png">
```
manifest: ใช้ `icon-192.png`, `icon-512.png` (purpose any) และ `icon-maskable-512.png` (purpose maskable)

## 10. แก้ไขแบรนด์ภายหลัง
แก้ไฟล์ SVG หรือ tokens ที่เดียว แล้วสร้างไอคอน PNG ใหม่ · ไอคอนบน Home Screen ของ iPhone ที่ติดตั้งไปแล้วต้องลบแล้วเพิ่มใหม่จึงจะเปลี่ยน (สำรองข้อมูลก่อนเสมอ)
