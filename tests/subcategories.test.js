import test from 'node:test';
import assert from 'node:assert/strict';
import { readSubs, subsFor, addSub, removeSub, restoreSubs, lastSubId } from '../src/data/subcategories.js';
import { addItem } from '../src/data/store.js';

function fake(init = {}) { const m = { ...init }; return { get length() { return Object.keys(m).length; }, key: (i) => Object.keys(m)[i], getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; }

test('add keeps lists separate per category and type', () => {
  const st = fake();
  addSub(st, 'expense', 'transport', 'TTC'); addSub(st, 'expense', 'food', 'Loblaw'); addSub(st, 'income', 'tips', 'TTC');
  assert.deepEqual(subsFor(st, 'expense', 'transport').map((x) => x.name), ['TTC']);
  assert.deepEqual(subsFor(st, 'expense', 'food').map((x) => x.name), ['Loblaw']);
  assert.equal(subsFor(st, 'income', 'tips').length, 1);
});
test('same name (any case) is reused, not duplicated', () => {
  const st = fake(); const a = addSub(st, 'expense', 'food', 'Loblaw'); const b = addSub(st, 'expense', 'food', ' loblaw ');
  assert.equal(b.existed, true); assert.equal(b.sub.id, a.sub.id); assert.equal(subsFor(st, 'expense', 'food').length, 1);
});
test('old-app data is read as is and extra fields survive', () => {
  const st = fake({ 'pee-finance-subcategories-v1': JSON.stringify({ 'expense:transport': [{ id: 't', name: 'TTC', amount: 3.3 }] }) });
  addSub(st, 'expense', 'transport', 'Uber');
  assert.equal(subsFor(st, 'expense', 'transport')[0].amount, 3.3);
  assert.equal(subsFor(st, 'expense', 'transport').length, 2);
});
test('remove + undo restores exactly', () => {
  const st = fake(); const { sub } = addSub(st, 'expense', 'food', 'T&T'); const before = st.getItem('pee-finance-subcategories-v1');
  const { prev } = removeSub(st, 'expense', 'food', sub.id); assert.equal(subsFor(st, 'expense', 'food').length, 0);
  restoreSubs(st, prev); assert.equal(st.getItem('pee-finance-subcategories-v1'), before);
});
test('bad names and damaged data are refused, never overwritten', () => {
  const st = fake({ 'pee-finance-subcategories-v1': '{oops' });
  assert.throws(() => addSub(st, 'expense', 'food', 'X'));
  assert.equal(st.getItem('pee-finance-subcategories-v1'), '{oops');
  assert.deepEqual(readSubs(st), {});
  assert.throws(() => addSub(fake(), 'expense', 'food', '  '));
});
test('entry saves its sub-category; last used is found per category', () => {
  const st = fake(); const a = addSub(st, 'expense', 'food', 'A').sub, b = addSub(st, 'expense', 'food', 'B').sub;
  addItem(st, { type: 'expense', amount: 5, date: '2026-11-01', category: 'food', subcategoryId: a.id, subcategoryName: 'A' });
  addItem(st, { type: 'expense', amount: 6, date: '2026-11-02', category: 'food', subcategoryId: b.id, subcategoryName: 'B' });
  const items = JSON.parse(st.getItem('pee-finance-v1'));
  assert.equal(items[1].subcategoryName, 'B');
  assert.equal(lastSubId(items, 'expense', 'food', [a, b]), b.id);
  assert.equal(lastSubId(items, 'expense', 'transport', [a, b]), '');
});
