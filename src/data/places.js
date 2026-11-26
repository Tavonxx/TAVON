// @ts-check
// Workplace names live on day records, schedule rules and pay rates (there is no separate list).
// Renaming changes that text everywhere at once, so one name never splits into two. Safety copy first, undo restores the exact old text.
import { LEGACY_KEYS, TAVON_KEYS } from './schema.js';
import { write, guard, DataError, isRealDate } from './store.js';
import { normPlace } from './pay.js';

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clean = (s) => String(s ?? '').trim().replace(/\s+/g, ' ');
const parse = (st, k) => { try { return JSON.parse(st.getItem(k) || 'null'); } catch { return null; } };

/** Every workplace name in use, with how often. @param {Storage} st @returns {{name:string, days:number, rules:number, rates:number}[]} */
export function listPlaces(st) {
  /** @type {Map<string,{name:string, days:number, rules:number, rates:number, seen:Map<string,number>}>} */ const m = new Map();
  const hit = (/** @type {any} */ p, /** @type {'days'|'rules'|'rates'} */ f) => {
    const s = clean(p); if (!s) return; const k = normPlace(s);
    const e = m.get(k) || { name: s, days: 0, rules: 0, rates: 0, seen: new Map() };
    e[f]++; e.seen.set(s, (e.seen.get(s) || 0) + 1); m.set(k, e);
  };
  const work = parse(st, LEGACY_KEYS.work); if (isObj(work)) Object.values(work).forEach((r) => isObj(r) && hit(r.place, 'days'));
  const rules = parse(st, TAVON_KEYS.shiftSchedule); if (Array.isArray(rules)) rules.forEach((r) => isObj(r) && hit(r.place, 'rules'));
  const rates = parse(st, TAVON_KEYS.payRates); if (Array.isArray(rates)) rates.forEach((r) => isObj(r) && hit(r.place, 'rates'));
  return [...m.values()].map((e) => ({ name: [...e.seen].sort((a, b) => b[1] - a[1])[0][0], days: e.days, rules: e.rules, rates: e.rates })).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name));
}

/** Rename (or merge into another existing name). Returns the exact old text of each key for undo.
 * @param {Storage} st @param {string} from @param {string} to @param {Date} [now]
 * @returns {{prev:Record<string,string|null>, changed:{days:number, rules:number, rates:number}}} */
export function renamePlace(st, from, to, now = new Date()) {
  const target = clean(to), src = normPlace(from);
  if (!target || target.length > 40 || !src) throw new DataError('Name must be 1-40 characters', 'invalid');
  const keys = [LEGACY_KEYS.work, TAVON_KEYS.shiftSchedule, TAVON_KEYS.payRates, TAVON_KEYS.placeInfo];
  for (const k of keys) { const raw = st.getItem(k); if (raw !== null) { try { JSON.parse(raw); } catch { throw new DataError('Damaged', 'damaged'); } } }
  const prev = Object.fromEntries(keys.map((k) => [k, st.getItem(k)]));
  const work = parse(st, LEGACY_KEYS.work), rules = parse(st, TAVON_KEYS.shiftSchedule), rates = parse(st, TAVON_KEYS.payRates);
  const changed = { days: 0, rules: 0, rates: 0 };
  const ren = (/** @type {any} */ r, /** @type {'days'|'rules'|'rates'} */ f) => { if (isObj(r) && typeof r.place === 'string' && normPlace(r.place) === src && r.place !== target) { r.place = target; changed[f]++; } };
  if (isObj(work)) Object.values(work).forEach((r) => ren(r, 'days'));
  if (Array.isArray(rules)) rules.forEach((r) => ren(r, 'rules'));
  if (Array.isArray(rates)) {
    rates.forEach((r) => ren(r, 'rates'));
    const seen = new Set();
    for (const r of rates) { if (!isObj(r)) continue; const k = normPlace(r.place) + '|' + String(r.from || ''); if (seen.has(k)) throw new DataError('That workplace already has a rate from this date', 'duprate'); seen.add(k); }
  }
  const info = parse(st, TAVON_KEYS.placeInfo); let infoMoved = false;
  if (isObj(info) && normPlace(from) !== normPlace(target) && info[normPlace(from)]) {
    if (!info[normPlace(target)]) info[normPlace(target)] = info[normPlace(from)]; // merging into a name that has its own dates keeps those
    delete info[normPlace(from)]; infoMoved = true;
  }
  if (!changed.days && !changed.rules && !changed.rates && !infoMoved) return { prev, changed };
  guard(st, now);
  if (infoMoved) write(st, TAVON_KEYS.placeInfo, info);
  if (changed.days) write(st, LEGACY_KEYS.work, work);
  if (changed.rules) write(st, TAVON_KEYS.shiftSchedule, rules);
  if (changed.rates) write(st, TAVON_KEYS.payRates, rates);
  return { prev, changed };
}
/** Undo: put each key's old text back exactly. @param {Storage} st @param {Record<string,string|null>} prev */
export function restorePlaces(st, prev) { for (const [k, v] of Object.entries(prev)) { if (v === null) st.removeItem(k); else st.setItem(k, v); } }

/** Start / last day at each workplace. Never throws (unreadable = none). @param {Storage} st @returns {Record<string,{start:string,end:string}>} */
export function readPlaceInfo(st) {
  const v = parse(st, TAVON_KEYS.placeInfo); const out = {};
  if (isObj(v)) for (const [k, e] of Object.entries(v)) if (isObj(e)) out[k] = { start: typeof e.start === 'string' ? e.start : '', end: typeof e.end === 'string' ? e.end : '' };
  return out;
}
/** @param {Storage} st @param {string} place @returns {{start:string,end:string}} */
export function infoFor(st, place) { return readPlaceInfo(st)[normPlace(place)] || { start: '', end: '' }; }
/** Has the person left this workplace (last day set and already past)? @param {Storage} st @param {string} place @param {string} today YYYY-MM-DD */
export function hasLeft(st, place, today) { const e = infoFor(st, place).end; return !!e && e < today; }

/** Save start / last day. Empty = not set. Undo with restorePlaces(prev). @param {Storage} st @param {string} place @param {{start?:string,end?:string}} f @param {Date} [now]
 * @returns {{prev:Record<string,string|null>}} */
export function setPlaceInfo(st, place, f, now = new Date()) {
  const key = normPlace(place), start = String(f.start ?? '').trim(), end = String(f.end ?? '').trim();
  if (!key) throw new DataError('Invalid', 'invalid');
  if ((start && !isRealDate(start)) || (end && !isRealDate(end))) throw new DataError('Invalid date', 'invalid');
  if (start && end && end < start) throw new DataError('Last day is before the first day', 'dates');
  const raw = st.getItem(TAVON_KEYS.placeInfo);
  if (raw !== null) { try { JSON.parse(raw); } catch { throw new DataError('Damaged', 'damaged'); } }
  const all = parse(st, TAVON_KEYS.placeInfo), info = isObj(all) ? all : {};
  guard(st, now);
  if (!start && !end) delete info[key]; else info[key] = { start, end };
  write(st, TAVON_KEYS.placeInfo, info);
  return { prev: { [TAVON_KEYS.placeInfo]: raw } };
}
