// @ts-check
// Safe edits to the person's data. Every write in the app goes through here.
// Rules (lessons from the old app's overwrite bug):
//  1. Never write over data that cannot be read: if a key is corrupt we refuse and change nothing.
//  2. Take one safety snapshot before the first edit of a session; if that fails, stop.
//  3. Verify what was written by reading it back.
//  4. Every edit returns what is needed to undo it.
import { LEGACY_KEYS } from './schema.js';
import { takeSnapshot } from './backup.js';

export class DataError extends Error {
  /** @param {string} message @param {string} [code] key used to show a friendly translated message */
  constructor(message, code = 'invalid') { super(message); this.code = code; }
}
const WORK_STATUSES = ['worked', 'planned', 'off', 'leave', 'swapped'];
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const round2 = (n) => Math.round(Number(n) * 100) / 100;

/** True only for real calendar dates like 2026-02-28 (not 2026-02-31). @param {any} s */
export function isRealDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}
export const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** @param {Storage} st @param {string} key @param {'object'|'array'} kind */
function read(st, key, kind) {
  const raw = st.getItem(key);
  if (raw === null) return kind === 'array' ? [] : {};
  let v; try { v = JSON.parse(raw); } catch { throw new DataError(`${key} is damaged, nothing was changed`, 'damaged'); }
  if (kind === 'array' ? !Array.isArray(v) : !isObj(v)) throw new DataError(`${key} has an unexpected shape, nothing was changed`, 'damaged');
  return v;
}
/** @param {Storage} st @param {string} key @param {any} value */
function write(st, key, value) {
  const s = JSON.stringify(value);
  try { st.setItem(key, s); } catch { throw new DataError('Could not save (storage full or blocked)', 'storage'); }
  if (st.getItem(key) !== s) throw new DataError('Save could not be verified', 'storage');
}
const snapped = new WeakSet();
/** One snapshot per session before the first edit. @param {Storage} st @param {Date} now */
function guard(st, now) {
  if (snapped.has(st)) return;
  try { takeSnapshot(st, 'before editing', now); } catch { throw new DataError('Could not make a safety copy first, so nothing was changed', 'snapshot'); }
  snapped.add(st);
}

/* ---------- work days ---------- */
/** Merge a patch into one day. Unknown fields on the record are kept.
 * @param {Storage} st @param {string} day @param {{status?:string,hours?:number|string,tips?:number|string,note?:string,place?:string}} patch @param {Date} [now]
 * @returns {{prev: any}} */
export function saveWorkDay(st, day, patch, now = new Date()) {
  if (!isRealDate(day)) throw new DataError('Invalid date');
  /** @type {Record<string, any>} */ const clean = {};
  if (patch.status !== undefined) { if (!WORK_STATUSES.includes(patch.status)) throw new DataError('Invalid status'); clean.status = patch.status; }
  for (const [f, max] of /** @type {const} */ ([['hours', 24], ['tips', 1e6]])) {
    if (patch[f] === undefined || patch[f] === '') continue;
    const n = Number(patch[f]); if (!Number.isFinite(n) || n < 0 || n > max) throw new DataError(`Invalid ${f}`);
    clean[f] = round2(n);
  }
  if (patch.note !== undefined) clean.note = String(patch.note).trim().slice(0, 500);
  if (patch.place !== undefined) clean.place = String(patch.place).trim().slice(0, 80);
  const work = read(st, LEGACY_KEYS.work, 'object');
  const prev = work[day];
  guard(st, now);
  work[day] = { ...(isObj(prev) ? prev : {}), ...clean };
  write(st, LEGACY_KEYS.work, work);
  return { prev };
}
/** Undo: put the day back exactly as it was. @param {Storage} st @param {string} day @param {any} prev */
export function restoreWorkDay(st, day, prev) {
  const work = read(st, LEGACY_KEYS.work, 'object');
  if (prev === undefined) delete work[day]; else work[day] = prev;
  write(st, LEGACY_KEYS.work, work);
}

/* ---------- money items ---------- */
/** @param {any} f @returns {Record<string, any>} */
function cleanItem(f) {
  if (!['income', 'expense'].includes(f.type)) throw new DataError('Invalid type');
  const amount = round2(f.amount); if (!(amount > 0) || amount > 1e9) throw new DataError('Invalid amount');
  if (!isRealDate(f.date)) throw new DataError('Invalid date');
  const category = String(f.category || '').trim(); if (!category) throw new DataError('Category required');
  return { type: f.type, amount, date: f.date, category, note: String(f.note || '').trim().slice(0, 500), subcategoryId: f.subcategoryId || '', subcategoryName: f.subcategoryName || '' };
}
/** @param {Storage} st @param {any} fields @param {Date} [now] */
export function addItem(st, fields, now = new Date()) {
  const base = cleanItem(fields);
  const items = read(st, LEGACY_KEYS.finance, 'array');
  guard(st, now);
  const item = { id: newId(), ...base, updatedAt: now.toISOString() };
  items.push(item); write(st, LEGACY_KEYS.finance, items);
  return item;
}
/** Edit keeps every other field (e.g. recurringId). @param {Storage} st @param {string} id @param {any} fields @param {Date} [now] */
export function updateItem(st, id, fields, now = new Date()) {
  const items = read(st, LEGACY_KEYS.finance, 'array');
  const i = items.findIndex((x) => isObj(x) && x.id === id); if (i < 0) throw new DataError('Item not found', 'notfound');
  const prev = items[i]; const base = cleanItem({ ...prev, ...fields });
  guard(st, now);
  items[i] = { ...prev, ...base, updatedAt: now.toISOString() }; write(st, LEGACY_KEYS.finance, items);
  return { prev, next: items[i], index: i };
}
/** @param {Storage} st @param {string} id @param {Date} [now] */
export function removeItem(st, id, now = new Date()) {
  const items = read(st, LEGACY_KEYS.finance, 'array');
  const i = items.findIndex((x) => isObj(x) && x.id === id); if (i < 0) throw new DataError('Item not found', 'notfound');
  guard(st, now);
  const [item] = items.splice(i, 1); write(st, LEGACY_KEYS.finance, items);
  return { item, index: i };
}
/** Undo delete / undo edit / undo add. @param {Storage} st @param {any} item @param {number} [index] */
export function reinsertItem(st, item, index) {
  const items = read(st, LEGACY_KEYS.finance, 'array').filter((x) => !(isObj(x) && x.id === item.id));
  items.splice(Math.min(index ?? items.length, items.length), 0, item); write(st, LEGACY_KEYS.finance, items);
}
/** Undo an add. @param {Storage} st @param {string} id */
export function deleteQuietly(st, id) {
  const items = read(st, LEGACY_KEYS.finance, 'array');
  write(st, LEGACY_KEYS.finance, items.filter((x) => !(isObj(x) && x.id === id)));
}

/* ---------- categories (same shape as the old app: [code, thai, english]) ---------- */
export const DEFAULT_CATEGORIES = Object.freeze({
  income: [['salary', 'เงินเดือน', 'Salary'], ['tips', 'ทิป', 'Tips'], ['other-income', 'รายรับอื่น', 'Other income']],
  expense: [['food', 'อาหาร', 'Food'], ['transport', 'เดินทาง', 'Transport'], ['shopping', 'ช้อปปิ้ง', 'Shopping'], ['bills', 'บิล', 'Bills'], ['other-expense', 'รายจ่ายอื่น', 'Other expense']],
});
/** @param {Storage} st */
export function readCategories(st) {
  try {
    const v = JSON.parse(st.getItem(LEGACY_KEYS.categories) || 'null');
    const ok = isObj(v) && ['income', 'expense'].every((t) => Array.isArray(v[t]) && v[t].every((r) => Array.isArray(r) && r.slice(0, 3).every((x) => typeof x === 'string')));
    if (ok) return v;
  } catch { /* fall through to defaults */ }
  return /** @type {any} */ (DEFAULT_CATEGORIES);
}
/** @param {any} cats @param {string} type @param {string} code @param {string} lang */
export function categoryLabel(cats, type, code, lang) {
  const row = (cats?.[type] || []).find((r) => r[0] === code);
  return row ? (lang === 'en' ? row[2] : row[1]) : (lang === 'en' ? 'Other' : 'อื่น ๆ');
}
