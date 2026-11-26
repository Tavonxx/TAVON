import test from 'node:test';
import assert from 'node:assert/strict';
import { listPlaces, renamePlace, restorePlaces } from '../src/data/places.js';
function fake(init = {}) { const m = { ...init }; return { get length() { return Object.keys(m).length; }, key: (i) => Object.keys(m)[i], getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; }
const base = () => fake({
  'pee-work-tracker': JSON.stringify({ '2026-11-01': { status: 'worked', hours: 8, place: 'EAT BKK', note: 'x' }, '2026-11-02': { status: 'worked', hours: 8, place: 'eat  bkk' }, '2026-11-03': { status: 'off' } }),
  'tavon-shift-schedule': JSON.stringify([{ weekday: 1, place: 'EAT BKK Steeles', hours: 10 }]),
  'tavon-pay-rates': JSON.stringify([{ id: 'a', place: 'EAT BKK', rate: 17.5, from: '' }]),
});
test('lists each workplace once, ignoring case and spacing', () => {
  const l = listPlaces(base()); assert.equal(l.length, 2); assert.equal(l.find((x) => x.name === 'EAT BKK').days, 2);
});
test('rename changes days, rules and rates; other fields stay', () => {
  const st = base(); const r = renamePlace(st, 'EAT BKK', 'EAT BKK Steeles');
  assert.deepEqual(r.changed, { days: 2, rules: 0, rates: 1 });
  const w = JSON.parse(st.getItem('pee-work-tracker')); assert.equal(w['2026-11-01'].place, 'EAT BKK Steeles'); assert.equal(w['2026-11-01'].note, 'x'); assert.equal(w['2026-11-03'].place, undefined);
  assert.equal(listPlaces(st).length, 1);
});
test('undo restores the exact old text', () => {
  const st = base(); const before = st.getItem('pee-work-tracker'); const { prev } = renamePlace(st, 'EAT BKK', 'Other');
  restorePlaces(st, prev); assert.equal(st.getItem('pee-work-tracker'), before);
});
test('merge that would make two rates from the same date is refused, nothing changed', () => {
  const st = fake({ 'pee-work-tracker': JSON.stringify({ '2026-11-01': { place: 'A' } }), 'tavon-pay-rates': JSON.stringify([{ id: '1', place: 'A', rate: 1, from: '' }, { id: '2', place: 'B', rate: 2, from: '' }]) });
  const w = st.getItem('pee-work-tracker'); assert.throws(() => renamePlace(st, 'A', 'B'), (e) => e.code === 'duprate'); assert.equal(st.getItem('pee-work-tracker'), w);
});
test('empty or too long names refused', () => { assert.throws(() => renamePlace(base(), 'EAT BKK', ' ')); assert.throws(() => renamePlace(base(), 'EAT BKK', 'x'.repeat(41))); });
