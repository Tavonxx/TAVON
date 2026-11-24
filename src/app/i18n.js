// @ts-check
// Thai (default) + English strings. Only the app's own labels live here; user data is never translated.
export const LANG_KEY = 'tavon-lang';
/** @type {Record<string, {th:string,en:string}>} */
const D = {
  'nav.home': { th: 'หน้าแรก', en: 'Home' },
  'nav.work': { th: 'ชั่วโมงงาน', en: 'Work hours' },
  'nav.money': { th: 'การเงิน', en: 'Finance' },
  'nav.settings': { th: 'ตั้งค่า', en: 'Settings' },
  'nav.add': { th: 'เพิ่ม', en: 'Add' },
  'nav.main': { th: 'เมนูหลัก', en: 'Main' },
  'nav.back': { th: 'กลับ', en: 'Back' },
  'soon': { th: 'เร็ว ๆ นี้', en: 'Soon' },
  'soon.msg': { th: 'ฟีเจอร์นี้จะเปิดใช้ในเฟสถัดไป', en: 'This opens in a later phase' },
  'home.today': { th: 'วันนี้', en: 'Today' },
  'home.week': { th: 'สัปดาห์นี้', en: 'This week' },
  'home.balance': { th: 'ยอดคงเหลือเดือนนี้', en: 'Balance this month' },
  'home.carry': { th: 'ยอดยกมา', en: 'Carried over' },
  'home.income': { th: 'รายรับ', en: 'Income' },
  'home.expense': { th: 'รายจ่าย', en: 'Expenses' },
  'home.recent': { th: 'รายการล่าสุด', en: 'Latest' },
  'home.upcoming': { th: 'บิลที่จะถึง', en: 'Coming up' },
  'home.hours': { th: 'ชั่วโมง', en: 'hours' },
  'home.worked': { th: 'ทำแล้ว', en: 'worked' },
  'home.planned': { th: 'ตามแผน', en: 'planned' },
  'home.tips': { th: 'ทิป', en: 'Tips' },
  'home.tipsnote': { th: 'ทิปยังไม่รวมในการเงิน', en: 'Tips are not counted in finance' },
  'home.addtip': { th: 'ใส่ทิปวันนี้', en: 'Add today’s tip' },
  'home.nothing': { th: 'ยังไม่มีรายการ', en: 'Nothing yet' },
  'home.in': { th: 'อีก {n} วัน', en: 'in {n} days' },
  'home.todaydue': { th: 'วันนี้', en: 'today' },
  'st.worked': { th: 'ทำงานแล้ว', en: 'Worked' },
  'st.planned': { th: 'ตามแผน', en: 'Planned' },
  'st.off': { th: 'วันหยุด', en: 'Day off' },
  'st.leave': { th: 'ลา', en: 'Leave' },
  'st.swapped': { th: 'สลับวัน', en: 'Swapped' },
  'bk.title': { th: 'ถึงเวลาสำรองข้อมูล', en: 'Time to back up' },
  'bk.never': { th: 'ยังไม่เคยสำรองข้อมูล', en: 'No backup yet' },
  'bk.days': { th: 'สำรองล่าสุดเมื่อ {n} วันที่แล้ว', en: 'Last backup {n} days ago' },
  'empty.title': { th: 'ยังไม่มีข้อมูลในแอปใหม่', en: 'No data in the new app yet' },
  'empty.sub': { th: 'ข้อมูลเดิมของพียังอยู่ที่แอปเก่า ปลอดภัยดี การนำเข้ามาแอปนี้จะทำในเฟส 12 หลังสำรองข้อมูลก่อนเสมอ', en: 'Your existing data is still safe in the old app. Importing it here happens in phase 12, always after a backup.' },
  'empty.demo': { th: 'ดูตัวอย่างหน้าตา', en: 'Preview with sample data' },
  'demo.banner': { th: 'โหมดตัวอย่าง: ข้อมูลสมมติ ไม่ได้บันทึกอะไร', en: 'Preview mode: sample data, nothing is saved' },
  'demo.exit': { th: 'ออกจากโหมดตัวอย่าง', en: 'Exit preview' },
  'work.sub': { th: 'ชั่วโมงงาน วันทำงาน และทิป', en: 'Hours, work days and tips' },
  'work.state': { th: 'หน้าชั่วโมงงานกำลังสร้าง', en: 'Work hours is being built' },
  'work.state.sub': { th: 'สัปดาห์ / เดือน / สรุป (เฟส 08)', en: 'Week / month / summary (phase 08)' },
  'money.sub': { th: 'รายรับ รายจ่าย และยอดคงเหลือ', en: 'Income, expenses and balance' },
  'money.state': { th: 'หน้าการเงินกำลังสร้าง', en: 'Finance is being built' },
  'money.state.sub': { th: 'รายการ / ปฏิทิน / ค้นหา (เฟส 08)', en: 'List / calendar / search (phase 08)' },
  'settings.sub': { th: 'หน้าตา ภาษา และข้อมูล', en: 'Look, language and data' },
  'settings.appearance': { th: 'หน้าตา', en: 'Appearance' },
  'settings.appearance.sub': { th: 'ธีม สีหลัก ขนาดตัวอักษร', en: 'Theme, accent, text size' },
  'settings.language': { th: 'ภาษา', en: 'Language' },
  'settings.work': { th: 'ชั่วโมงงาน', en: 'Work hours' },
  'settings.work.sub': { th: 'ร้าน ตารางงานประจำสัปดาห์', en: 'Workplaces, weekly schedule' },
  'settings.money': { th: 'การเงิน', en: 'Finance' },
  'settings.money.sub': { th: 'หมวด รายจ่ายอัตโนมัติ', en: 'Categories, recurring' },
  'settings.data': { th: 'ข้อมูลและสำรอง', en: 'Data & backup' },
  'settings.data.sub': { th: 'ดาวน์โหลด นำเข้า ย้อนกลับ', en: 'Download, import, restore' },
  'ap.theme': { th: 'ธีม', en: 'Theme' },
  'ap.auto': { th: 'อัตโนมัติ', en: 'Auto' },
  'ap.light': { th: 'สว่าง', en: 'Light' },
  'ap.dark': { th: 'มืด', en: 'Dark' },
  'ap.accent': { th: 'สีหลัก', en: 'Accent colour' },
  'ap.terracotta': { th: 'ส้มอิฐ', en: 'Terracotta' },
  'ap.forest': { th: 'เขียวป่า', en: 'Forest' },
  'ap.ocean': { th: 'น้ำเงิน', en: 'Ocean' },
  'ap.mono': { th: 'ขาวดำ', en: 'Mono' },
  'ap.size': { th: 'ขนาดตัวอักษร', en: 'Text size' },
  'ap.density': { th: 'ความแน่น', en: 'Density' },
  'ap.compact': { th: 'แน่น', en: 'Compact' },
  'ap.normal': { th: 'ปกติ', en: 'Normal' },
  'ap.spacious': { th: 'โปร่ง', en: 'Spacious' },
  'ap.motion': { th: 'ลด animation', en: 'Reduce animations' },
  'ap.reset': { th: 'รีเซ็ตหน้าตา', en: 'Reset appearance' },
  'ap.reset.done': { th: 'รีเซ็ตหน้าตาแล้ว', en: 'Appearance reset' },
  'ap.undo': { th: 'ยกเลิก', en: 'Undo' },
  'qa.title': { th: 'เพิ่มอะไรดี', en: 'Add something' },
  'qa.tip': { th: 'ใส่ทิปวันนี้', en: 'Add today’s tip' },
  'qa.expense': { th: 'บันทึกรายจ่าย', en: 'Add expense' },
  'qa.income': { th: 'บันทึกรายรับ', en: 'Add income' },
  'qa.today': { th: 'อัปเดตวันนี้ (ทำงาน/หยุด/ลา)', en: 'Update today (work/off/leave)' },
  'qa.swap': { th: 'สลับวันทำงาน', en: 'Swap work day' },
  'close': { th: 'ปิด', en: 'Close' },
  'nf.title': { th: 'ไม่พบหน้านี้', en: 'Page not found' },
  'nf.btn': { th: 'ไปหน้าแรก', en: 'Go home' },
};
export const LANGS = ['th', 'en'];
/** @param {Storage} [store] */
export function getLang(store = globalThis.localStorage) {
  try { const v = store.getItem(LANG_KEY); return v === 'en' ? 'en' : 'th'; } catch { return 'th'; }
}
/** @param {string} lang @param {Storage} [store] */
export function setLang(lang, store = globalThis.localStorage) {
  try { store.setItem(LANG_KEY, lang === 'en' ? 'en' : 'th'); } catch { /* storage unavailable: language stays Thai */ }
}
/** @param {string} key @param {string} [lang] */
export function t(key, lang = getLang()) {
  const e = D[key];
  if (!e) return key;
  return lang === 'en' ? e.en : e.th;
}
export const KEYS = Object.keys(D);
