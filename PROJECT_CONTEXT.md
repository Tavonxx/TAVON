# TAVON — Project Context
- เจ้าของ: พี (Peerapat) · ผู้ใช้หลัก iPhone/Safari · ไทย/อังกฤษ · สกุลเงิน CAD · Toronto
- ของเดิม: "PP Space 2.0" — Claude artifact https://claude.ai/artifact/2oFKURpXtUksqnrEPt6hjz (ไฟล์ HTML เดียว, localStorage)
- เป้าหมาย: รีดีไซน์ทั้งระบบเป็น **TAVON** — Premium, minimal (Apple × SpaceX), mobile-first, PWA บน iPhone, ปรับแต่งได้, อนาคตเป็น Personal OS
- ฟีเจอร์หลัก: Work Day Tracker (กะ/ชั่วโมง/ทิป/ร้าน) · Money (รายรับ–รายจ่าย/หมวด/recurring/ยอดยกมา) · Settings/Backup

## กฎที่ห้ามละเมิด
- ห้ามทำข้อมูลเดิมหาย/เขียนทับ · อ่าน localStorage keys เดิมได้เสมอ · ไม่ใช้ mock data แทนข้อมูลจริง
- ห้ามตัดฟีเจอร์เดิม · ห้ามเปลี่ยน logic คำนวณ/ยอดยกมาโดยไม่ได้รับอนุญาต
- Work Day Tracker ห้ามคาดการณ์เงินเดือน · ทิปนับเป็นรายได้เมื่อยืนยันแล้วเท่านั้น · หน้าการเงิน = เงินจริงเท่านั้น
- ทำทีละ Phase, หยุดให้พีอนุมัติทุก Phase · ไม่ deploy/แก้ของจริงโดยไม่ได้รับอนุญาต
- ไม่ใช้ gradient/glassmorphism/shadow เกินจำเป็น · รองรับ reduced motion, WCAG 2.2 AA
