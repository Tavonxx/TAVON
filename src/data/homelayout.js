// @ts-check
// Which Home sections are shown and in what order. Stored in tavon-home-layout. The Today card, the
// "confirm days" card and the backup reminder are not part of this: they always show when they apply.
import { TAVON_KEYS } from './schema.js';
import { write, guard } from './store.js';

export const SECTIONS = Object.freeze(['shortcuts', 'balance', 'week', 'more']);
const KEY = TAVON_KEYS.homeLayout;

/** Always returns every known section exactly once. Unknown names are dropped, missing ones go last.
 * Never throws: unreadable data = the default layout. @param {Storage} st @returns {{order:string[], hidden:string[]}} */
export function readLayout(st) {
  let raw = null;
  try { raw = JSON.parse(st.getItem(KEY) || 'null'); } catch { raw = null; }
  const o = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const seen = (Array.isArray(o.order) ? o.order : []).filter((x, i, a) => SECTIONS.includes(x) && a.indexOf(x) === i);
  const order = [...seen, ...SECTIONS.filter((x) => !seen.includes(x))];
  const hidden = (Array.isArray(o.hidden) ? o.hidden : []).filter((x, i, a) => SECTIONS.includes(x) && a.indexOf(x) === i);
  return { order, hidden };
}
/** @param {Storage} st @param {{order:string[], hidden:string[]}} v */
function save(st, v) { guard(st, new Date()); write(st, KEY, v); }

/** @param {Storage} st @param {string} id @param {boolean} show */
export function setSectionShown(st, id, show) {
  if (!SECTIONS.includes(id)) return;
  const v = readLayout(st); v.hidden = show ? v.hidden.filter((x) => x !== id) : [...v.hidden.filter((x) => x !== id), id]; save(st, v);
}
/** @param {Storage} st @param {string} id @param {-1|1} dir */
export function moveSection(st, id, dir) {
  const v = readLayout(st), i = v.order.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= v.order.length) return;
  [v.order[i], v.order[j]] = [v.order[j], v.order[i]]; save(st, v);
}
/** Back to the default layout. @param {Storage} st */
export function resetLayout(st) { save(st, { order: [...SECTIONS], hidden: [] }); }
/** Save a whole new order (after dragging). Unknown/missing ids are fixed the same way as on read. @param {Storage} st @param {string[]} order */
export function setOrder(st, order) {
  const v = readLayout(st); const seen = order.filter((x, i, a) => SECTIONS.includes(x) && a.indexOf(x) === i);
  const next = [...seen, ...SECTIONS.filter((x) => !seen.includes(x))];
  if (next.join() === v.order.join()) return;
  v.order = next; save(st, v);
}
