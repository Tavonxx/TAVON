// @ts-check
// Hourly pay per workplace (tavon-pay-rates). Gross, before tax, and only an estimate: no overtime, holiday or other special pay.
// A rate belongs to a workplace NAME (the same text as the day's place) and applies from a date, so a raise never changes old periods.
// place '' = every workplace that has no rate of its own. from '' = since the beginning.
import { TAVON_KEYS } from './schema.js';
import { read, write, guard, newId, isRealDate, DataError } from './store.js';

const KEY = TAVON_KEYS.payRates;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
/** Same workplace if the text matches ignoring case and extra spaces. @param {any} s */
export const normPlace = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

/** Valid rates only, never throws (unreadable = none). @param {Storage} st */
export function readPayRates(st) {
  try {
    const v = JSON.parse(st.getItem(KEY) || '[]');
    return (Array.isArray(v) ? v : []).filter((r) => isObj(r) && typeof r.id === 'string' && typeof r.place === 'string' && Number(r.rate) > 0);
  } catch { return []; }
}
/** @param {any} f */
function clean(f) {
  const place = String(f.place ?? '').trim().replace(/\s+/g, ' ');
  if (place.length > 40) throw new DataError('Name too long', 'invalid');
  const rate = Math.round(Number(String(f.rate ?? '').replace(',', '.')) * 100) / 100;
  if (!(rate > 0) || rate > 1000) throw new DataError('Invalid rate', 'invalid');
  const from = String(f.from ?? '').trim();
  if (from && !isRealDate(from)) throw new DataError('Invalid date', 'invalid');
  return { place, rate, from };
}
/** @param {any[]} list @param {{place:string,from:string}} c @param {string} [exceptId] */
function dup(list, c, exceptId) { return list.some((r) => r?.id !== exceptId && normPlace(r.place) === normPlace(c.place) && String(r.from || '') === c.from); }

/** @param {Storage} st @param {any} fields @param {Date} [now] */
export function addRate(st, fields, now = new Date()) {
  const c = clean(fields), list = read(st, KEY, 'array');
  if (dup(list, c)) throw new DataError('That workplace already has a rate from this date', 'duprate');
  guard(st, now); const r = { id: newId(), ...c }; list.push(r); write(st, KEY, list); return r;
}
/** @param {Storage} st @param {string} id @param {any} fields @param {Date} [now] */
export function updateRate(st, id, fields, now = new Date()) {
  const list = read(st, KEY, 'array'), i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Not found', 'notfound');
  const c = clean({ ...list[i], ...fields }); if (dup(list, c, id)) throw new DataError('That workplace already has a rate from this date', 'duprate');
  guard(st, now); list[i] = { ...list[i], ...c }; write(st, KEY, list); return list[i];
}
/** @param {Storage} st @param {string} id @param {Date} [now] */
export function removeRate(st, id, now = new Date()) {
  const list = read(st, KEY, 'array'), i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Not found', 'notfound');
  guard(st, now); const [gone] = list.splice(i, 1); write(st, KEY, list); return { gone, index: i };
}
/** @param {Storage} st @param {any} rate @param {number} index */
export function restoreRate(st, rate, index) { const list = read(st, KEY, 'array').filter((r) => r?.id !== rate.id); list.splice(Math.min(index, list.length), 0, rate); write(st, KEY, list); }

/** The rate in force for a workplace on a day: its own newest rate that started on/before the day, else the "every workplace" one. Null if none.
 * @param {any[]} rates @param {string} place @param {string} day */
export function rateFor(rates, place, day) {
  const pick = (/** @type {(r:any)=>boolean} */ match) => (rates || []).filter((r) => match(r) && (!r.from || r.from <= day)).sort((a, b) => String(b.from || '').localeCompare(String(a.from || '')))[0];
  const own = normPlace(place) ? pick((r) => normPlace(r.place) === normPlace(place)) : null;
  const r = own || pick((r) => normPlace(r.place) === '');
  return r ? Number(r.rate) : null;
}
/** Gross pay for a list of day infos (from periodSummary). worked = confirmed days, planned = still only planned.
 * Hours are grouped by rate and rounded to the cent once per group, like "hours x rate". Hours with no rate are reported, never guessed.
 * @param {Array<{day:string,status:string,hours:number,place:string}>} days @param {any[]} rates */
export function periodPay(days, rates) {
  /** @type {Map<number,{w:number,p:number}>} */ const by = new Map(); let unW = 0, unP = 0;
  for (const d of days) {
    const kind = d.status === 'worked' ? 'w' : d.status === 'planned' ? 'p' : '';
    if (!kind || !(d.hours > 0)) continue;
    const h = Math.round(d.hours * 100), r = rateFor(rates, d.place, d.day);
    if (r === null) { if (kind === 'w') unW += h; else unP += h; continue; }
    const k = Math.round(r * 100), g = by.get(k) || { w: 0, p: 0 }; g[kind] += h; by.set(k, g);
  }
  let w = 0, p = 0;
  for (const [rc, g] of by) { w += Math.round((g.w * rc) / 100); p += Math.round((g.p * rc) / 100); }
  return { hasRates: (rates || []).length > 0, earned: w / 100, planned: p / 100, projected: (w + p) / 100, unrated: { worked: unW / 100, planned: unP / 100 } };
}
