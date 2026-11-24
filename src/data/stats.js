// @ts-check
// Read-only calculations for the dashboard. Nothing here writes to storage.
// Rules kept from the old app: money page = real money only; tips are NOT added to money automatically;
// recurring expenses are shown as "upcoming" and are never generated here (the old app generated them on load).
import { LEGACY_KEYS, TAVON_KEYS, readKey } from './schema.js';
import { shiftForDate } from './schedule.js';

export const TZ = 'America/Toronto';
const pad = (n) => String(n).padStart(2, '0');
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const cents = (n) => Math.round((Number(n) || 0) * 100);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today as YYYY-MM-DD in Toronto time (the phone may be elsewhere). @param {Date} [now] */
export function todayKey(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
/** @param {string} key @returns {Date} local noon, safe from DST edges */
export const dateFromKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d, 12); };
/** @param {Date} d */
export const keyFromDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Monday of the week containing the day (the old app weeks start on Monday). @param {string} key */
export function weekStartKey(key) {
  const d = dateFromKey(key); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return keyFromDate(d);
}
/** @param {string} key @param {number} n */
export function addDays(key, n) { const d = dateFromKey(key); d.setDate(d.getDate() + n); return keyFromDate(d); }

/** Valid money items, same rule as the old app's validItem(). @param {any} items */
export const validItems = (items) => (Array.isArray(items) ? items.filter((it) => isObj(it) && ['income', 'expense'].includes(it.type) && DATE.test(it.date) && Number(it.amount) > 0) : []);

/** Month totals + closing balance (carried-over + income - expense), computed in cents to avoid rounding drift.
 * @param {any} items @param {string} month YYYY-MM */
export function monthSummary(items, month) {
  let opening = 0, income = 0, expense = 0;
  for (const it of validItems(items)) {
    const c = cents(it.amount) * (it.type === 'income' ? 1 : -1);
    const m = it.date.slice(0, 7);
    if (m < month) opening += c;
    else if (m === month) { if (c > 0) income += c; else expense -= c; }
  }
  return { opening: opening / 100, income: income / 100, expense: expense / 100, balance: (opening + income - expense) / 100 };
}

/** Latest items, newest date first. @param {any} items @param {number} [n] */
export function recentItems(items, n = 5) {
  return validItems(items).slice().sort((a, b) => b.date.localeCompare(a.date) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))).slice(0, n);
}

/** Day a rule is due in a month; short months clamp to the last day (31 -> 28/29/30). */
export function dueDate(month, day) {
  const [y, m] = month.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${pad(Math.min(Number(day), last))}`;
}
/** Recurring expenses due from today through the next `days` days that are not yet generated as items.
 * @param {any} rules @param {string} today @param {number} [days] */
export function upcomingRecurring(rules, today, days = 14) {
  if (!Array.isArray(rules)) return [];
  const end = addDays(today, days), out = [];
  for (const r of rules) {
    if (!isObj(r) || !(Number(r.amount) > 0) || !/^\d{4}-\d{2}$/.test(r.startMonth || '')) continue;
    const generated = new Set(Array.isArray(r.generatedMonths) ? r.generatedMonths : []);
    for (const month of [today.slice(0, 7), nextMonth(today.slice(0, 7))]) {
      if (month < r.startMonth || generated.has(month)) continue;
      const due = dueDate(month, r.day);
      if (due >= today && due <= end) out.push({ id: r.id, due, amount: Number(r.amount), category: r.category || '', daysLeft: Math.round((dateFromKey(due).getTime() - dateFromKey(today).getTime()) / 86400000) });
    }
  }
  return out.sort((a, b) => a.due.localeCompare(b.due));
}
/** @param {string} month */
export function nextMonth(month) { const [y, m] = month.split('-').map(Number); return m === 12 ? `${y + 1}-01` : `${y}-${pad(m + 1)}`; }

/** One day as the person would see it: saved record wins, else the weekly schedule, else off (same as the old effectiveStatus).
 * @param {any} work @param {any} rules @param {string} day */
export function dayInfo(work, rules, day) {
  const rec = isObj(work) && isObj(work[day]) ? work[day] : {};
  const rule = shiftForDate(Array.isArray(rules) ? rules : [], dateFromKey(day));
  const shift = rec.place ? { ...(rule || {}), ...rec } : rule;
  let status = rec.status || (shift ? 'planned' : 'off');
  if (status === 'planned' && !shift) status = 'off';
  const hours = Number(rec.hours ?? shift?.hours ?? 0) || 0;
  return { day, status, hours, tips: Number(rec.tips) || 0, place: shift?.place || '', time: shift?.time || '', note: rec.note || '' };
}

/** Hours and tips for the Monday-start week containing `today`. Tips are summed as recorded (not added to money).
 * @param {any} work @param {any} rules @param {string} today */
export function weekSummary(work, rules, today) {
  const start = weekStartKey(today); let worked = 0, planned = 0, tips = 0, workedDays = 0, plannedDays = 0;
  const days = [];
  for (let i = 0; i < 7; i++) {
    const info = dayInfo(work, rules, addDays(start, i)); days.push(info);
    if (info.status === 'worked') { worked += info.hours; workedDays++; } else if (info.status === 'planned') { planned += info.hours; plannedDays++; }
    tips += info.tips;
  }
  return { start, days, workedHours: worked, plannedHours: planned, workedDays, plannedDays, tips: Math.round(tips * 100) / 100 };
}

/** Whole days since the last backup the app recorded, or null if never. @param {string|number|null|undefined} iso @param {Date} [now] */
export function backupAgeDays(iso, now = new Date()) {
  const raw = String(iso ?? '').trim();
  const t = /^\d+$/.test(raw) ? Number(raw) : Date.parse(raw); // old app stores milliseconds
  if (!Number.isFinite(t) || t <= 0) return null;
  return Math.max(0, Math.floor((now.getTime() - t) / 86400000));
}

/** Read everything the dashboard needs. Reads only. @param {Storage} storage */
export function readDashboardData(storage) {
  const g = (k) => readKey(storage, k).value;
  return { work: g(LEGACY_KEYS.work), items: g(LEGACY_KEYS.finance), recurring: g(LEGACY_KEYS.recurring), rules: g(TAVON_KEYS.shiftSchedule), lastBackup: storage.getItem('bk-last') };
}
/** Is there any real data at all? @param {ReturnType<typeof readDashboardData>} d */
export const hasData = (d) => (isObj(d.work) && Object.keys(d.work).length > 0) || validItems(d.items).length > 0;
