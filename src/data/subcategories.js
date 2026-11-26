// @ts-check
// Sub-categories inside each money category (e.g. Transport > TTC). Same shape as the old app:
// { "expense:transport": [{ id, name, amount? }] }. Entries keep their own copy of the name,
// so removing a sub-category from the list never changes old entries.
import { LEGACY_KEYS } from './schema.js';
import { write, guard, newId, DataError } from './store.js';

const KEY = LEGACY_KEYS.subcategories;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Whole map; a missing or damaged value reads as empty (nothing is written by reading). @param {Storage} st */
export function readSubs(st) {
  try { const v = JSON.parse(st.getItem(KEY) || 'null'); return isObj(v) ? v : {}; } catch { return {}; }
}
/** @param {Storage} st @param {string} type @param {string} cat @returns {{id:string,name:string,amount?:number}[]} */
export function subsFor(st, type, cat) {
  const l = readSubs(st)[`${type}:${cat}`];
  return Array.isArray(l) ? l.filter((x) => isObj(x) && x.id && typeof x.name === 'string') : [];
}
/** Add (or find, if the name exists already). @param {Storage} st @param {string} type @param {string} cat @param {string} name @param {Date} [now]
 * @returns {{sub:any, prev:string|null, existed:boolean}} */
export function addSub(st, type, cat, name, now = new Date()) {
  const nm = String(name || '').trim();
  if (!nm || nm.length > 30 || !['income', 'expense'].includes(type) || !cat) throw new DataError('Name must be 1-30 characters', 'invalid');
  const raw = st.getItem(KEY);
  if (raw !== null) { try { JSON.parse(raw); } catch { throw new DataError('Damaged', 'damaged'); } }
  const map = JSON.parse(JSON.stringify(readSubs(st))), k = `${type}:${cat}`;
  const list = Array.isArray(map[k]) ? map[k] : [];
  const hit = list.find((x) => String(x.name).toLowerCase() === nm.toLowerCase());
  if (hit) return { sub: hit, prev: raw, existed: true };
  guard(st, now);
  const sub = { id: newId(), name: nm }; list.push(sub); map[k] = list; write(st, KEY, map);
  return { sub, prev: raw, existed: false };
}
/** @param {Storage} st @param {string} type @param {string} cat @param {string} id @param {Date} [now] @returns {{prev:string|null}} */
export function removeSub(st, type, cat, id, now = new Date()) {
  const prev = st.getItem(KEY), map = JSON.parse(JSON.stringify(readSubs(st))), k = `${type}:${cat}`;
  if (!Array.isArray(map[k]) || !map[k].some((x) => x.id === id)) throw new DataError('Not found', 'notfound');
  guard(st, now); map[k] = map[k].filter((x) => x.id !== id); write(st, KEY, map);
  return { prev };
}
/** Undo: put the stored value back exactly. @param {Storage} st @param {string|null} prev */
export function restoreSubs(st, prev) { if (prev === null) st.removeItem(KEY); else st.setItem(KEY, prev); }

/** The sub-category used most recently in this category (so the same one is pre-picked next time).
 * @param {any[]} items @param {string} type @param {string} cat @param {{id:string}[]} valid */
export function lastSubId(items, type, cat, valid) {
  let best = null;
  for (const x of items || []) {
    if (!x || x.type !== type || x.category !== cat || !x.subcategoryId || !valid.some((s) => s.id === x.subcategoryId)) continue;
    const key = `${x.date}|${x.updatedAt || ''}`;
    if (!best || key > best.key) best = { key, id: x.subcategoryId };
  }
  return best ? best.id : '';
}
