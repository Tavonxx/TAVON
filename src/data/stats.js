// @ts-check
// Read-only calculations for the dashboard. Nothing here writes to storage.
// Rules kept from the old app: money page = real money only; tips are NOT added to money automatically;
// recurring expenses are shown as "upcoming" and are never generated here (the old app generated them on load).
import { LEGACY_KEYS, TAVON_KEYS, readKey } from './schema.js';
import { DataError } from './store.js';
import { shiftForDate } from './schedule.js';
import { readShortcuts } from './shortcuts.js';

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
  return { work: g(LEGACY_KEYS.work), items: g(LEGACY_KEYS.finance), recurring: g(LEGACY_KEYS.recurring), rules: g(TAVON_KEYS.shiftSchedule), lastBackup: storage.getItem('bk-last'), shortcuts: readShortcuts(storage) };
}
/** Is there any real data at all? @param {ReturnType<typeof readDashboardData>} d */
export const hasData = (d) => (isObj(d.work) && Object.keys(d.work).length > 0) || validItems(d.items).length > 0;

/** Worked days/hours and tips for a month. Planned days are counted separately. @param {any} work @param {any} rules @param {string} month YYYY-MM */
export function monthWork(work, rules, month) {
  const [y, m] = month.split('-').map(Number); const n = new Date(y, m, 0).getDate();
  let workedDays = 0, workedHours = 0, plannedDays = 0, plannedHours = 0, tips = 0; const days = [];
  for (let d = 1; d <= n; d++) {
    const info = dayInfo(work, rules, `${month}-${pad(d)}`); days.push(info);
    if (info.status === 'worked') { workedDays++; workedHours += info.hours; } else if (info.status === 'planned') { plannedDays++; plannedHours += info.hours; }
    tips += info.tips;
  }
  return { days, workedDays, workedHours, plannedDays, plannedHours, tips: Math.round(tips * 100) / 100 };
}

/** Month items after search/filter, newest first. `label(type, code)` gives the category name for text search.
 * @param {any} items @param {string} month @param {{q?:string,type?:string,category?:string}} f @param {(type:string,code:string)=>string} label */
export function filterItems(items, month, f, label) {
  const q = String(f.q || '').trim().toLowerCase();
  return validItems(items).filter((it) => it.date.startsWith(month)
    && (!f.type || it.type === f.type) && (!f.category || it.category === f.category)
    && (!q || String(it.note || '').toLowerCase().includes(q) || label(it.type, it.category).toLowerCase().includes(q) || String(it.amount).includes(q)))
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
}

/** Past days (before today, within `lookback`) that the schedule says were work days but were never confirmed.
 * @param {any} work @param {any} rules @param {string} today @param {number} [lookback] */
export function pendingPastDays(work, rules, today, lookback = 14) {
  const out = [];
  for (let i = 1; i <= lookback; i++) {
    const info = dayInfo(work, rules, addDays(today, -i));
    if (info.status === 'planned') out.push(info);
  }
  return out.reverse();
}
/** Distinct recent tip amounts (newest first) so the person can tap instead of typing. @param {any} work @param {number} [n] */
export function recentTips(work, n = 4) {
  if (!isObj(work)) return [];
  const seen = new Set(), out = [];
  for (const day of Object.keys(work).filter((d) => DATE.test(d)).sort().reverse()) {
    const v = Math.round((Number(work[day]?.tips) || 0) * 100) / 100;
    if (v > 0 && !seen.has(v)) { seen.add(v); out.push(v); if (out.length >= n) break; }
  }
  return out;
}
/** Category codes of one type, most used first (last 180 days, ties: most recent). @param {any} items @param {string} type @param {string} today */
export function categoryRanking(items, type, today) {
  const since = addDays(today, -180), score = new Map(), last = new Map();
  for (const it of validItems(items)) if (it.type === type && it.date >= since) { score.set(it.category, (score.get(it.category) || 0) + 1); if (!last.has(it.category) || it.date > last.get(it.category)) last.set(it.category, it.date); }
  return [...score.keys()].sort((a, b) => score.get(b) - score.get(a) || String(last.get(b)).localeCompare(String(last.get(a))));
}
/** Entries the person repeats (same type + category + amount, at least twice in 90 days), most frequent first.
 * @param {any} items @param {string} today @param {number} [n] */
export function frequentTemplates(items, today, n = 4) {
  const since = addDays(today, -90), m = new Map();
  for (const it of validItems(items)) {
    if (it.date < since || it.date > today) continue;
    const k = JSON.stringify([it.type, it.category, cents(it.amount)]);
    const e = m.get(k) || { type: it.type, category: it.category, amount: cents(it.amount) / 100, note: it.note || '', count: 0, last: '' };
    e.count++; if (it.date >= e.last) { e.last = it.date; e.note = it.note || e.note; } m.set(k, e);
  }
  return [...m.values()].filter((e) => e.count >= 2).sort((a, b) => b.count - a.count || b.last.localeCompare(a.last)).slice(0, n);
}
/** Per-day entry counts for the calendar. @param {any} items @param {string} month */
export function itemsByDay(items, month) {
  /** @type {Record<string, {income:number, expense:number, items:any[]}>} */ const out = {};
  for (const it of validItems(items)) if (it.date.startsWith(month)) { const e = (out[it.date] ||= { income: 0, expense: 0, items: [] }); e[it.type]++; e.items.push(it); }
  return out;
}

/** Swap a work day to another day. Returns the two day edits for saveWorkDays, or throws DataError('swap*').
 * from = a day you were due to work; to = a day you are free. The old day becomes "swapped" (0 hours), the new day takes its place/time/hours.
 * @param {any} work @param {any} rules @param {string} from @param {string} to */
export function planSwap(work, rules, from, to) {
  const a = dayInfo(work, rules, from), b = dayInfo(work, rules, to);
  if (from === to) throw new DataError('Same day', 'swapsame');
  if (!['planned', 'worked'].includes(a.status)) throw new DataError('Not a work day', 'swapfrom');
  if (['planned', 'worked'].includes(b.status)) throw new DataError('Already a work day', 'swapto');
  return [
    { day: from, patch: { status: 'swapped', hours: 0 } },
    { day: to, patch: { status: a.status === 'worked' ? 'worked' : 'planned', hours: a.hours, place: a.place, time: a.time } },
  ];
}

/** Where the month's money of one type went: per category, biggest first. Beyond `top` categories are grouped as code ''.
 * @param {any} items @param {string} month @param {'income'|'expense'} [type] @param {number} [top] */
export function categoryShare(items, month, type = 'expense', top = 5) {
  const by = new Map(); let total = 0;
  for (const it of validItems(items)) if (it.type === type && it.date.slice(0, 7) === month) { const c = cents(it.amount); by.set(it.category, (by.get(it.category) || 0) + c); total += c; }
  if (!total) return { total: 0, rows: [] };
  let rows = [...by.entries()].sort((a, b) => b[1] - a[1]).map(([category, c]) => ({ category, cents: c }));
  if (rows.length > top) { const rest = rows.slice(top).reduce((s, r) => s + r.cents, 0); rows = [...rows.slice(0, top), { category: '', cents: rest }]; }
  return { total: total / 100, rows: rows.map((r) => ({ category: r.category, amount: r.cents / 100, pct: Math.round((r.cents / total) * 100) })) };
}

/** The pay period a date falls in: the 1st-15th or the 16th-end of that month. @param {string} key */
export function payPeriod(key) {
  const [y, m, d] = key.split('-').map(Number), last = new Date(y, m, 0).getDate(), ym = `${y}-${pad(m)}`;
  return d <= 15 ? { start: `${ym}-01`, end: `${ym}-15` } : { start: `${ym}-16`, end: `${ym}-${pad(last)}` };
}
/** The period right before / after the one that contains `key`. @param {string} key @param {-1|1} dir */
export function stepPeriod(key, dir) { const p = payPeriod(key); return payPeriod(dir < 0 ? addDays(p.start, -1) : addDays(p.end, 1)); }
/** Hours, days and tips of one pay period. "worked" = confirmed days, "planned" = still only planned. Hours are summed in hundredths.
 * @param {any} work @param {any} rules @param {string} key any date inside the period */
export function periodSummary(work, rules, key) {
  const { start, end } = payPeriod(key); let wh = 0, ph = 0, wd = 0, pd = 0, tips = 0; const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const i = dayInfo(work, rules, d); days.push(i);
    if (i.status === 'worked') { wh += Math.round(i.hours * 100); wd++; } else if (i.status === 'planned') { ph += Math.round(i.hours * 100); pd++; }
    tips += Math.round(i.tips * 100);
  }
  return { start, end, days, workedHours: wh / 100, plannedHours: ph / 100, workedDays: wd, plannedDays: pd, tips: tips / 100 };
}

/** What the three Home rings show: today's hours, this PAY PERIOD's hours, this period's work days. "done" = confirmed as worked.
 * Week numbers are still returned for the week summary line. @param {any} work @param {any} rules @param {string} today */
export function ringStats(work, rules, today) {
  const i = dayInfo(work, rules, today), w = weekSummary(work, rules, today), p = periodSummary(work, rules, today);
  const works = i.status === 'worked' || i.status === 'planned';
  return {
    status: i.status,
    today: { done: i.status === 'worked' ? i.hours : 0, target: works ? i.hours : 0 },
    hours: { done: p.workedHours, total: Math.round((p.workedHours + p.plannedHours) * 100) / 100 },
    days: { done: p.workedDays, total: p.workedDays + p.plannedDays },
    period: { start: p.start, end: p.end },
    tips: w.tips,
  };
}
