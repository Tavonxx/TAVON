// @ts-check
// Custom finance categories. Entries store the category CODE, so codes never change; only names can.
// Deleting is deliberately not offered: it would orphan old entries.
import { LEGACY_KEYS } from './schema.js';
import { readCategories, write, guard, newId, DataError } from './store.js';

const KEY = LEGACY_KEYS.categories;
/** @param {Storage} st */
function current(st) {
  const raw = st.getItem(KEY);
  if (raw !== null) { try { JSON.parse(raw); } catch { throw new DataError('Damaged', 'damaged'); } }
  return JSON.parse(JSON.stringify(readCategories(st)));
}
/** @param {any} f */
function names(f) {
  const th = String(f.th ?? '').trim(), en = String(f.en ?? '').trim() || th;
  if (!th || th.length > 24 || en.length > 24) throw new DataError('Name must be 1-24 characters', 'invalid');
  return { th, en };
}
/** @param {Storage} st @param {'income'|'expense'} type @param {{th:string,en?:string}} f @param {Date} [now] @returns {{code:string, prev:string|null}} */
export function addCategory(st, type, f, now = new Date()) {
  if (!['income', 'expense'].includes(type)) throw new DataError('Invalid type', 'invalid');
  const { th, en } = names(f), cats = current(st);
  if (cats[type].some((r) => r[1] === th || r[2].toLowerCase() === en.toLowerCase())) throw new DataError('Name already used', 'invalid');
  const prev = st.getItem(KEY); guard(st, now);
  const code = 'c-' + newId().slice(0, 8); cats[type].push([code, th, en]); write(st, KEY, cats); return { code, prev };
}
/** @param {Storage} st @param {'income'|'expense'} type @param {string} code @param {{th:string,en?:string}} f @param {Date} [now] @returns {{prev:string|null}} */
export function renameCategory(st, type, code, f, now = new Date()) {
  const { th, en } = names(f), cats = current(st), row = (cats[type] || []).find((r) => r[0] === code);
  if (!row) throw new DataError('Not found', 'notfound');
  if (cats[type].some((r) => r[0] !== code && (r[1] === th || r[2].toLowerCase() === en.toLowerCase()))) throw new DataError('Name already used', 'invalid');
  const prev = st.getItem(KEY); guard(st, now); row[1] = th; row[2] = en; write(st, KEY, cats); return { prev };
}
/** Undo: put the stored value back exactly (or remove the key if there was none). @param {Storage} st @param {string|null} prev */
export function restoreCategories(st, prev) { if (prev === null) st.removeItem(KEY); else st.setItem(KEY, prev); }
