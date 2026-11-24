import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readLayout, setSectionShown, moveSection, resetLayout, setOrder, SECTIONS } from '../src/data/homelayout.js';
import { TAVON_KEYS, validators } from '../src/data/schema.js';

const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } }; };
const K = TAVON_KEYS.homeLayout;

test('default layout shows every section in the default order', () => {
  assert.deepEqual(readLayout(mem()), { order: [...SECTIONS], hidden: [] });
});
test('hiding, showing and moving are saved and never lose a section', () => {
  const s = mem();
  setSectionShown(s, 'balance', false); moveSection(s, 'week', -1); moveSection(s, 'shortcuts', -1); // first item cannot go up
  let v = readLayout(s);
  assert.deepEqual(v.hidden, ['balance']); assert.deepEqual(v.order, ['shortcuts', 'week', 'balance', 'more']);
  setSectionShown(s, 'balance', true); assert.deepEqual(readLayout(s).hidden, []);
  assert.equal(new Set(readLayout(s).order).size, SECTIONS.length);
  resetLayout(s); assert.deepEqual(readLayout(s), { order: [...SECTIONS], hidden: [] });
});
test('odd stored data is cleaned on read, never throws', () => {
  assert.deepEqual(readLayout(mem({ [K]: '{broken' })), { order: [...SECTIONS], hidden: [] });
  const v = readLayout(mem({ [K]: JSON.stringify({ order: ['week', 'nope', 'week'], hidden: ['zzz', 'more'] }) }));
  assert.deepEqual(v.order, ['week', 'shortcuts', 'balance', 'more']); assert.deepEqual(v.hidden, ['more']);
});
test('damaged layout is not overwritten', () => {
  const s = mem({ [K]: '{broken' });
  assert.doesNotThrow(() => readLayout(s));
  assert.equal(s.getItem(K), '{broken'); // reading leaves it alone
});
test('validator accepts the shape and rejects others', () => {
  assert.deepEqual(validators[K]({ order: [], hidden: [] }), []);
  assert.ok(validators[K]([]).length);
});
test('setOrder saves a dragged order and repairs bad input', () => {
  const s = mem(); setOrder(s, ['more', 'week', 'balance', 'shortcuts']); assert.deepEqual(readLayout(s).order, ['more', 'week', 'balance', 'shortcuts']);
  setOrder(s, ['balance', 'x', 'balance']); assert.deepEqual(readLayout(s).order, ['balance', 'shortcuts', 'week', 'more']);
});
