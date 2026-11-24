import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readShortcuts, addShortcut, updateShortcut, removeShortcut, restoreShortcut, moveShortcut, useShortcut } from '../src/data/shortcuts.js';
import { deleteMany, DataError } from '../src/data/store.js';
import { LEGACY_KEYS, TAVON_KEYS, validators } from '../src/data/schema.js';

function mem(init = {}) { const m = new Map(Object.entries(init)); return { m, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const J = (s, k) => JSON.parse(s.m.get(k));
const ttc = { label: 'TTC', type: 'expense', category: 'transport', amount: '3.30', count: 2 };

test('add: validated, ordered, schema accepts it', () => {
  const s = mem(); const a = addShortcut(s, ttc); const b = addShortcut(s, { label: 'Vape', type: 'expense', category: 'other-expense', amount: '', count: 1 });
  assert.deepEqual([a.amount, a.count, b.amount], [3.3, 2, null]);
  assert.deepEqual(readShortcuts(s).map((x) => x.label), ['TTC', 'Vape']);
  assert.deepEqual(validators[TAVON_KEYS.shortcuts](J(s, TAVON_KEYS.shortcuts)), []);
  for (const bad of [{ label: '' }, { label: 'x'.repeat(25) }, { type: 'x' }, { category: '' }, { amount: '-1' }, { amount: 'abc' }, { count: 0 }, { count: 6 }, { count: 1.5 }]) assert.throws(() => addShortcut(s, { ...ttc, ...bad }), DataError);
  assert.equal(readShortcuts(s).length, 2);
});
test('update, move, remove + restore', () => {
  const s = mem(); const a = addShortcut(s, ttc); const b = addShortcut(s, { ...ttc, label: 'Vape', amount: 25, count: 1 });
  updateShortcut(s, a.id, { amount: 3.5 }); assert.equal(readShortcuts(s)[0].amount, 3.5);
  moveShortcut(s, b.id, -1); assert.deepEqual(readShortcuts(s).map((x) => x.label), ['Vape', 'TTC']);
  moveShortcut(s, b.id, -1); assert.deepEqual(readShortcuts(s).map((x) => x.label), ['Vape', 'TTC']); // already first: no change
  const { gone } = removeShortcut(s, a.id); assert.equal(readShortcuts(s).length, 1);
  restoreShortcut(s, gone); assert.equal(readShortcuts(s).length, 2);
  assert.throws(() => updateShortcut(s, 'nope', {}), /not found/);
});
test('using a shortcut writes N plain entries in one go, with the label as note and the old item shape', () => {
  const s = mem({ [LEGACY_KEYS.finance]: '[]' }); const sc = addShortcut(s, ttc);
  const { added } = useShortcut(s, sc, { amount: '3.30', count: 2, date: '2026-11-24' });
  const items = J(s, LEGACY_KEYS.finance); assert.equal(items.length, 2);
  assert.deepEqual(Object.keys(items[0]).sort(), ['amount', 'category', 'date', 'id', 'note', 'subcategoryId', 'subcategoryName', 'type', 'updatedAt']);
  assert.deepEqual([items[0].note, items[0].amount, items[0].category], ['TTC', 3.3, 'transport']);
  deleteMany(s, added.map((x) => x.id)); assert.equal(J(s, LEGACY_KEYS.finance).length, 0); // undo removes both
});
test('price change can be remembered; a bad entry saves nothing', () => {
  const s = mem({ [LEGACY_KEYS.finance]: '[]' }); const sc = addShortcut(s, ttc);
  useShortcut(s, sc, { amount: '3.45', count: 1, date: '2026-11-24', rememberPrice: true }); assert.equal(readShortcuts(s)[0].amount, 3.45);
  const before = s.m.get(LEGACY_KEYS.finance);
  assert.throws(() => useShortcut(s, sc, { amount: '0', count: 2, date: '2026-11-24' }), DataError);
  assert.throws(() => useShortcut(s, sc, { amount: '3', count: 2, date: '2026-02-31' }), DataError);
  assert.equal(s.m.get(LEGACY_KEYS.finance), before);
});
test('damaged shortcuts are never overwritten; reading never throws', () => {
  const s = mem({ [TAVON_KEYS.shortcuts]: '{broken' });
  assert.deepEqual(readShortcuts(s), []);
  assert.throws(() => addShortcut(s, ttc), /damaged/); assert.equal(s.m.get(TAVON_KEYS.shortcuts), '{broken');
});
