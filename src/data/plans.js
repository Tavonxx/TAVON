// @ts-check
// Weekly work schedule (tavon-shift-schedule) and recurring bills (pee-finance-recurring-v1). Edited only through here.
import { LEGACY_KEYS, TAVON_KEYS } from './schema.js';
import { read, write, guard, newId, DataError, isRealDate } from './store.js';

const SCH = TAVON_KEYS.shiftSchedule, REC = LEGACY_KEYS.recurring;

/** Replace one weekday's rule (or clear it with null). Other fields of other rules stay as they are.
 * @param {Storage} st @param {number} weekday 0=Sun..6=Sat @param {{place:string,time?:string,hours:number|string}|null} rule @param {Date} [now]
 * @returns {{prev:any[]}} */
export function setWeekday(st, weekday, rule, now = new Date()) {
  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) throw new DataError('Invalid weekday', 'invalid');
  let next = null;
  if (rule) {
    const place = String(rule.place ?? '').trim(); const hours = Number(rule.hours);
    if (!place || place.length > 40 || !(hours > 0 && hours <= 24)) throw new DataError('Invalid shift', 'invalid');
    const time = String(rule.time ?? '').trim().slice(0, 20);
    next = { weekday, place, time, hours };
  }
  const list = read(st, SCH, 'array'); guard(st, now);
  const rest = list.filter((r) => r?.weekday !== weekday);
  write(st, SCH, next ? [...rest, next].sort((a, b) => a.weekday - b.weekday) : rest);
  return { prev: list };
}
/** Replace the whole schedule (e.g. accept a suggestion). Returns the old list for undo. @param {Storage} st @param {any[]} rules @param {Date} [now] */
export function replaceSchedule(st, rules, now = new Date()) {
  const clean = rules.map((r) => ({ weekday: r.weekday, place: String(r.place).trim(), time: String(r.time || ''), hours: Number(r.hours) }))
    .filter((r) => Number.isInteger(r.weekday) && r.weekday >= 0 && r.weekday <= 6 && r.place && r.hours > 0);
  const list = read(st, SCH, 'array'); guard(st, now); write(st, SCH, clean); return { prev: list };
}
/** Undo for the schedule functions. @param {Storage} st @param {any[]} prev */
export function restoreSchedule(st, prev) { write(st, SCH, prev); }

/** @param {any} f */
function cleanRule(f) {
  const amount = Math.round(Number(String(f.amount ?? '').replace(',', '.')) * 100) / 100;
  if (!(amount > 0) || amount > 1e6) throw new DataError('Invalid amount', 'invalid');
  const day = Number(f.day); if (!Number.isInteger(day) || day < 1 || day > 31) throw new DataError('Invalid day', 'invalid');
  const startMonth = String(f.startMonth ?? ''); if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(startMonth) || !isRealDate(startMonth + '-01')) throw new DataError('Invalid month', 'invalid');
  const category = String(f.category ?? '').trim(); if (!category) throw new DataError('Category required', 'invalid');
  const note = String(f.note ?? '').trim().slice(0, 60);
  return { amount, day, startMonth, category, note };
}
/** @param {Storage} st @param {any} fields @param {Date} [now] */
export function addRecurring(st, fields, now = new Date()) {
  const base = cleanRule(fields); const list = read(st, REC, 'array'); guard(st, now);
  const r = { id: newId(), type: 'expense', ...base, generatedMonths: [] }; list.push(r); write(st, REC, list); return r;
}
/** Edit keeps every other field (e.g. generatedMonths from the old app). @param {Storage} st @param {string} id @param {any} fields @param {Date} [now] */
export function updateRecurring(st, id, fields, now = new Date()) {
  const list = read(st, REC, 'array'); const i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Not found', 'notfound');
  const base = cleanRule({ ...list[i], ...fields }); guard(st, now); list[i] = { ...list[i], ...base }; write(st, REC, list); return list[i];
}
/** @param {Storage} st @param {string} id @param {Date} [now] */
export function removeRecurring(st, id, now = new Date()) {
  const list = read(st, REC, 'array'); const i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Not found', 'notfound');
  guard(st, now); const [gone] = list.splice(i, 1); write(st, REC, list); return { gone, index: i };
}
/** Undo for removeRecurring: put it back where it was. @param {Storage} st @param {any} rule @param {number} index */
export function restoreRecurring(st, rule, index) {
  const list = read(st, REC, 'array').filter((r) => r?.id !== rule.id); list.splice(Math.min(index, list.length), 0, rule); write(st, REC, list);
}
