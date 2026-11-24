import test from 'node:test';
import assert from 'node:assert/strict';
import { setWeekday, replaceSchedule, restoreSchedule, addRecurring, updateRecurring, removeRecurring, restoreRecurring } from '../src/data/plans.js';
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i], get length() { return m.size; } }; };
const NOW = new Date(2026, 10, 24);
test('setWeekday adds, replaces, clears, and returns undo data', () => {
  const st = mem();
  setWeekday(st, 2, { place: 'Kitchen', time: '10-18', hours: 8 }, NOW);
  const { prev } = setWeekday(st, 2, { place: 'Kitchen', hours: '6' }, NOW);
  assert.equal(JSON.parse(st.getItem('tavon-shift-schedule'))[0].hours, 6);
  restoreSchedule(st, prev); assert.equal(JSON.parse(st.getItem('tavon-shift-schedule'))[0].hours, 8);
  setWeekday(st, 2, null, NOW); assert.deepEqual(JSON.parse(st.getItem('tavon-shift-schedule')), []);
});
test('setWeekday rejects bad input and writes nothing', () => {
  const st = mem();
  assert.throws(() => setWeekday(st, 9, { place: 'A', hours: 8 }, NOW));
  assert.throws(() => setWeekday(st, 1, { place: '', hours: 8 }, NOW));
  assert.throws(() => setWeekday(st, 1, { place: 'A', hours: 30 }, NOW));
  assert.equal(st.getItem('tavon-shift-schedule'), null);
});
test('damaged schedule is never overwritten', () => {
  const st = mem({ 'tavon-shift-schedule': '{bad' });
  assert.throws(() => setWeekday(st, 1, { place: 'A', hours: 8 }, NOW));
  assert.equal(st.getItem('tavon-shift-schedule'), '{bad');
});
test('replaceSchedule drops invalid rows', () => {
  const st = mem(); replaceSchedule(st, [{ weekday: 1, place: 'A', hours: 8 }, { weekday: 8, place: 'B', hours: 8 }, { weekday: 3, place: '', hours: 8 }], NOW);
  assert.equal(JSON.parse(st.getItem('tavon-shift-schedule')).length, 1);
});
test('recurring add/edit keeps old-app fields, remove+restore keeps position', () => {
  const st = mem({ 'pee-finance-recurring-v1': JSON.stringify([{ id: 'x', amount: 50, day: 1, startMonth: '2026-01', category: 'phone', note: 'Phone', generatedMonths: ['2026-10'], extra: 1 }]) });
  const r = addRecurring(st, { amount: '1200', day: 1, startMonth: '2026-12', category: 'rent', note: 'Rent' }, NOW);
  updateRecurring(st, 'x', { amount: 55 }, NOW);
  const list = JSON.parse(st.getItem('pee-finance-recurring-v1'));
  assert.deepEqual([list[0].amount, list[0].generatedMonths, list[0].extra], [55, ['2026-10'], 1]);
  const { gone, index } = removeRecurring(st, 'x', NOW); assert.equal(JSON.parse(st.getItem('pee-finance-recurring-v1')).length, 1);
  restoreRecurring(st, gone, index); assert.equal(JSON.parse(st.getItem('pee-finance-recurring-v1'))[0].id, 'x'); assert.ok(r.id);
});
test('recurring validates', () => {
  const st = mem();
  for (const bad of [{ amount: 0 }, { amount: 5, day: 32 }, { amount: 5, day: 1, startMonth: '2026-13' }, { amount: 5, day: 1, startMonth: '2026-01', category: '' }])
    assert.throws(() => addRecurring(st, { category: 'x', day: 1, startMonth: '2026-01', ...bad }, NOW));
  assert.equal(st.getItem('pee-finance-recurring-v1'), null);
});
