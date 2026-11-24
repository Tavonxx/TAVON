import { test } from 'node:test';
import assert from 'node:assert/strict';
import { saveWorkDay, restoreWorkDay, addItem, updateItem, removeItem, reinsertItem, deleteQuietly, isRealDate, readCategories, categoryLabel, DataError } from '../src/data/store.js';
import { LEGACY_KEYS, TAVON_KEYS } from '../src/data/schema.js';

function mem(init = {}, { failSet } = {}) {
  const m = new Map(Object.entries(init));
  return { m, get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => m.get(k) ?? null,
    setItem(k, v) { if (failSet?.(k)) throw new Error('quota'); m.set(k, String(v)); }, removeItem: (k) => m.delete(k) };
}
const J = (s, k) => JSON.parse(s.m.get(k));

test('real dates only', () => { assert.ok(isRealDate('2028-02-29')); assert.ok(!isRealDate('2026-02-30')); assert.ok(!isRealDate('2026-13-01')); assert.ok(!isRealDate(null)); });

test('work day: merge keeps unknown fields, rounds, undo restores exactly', () => {
  const orig = { '2026-11-23': { status: 'planned', place: 'A', time: '9-5', hours: 8, weird: { keep: 1 } } };
  const s = mem({ [LEGACY_KEYS.work]: JSON.stringify(orig) });
  const { prev } = saveWorkDay(s, '2026-11-23', { status: 'worked', tips: '12.345' });
  const now = J(s, LEGACY_KEYS.work)['2026-11-23'];
  assert.deepEqual([now.status, now.tips, now.place, now.hours, now.weird], ['worked', 12.35, 'A', 8, { keep: 1 }]);
  restoreWorkDay(s, '2026-11-23', prev); assert.deepEqual(J(s, LEGACY_KEYS.work), orig);
});
test('work day: new day can be undone back to nothing; invalid input changes nothing', () => {
  const s = mem(); const { prev } = saveWorkDay(s, '2026-11-24', { status: 'off' });
  restoreWorkDay(s, '2026-11-24', prev); assert.deepEqual(J(s, LEGACY_KEYS.work), {});
  const before = JSON.stringify([...s.m]);
  for (const bad of [{ status: 'nope' }, { hours: 25 }, { tips: -1 }, { hours: 'abc' }]) assert.throws(() => saveWorkDay(s, '2026-11-24', bad), DataError);
  assert.throws(() => saveWorkDay(s, '2026-02-31', {}), DataError);
  assert.equal(JSON.stringify([...s.m]), before);
});
test('corrupt data is NEVER overwritten', () => {
  const s = mem({ [LEGACY_KEYS.work]: '{broken', [LEGACY_KEYS.finance]: '{"not":"a list"}' });
  assert.throws(() => saveWorkDay(s, '2026-11-23', { status: 'off' }), /damaged/);
  assert.throws(() => addItem(s, { type: 'income', amount: 1, date: '2026-11-23', category: 'salary' }), /unexpected shape/);
  assert.equal(s.m.get(LEGACY_KEYS.work), '{broken'); assert.equal(s.m.get(LEGACY_KEYS.finance), '{"not":"a list"}');
  assert.ok(!s.m.has(TAVON_KEYS.snapshots));
});
test('one safety snapshot before the first edit only', () => {
  const s = mem({ [LEGACY_KEYS.finance]: '[]' });
  addItem(s, { type: 'income', amount: 5, date: '2026-11-23', category: 'salary' });
  addItem(s, { type: 'expense', amount: 2, date: '2026-11-23', category: 'food' });
  const snaps = J(s, TAVON_KEYS.snapshots); assert.equal(snaps.length, 1); assert.equal(snaps[0].reason, 'before editing');
});
test('if the safety copy or the save fails, data stays untouched and an error is raised', () => {
  const s1 = mem({ [LEGACY_KEYS.finance]: '[]' }, { failSet: (k) => k === TAVON_KEYS.snapshots });
  assert.throws(() => addItem(s1, { type: 'income', amount: 5, date: '2026-11-23', category: 'salary' }), /safety copy/);
  assert.equal(s1.m.get(LEGACY_KEYS.finance), '[]');
  const s2 = mem({ [LEGACY_KEYS.finance]: '[]' }, { failSet: (k) => k === LEGACY_KEYS.finance });
  assert.throws(() => addItem(s2, { type: 'income', amount: 5, date: '2026-11-23', category: 'salary' }), /Could not save/);
  assert.equal(s2.m.get(LEGACY_KEYS.finance), '[]');
});
test('money items: add / edit keeps extra fields / delete + undo at same position', () => {
  const s = mem({ [LEGACY_KEYS.finance]: JSON.stringify([{ id: 'r', type: 'expense', amount: 10, date: '2026-11-01', category: 'bills', recurringId: 'x' }]) });
  const a = addItem(s, { type: 'income', amount: '20.456', date: '2026-11-02', category: 'salary', note: ' hi ' });
  assert.equal(a.amount, 20.46); assert.equal(a.note, 'hi'); assert.ok(a.id);
  const { prev, next } = updateItem(s, 'r', { amount: 12.5 });
  assert.equal(next.recurringId, 'x'); assert.equal(next.amount, 12.5); assert.equal(prev.amount, 10);
  const { item, index } = removeItem(s, 'r'); assert.equal(J(s, LEGACY_KEYS.finance).length, 1);
  reinsertItem(s, item, index); assert.deepEqual(J(s, LEGACY_KEYS.finance).map((x) => x.id), ['r', a.id]);
  deleteQuietly(s, a.id); assert.deepEqual(J(s, LEGACY_KEYS.finance).map((x) => x.id), ['r']);
  assert.throws(() => updateItem(s, 'nope', { amount: 1 }), /not found/);
  for (const bad of [{ amount: 0 }, { amount: -1 }, { date: '2026-02-30' }, { category: '' }, { type: 'x' }]) assert.throws(() => addItem(s, { type: 'income', amount: 1, date: '2026-11-02', category: 'a', ...bad }), DataError);
});
test('categories: saved shape wins, damaged falls back to defaults, labels follow language', () => {
  const good = { income: [['pay', 'เงินจ้าง', 'Pay']], expense: [['x', 'เอ็กซ์', 'X']] };
  assert.deepEqual(readCategories(mem({ [LEGACY_KEYS.categories]: JSON.stringify(good) })), good);
  assert.equal(readCategories(mem({ [LEGACY_KEYS.categories]: '{bad' })).expense[0][0], 'food');
  assert.equal(categoryLabel(good, 'income', 'pay', 'th'), 'เงินจ้าง'); assert.equal(categoryLabel(good, 'income', 'pay', 'en'), 'Pay');
  assert.equal(categoryLabel(good, 'income', 'zzz', 'en'), 'Other');
});

test('every error code has Thai and English friendly text', async () => {
  const { t } = await import('../src/app/i18n.js');
  for (const c of ['damaged', 'storage', 'snapshot', 'notfound', 'invalid']) for (const l of ['th', 'en']) assert.notEqual(t('err.' + c, l), 'err.' + c);
  assert.equal(new DataError('x').code, 'invalid');
});
