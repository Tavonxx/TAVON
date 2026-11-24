// @ts-check
// The person's one-tap entries ("TTC $3.30 x2", "Vape $25"). Stored in tavon-shortcuts, edited only through here.
import { TAVON_KEYS } from './schema.js';
import { read, write, guard, newId, addItems, DataError } from './store.js';

const KEY = TAVON_KEYS.shortcuts;
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/** Valid shortcuts only, in the person's order. Never throws: unreadable data = empty list. @param {Storage} st */
export function readShortcuts(st) {
  try {
    const v = JSON.parse(st.getItem(KEY) || '[]');
    return (Array.isArray(v) ? v : []).filter((r) => isObj(r) && typeof r.id === 'string' && typeof r.label === 'string' && ['income', 'expense'].includes(r.type) && typeof r.category === 'string')
      .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
  } catch { return []; }
}
/** @param {any} f */
function clean(f) {
  const label = String(f.label ?? '').trim(); if (!label || label.length > 24) throw new DataError('Name must be 1-24 characters', 'invalid');
  if (!['income', 'expense'].includes(f.type)) throw new DataError('Invalid type', 'invalid');
  const category = String(f.category ?? '').trim(); if (!category) throw new DataError('Category required', 'invalid');
  let amount = null;
  if (f.amount !== null && f.amount !== undefined && String(f.amount).trim() !== '') { amount = Math.round(Number(String(f.amount).replace(',', '.')) * 100) / 100; if (!(amount > 0) || amount > 1e6) throw new DataError('Invalid amount', 'invalid'); }
  const count = Number(f.count ?? 1); if (!Number.isInteger(count) || count < 1 || count > 5) throw new DataError('Count must be 1-5', 'invalid');
  return { label, type: f.type, category, amount, count };
}
/** @param {Storage} st */
const load = (st) => read(st, KEY, 'array');

/** @param {Storage} st @param {any} fields @param {Date} [now] */
export function addShortcut(st, fields, now = new Date()) {
  const base = clean(fields); const list = load(st); guard(st, now);
  const sc = { id: newId(), ...base, sort: list.reduce((m, r) => Math.max(m, Number(r?.sort) || 0), 0) + 1 };
  list.push(sc); write(st, KEY, list); return sc;
}
/** @param {Storage} st @param {string} id @param {any} fields @param {Date} [now] */
export function updateShortcut(st, id, fields, now = new Date()) {
  const list = load(st); const i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Shortcut not found', 'notfound');
  const base = clean({ ...list[i], ...fields }); guard(st, now);
  list[i] = { ...list[i], ...base }; write(st, KEY, list); return list[i];
}
/** @param {Storage} st @param {string} id @param {Date} [now] */
export function removeShortcut(st, id, now = new Date()) {
  const list = load(st); const i = list.findIndex((r) => r?.id === id); if (i < 0) throw new DataError('Shortcut not found', 'notfound');
  guard(st, now); const [gone] = list.splice(i, 1); write(st, KEY, list); return { gone, index: i };
}
/** Put a removed shortcut back (undo). @param {Storage} st @param {any} sc */
export function restoreShortcut(st, sc) { const list = load(st).filter((r) => r?.id !== sc.id); list.push(sc); write(st, KEY, list); }
/** Move up (-1) or down (+1) in the person's order. @param {Storage} st @param {string} id @param {-1|1} dir */
export function moveShortcut(st, id, dir) {
  const sorted = readShortcuts(st); const i = sorted.findIndex((r) => r.id === id); const j = i + dir;
  if (i < 0 || j < 0 || j >= sorted.length) return;
  const raw = load(st); guard(st, new Date());
  [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
  sorted.forEach((r, k) => { const x = raw.find((q) => q?.id === r.id); if (x) x.sort = k + 1; });
  write(st, KEY, raw);
}
/** Record a shortcut as real entries (one write). Optionally remember the new price. 
 * @param {Storage} st @param {any} sc @param {{amount:number|string, count:number, date:string, rememberPrice?:boolean}} o @param {Date} [now]
 * @returns {{added:any[]}} */
export function useShortcut(st, sc, o, now = new Date()) {
  const count = Number(o.count); if (!Number.isInteger(count) || count < 1 || count > 5) throw new DataError('Count must be 1-5', 'invalid');
  const added = addItems(st, Array.from({ length: count }, () => ({ type: sc.type, amount: o.amount, date: o.date, category: sc.category, note: sc.label })), now);
  if (o.rememberPrice && Number(o.amount) > 0 && Number(o.amount) !== sc.amount) { try { updateShortcut(st, sc.id, { amount: o.amount }, now); } catch { /* entries are saved; the old price simply stays */ } }
  return { added };
}
