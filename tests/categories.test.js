import test from 'node:test';
import assert from 'node:assert/strict';
import { addCategory, renameCategory, restoreCategories } from '../src/data/categories.js';
import { categoryShare } from '../src/data/stats.js';
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i], get length() { return m.size; } }; };
const K = 'pee-finance-categories-v1', NOW = new Date(2026, 10, 24);
test('add starts from defaults, undo removes the key again', () => {
  const st = mem(); const { code, prev } = addCategory(st, 'expense', { th: 'บุหรี่ไฟฟ้า', en: 'Vape' }, NOW);
  const c = JSON.parse(st.getItem(K)); assert.equal(c.expense.at(-1)[0], code); assert.equal(c.expense.length, 6);
  restoreCategories(st, prev); assert.equal(st.getItem(K), null);
});
test('rename keeps the code, rejects duplicates and bad names', () => {
  const st = mem(); renameCategory(st, 'expense', 'food', { th: 'กิน', en: 'Eating' }, NOW);
  assert.deepEqual(JSON.parse(st.getItem(K)).expense[0], ['food', 'กิน', 'Eating']);
  assert.throws(() => renameCategory(st, 'expense', 'food', { th: 'เดินทาง' }, NOW));
  assert.throws(() => addCategory(st, 'expense', { th: '' }, NOW));
  assert.throws(() => renameCategory(st, 'expense', 'nope', { th: 'x' }, NOW), { code: 'notfound' });
});
test('damaged categories are never overwritten', () => {
  const st = mem({ [K]: '{bad' }); assert.throws(() => addCategory(st, 'expense', { th: 'x' }, NOW), { code: 'damaged' }); assert.equal(st.getItem(K), '{bad');
});
test('categoryShare: percentages, grouping, ignores other months/types', () => {
  const it = (c, a, d = '2026-11-02', type = 'expense') => ({ id: c + a + d, type, amount: a, date: d, category: c });
  const items = [it('a', 50), it('b', 30), it('c', 20), it('x', 99, '2026-10-02'), it('s', 99, '2026-11-02', 'income')];
  const r = categoryShare(items, '2026-11'); assert.equal(r.total, 100); assert.deepEqual(r.rows.map((x) => x.pct), [50, 30, 20]);
  const g = categoryShare([it('a', 10), it('b', 9), it('c', 8), it('d', 7), it('e', 6), it('f', 5), it('g', 4)], '2026-11', 'expense', 5);
  assert.equal(g.rows.length, 6); assert.equal(g.rows[5].category, ''); assert.equal(g.rows[5].amount, 9);
  assert.deepEqual(categoryShare([], '2026-11'), { total: 0, rows: [] });
});
