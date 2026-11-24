import test from 'node:test';
import assert from 'node:assert/strict';
import { addRate, updateRate, removeRate, restoreRate, rateFor, periodPay, readPayRates, normPlace } from '../src/data/pay.js';
const mem = (init = {}) => { const m = new Map(Object.entries(init)); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), key: (i) => [...m.keys()][i], get length() { return m.size; } }; };
const NOW = new Date(2026, 10, 24), K = 'tavon-pay-rates';
test('add/edit/remove/restore with validation; damaged data untouched', () => {
  const st = mem(); const a = addRate(st, { place: ' Eat  BKK ', rate: '18' }, NOW);
  assert.equal(a.place, 'Eat BKK'); assert.equal(a.from, '');
  assert.throws(() => addRate(st, { place: 'eat bkk', rate: 19 }, NOW), { code: 'duprate' }); // same place + same start
  assert.throws(() => addRate(st, { place: 'X', rate: 0 }, NOW)); assert.throws(() => addRate(st, { place: 'X', rate: 5, from: '2026-02-31' }, NOW));
  updateRate(st, a.id, { rate: '18.5' }, NOW); assert.equal(readPayRates(st)[0].rate, 18.5);
  const { gone, index } = removeRate(st, a.id, NOW); assert.equal(readPayRates(st).length, 0); restoreRate(st, gone, index); assert.equal(readPayRates(st)[0].id, a.id);
  const bad = mem({ [K]: '{x' }); assert.throws(() => addRate(bad, { place: 'A', rate: 1 }, NOW), { code: 'damaged' }); assert.equal(bad.getItem(K), '{x');
});
test('rateFor: own place beats everyone-rate, newest start wins, a raise never changes old days', () => {
  const rates = [{ id: '1', place: '', rate: 18, from: '' }, { id: '2', place: 'Eat BKK', rate: 20, from: '2026-12-01' }, { id: '3', place: 'Eat BKK', rate: 19, from: '' }];
  assert.equal(rateFor(rates, 'eat bkk', '2026-11-30'), 19); assert.equal(rateFor(rates, 'EAT BKK ', '2026-12-01'), 20);
  assert.equal(rateFor(rates, 'Other', '2026-12-05'), 18); assert.equal(rateFor(rates, '', '2026-12-05'), 18);
  assert.equal(rateFor([{ id: '1', place: 'A', rate: 5, from: '2027-01-01' }], 'A', '2026-12-31'), null);
  assert.equal(normPlace('  A   b '), 'a b');
});
test('periodPay: confirmed vs planned apart, per-rate rounding, unrated hours reported not guessed', () => {
  const rates = [{ id: '1', place: 'A', rate: 18, from: '' }, { id: '2', place: 'B', rate: 20.25, from: '' }];
  const days = [{ day: '2026-11-16', status: 'worked', hours: 7.5, place: 'A' }, { day: '2026-11-17', status: 'worked', hours: 8, place: 'B' }, { day: '2026-11-18', status: 'planned', hours: 8, place: 'A' },
    { day: '2026-11-19', status: 'worked', hours: 4, place: 'Z' }, { day: '2026-11-20', status: 'off', hours: 0, place: 'A' }, { day: '2026-11-21', status: 'leave', hours: 8, place: 'A' }];
  const p = periodPay(days, rates);
  assert.equal(p.earned, 135 + 162); assert.equal(p.planned, 144); assert.equal(p.projected, 135 + 162 + 144);
  assert.deepEqual(p.unrated, { worked: 4, planned: 0 }); assert.equal(p.hasRates, true);
  assert.deepEqual(periodPay(days, []).unrated, { worked: 19.5, planned: 8 }); assert.equal(periodPay(days, []).hasRates, false);
  assert.equal(periodPay([{ day: '2026-11-16', status: 'worked', hours: 0.1, place: 'A' }, { day: '2026-11-17', status: 'worked', hours: 0.2, place: 'A' }], [{ id: '1', place: 'A', rate: 18, from: '' }]).earned, 5.4);
});
