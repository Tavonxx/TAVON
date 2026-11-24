import { test } from 'node:test';
import assert from 'node:assert/strict';
import { todayKey, weekStartKey, addDays, monthSummary, recentItems, dueDate, upcomingRecurring, dayInfo, weekSummary, backupAgeDays, readDashboardData, hasData, nextMonth } from '../src/data/stats.js';

const rules = [{ weekday: 1, place: 'Cafe A', time: '9-5', hours: 8 }, { weekday: 5, place: 'Cafe A', time: '9-5', hours: 8 }];

test('todayKey uses Toronto time, not the phone clock', () => {
  assert.equal(todayKey(new Date('2026-03-10T03:30:00Z')), '2026-03-09'); // still evening in Toronto
  assert.equal(todayKey(new Date('2026-07-01T12:00:00Z')), '2026-07-01');
});
test('weeks start on Monday', () => {
  assert.equal(weekStartKey('2026-11-23'), '2026-11-23'); // Monday
  assert.equal(weekStartKey('2026-11-29'), '2026-11-23'); // Sunday belongs to the week before
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
test('month balance = carried over + income - expense, in cents (no 0.1+0.2 drift)', () => {
  const items = [
    { type: 'income', date: '2026-09-30', amount: 100.1 }, { type: 'expense', date: '2026-10-05', amount: 0.2 },
    { type: 'income', date: '2026-11-02', amount: 50.1 }, { type: 'expense', date: '2026-11-03', amount: 20.2 },
    { type: 'expense', date: '2026-12-01', amount: 999 }, { type: 'income', date: 'bad', amount: 5 }, { type: 'income', date: '2026-11-04', amount: -3 },
  ];
  assert.deepEqual(monthSummary(items, '2026-11'), { opening: 99.9, income: 50.1, expense: 20.2, balance: 129.8 });
  assert.deepEqual(monthSummary(null, '2026-11'), { opening: 0, income: 0, expense: 0, balance: 0 });
});
test('recent items: newest first, invalid ones ignored, limited', () => {
  const r = recentItems([{ type: 'income', date: '2026-11-01', amount: 1, id: 'a' }, { type: 'expense', date: '2026-11-09', amount: 2, id: 'b' }, { type: 'x', date: '2026-11-10', amount: 2 }], 5);
  assert.deepEqual(r.map((x) => x.id), ['b', 'a']);
});
test('due date clamps to the last day of short months', () => {
  assert.equal(dueDate('2027-02', 31), '2027-02-28'); assert.equal(dueDate('2028-02', 31), '2028-02-29'); assert.equal(dueDate('2026-11', 15), '2026-11-15');
  assert.equal(nextMonth('2026-12'), '2027-01');
});
test('upcoming recurring: window, already-generated months, start month, month rollover', () => {
  const r = [{ id: 'rent', amount: 1200, day: 1, startMonth: '2026-01', category: 'Rent' }, { id: 'phone', amount: 50, day: 25, startMonth: '2026-01', generatedMonths: ['2026-11'] }, { id: 'late', amount: 9, day: 28, startMonth: '2027-01' }];
  const u = upcomingRecurring(r, '2026-11-26', 14);
  assert.deepEqual(u.map((x) => [x.id, x.due, x.daysLeft]), [['rent', '2026-12-01', 5]]);
  assert.deepEqual(upcomingRecurring('nope', '2026-11-26'), []);
});
test('dayInfo: saved record wins, schedule fills the rest, planned without a shift becomes off', () => {
  assert.equal(dayInfo({}, rules, '2026-11-23').status, 'planned'); // Monday rule
  assert.equal(dayInfo({}, rules, '2026-11-24').status, 'off');
  assert.equal(dayInfo({ '2026-11-24': { status: 'planned' } }, rules, '2026-11-24').status, 'off');
  const w = dayInfo({ '2026-11-23': { status: 'worked', hours: 9.5, tips: 40 } }, rules, '2026-11-23');
  assert.deepEqual([w.status, w.hours, w.tips, w.place], ['worked', 9.5, 40, 'Cafe A']);
  assert.equal(dayInfo(null, null, '2026-11-23').status, 'off');
});
test('week summary: worked vs planned hours, tips summed, never touches money', () => {
  const work = { '2026-11-23': { status: 'worked', hours: 9.5, tips: 40.25 }, '2026-11-27': { status: 'planned' } };
  const s = weekSummary(work, rules, '2026-11-25');
  assert.deepEqual([s.start, s.workedHours, s.plannedHours, s.workedDays, s.plannedDays, s.tips], ['2026-11-23', 9.5, 8, 1, 1, 40.25]);
});
test('backup age: old app stores milliseconds; also accepts ISO; unknown = null', () => {
  const now = new Date('2026-11-23T12:00:00Z');
  assert.equal(backupAgeDays(String(now.getTime() - 3 * 86400000), now), 3);
  assert.equal(backupAgeDays('2026-11-20T12:00:00Z', now), 3);
  assert.equal(backupAgeDays('0', now), null); assert.equal(backupAgeDays(null, now), null); assert.equal(backupAgeDays('abc', now), null);
});
test('readDashboardData only reads; empty storage = no data', () => {
  const writes = []; const st = { getItem: () => null, setItem: (...a) => writes.push(a), removeItem: (...a) => writes.push(a) };
  const d = readDashboardData(st); assert.equal(hasData(d), false); assert.deepEqual(writes, []);
  const m = new Map([['pee-finance-v1', JSON.stringify([{ type: 'income', date: '2026-11-01', amount: 5 }])], ['pee-work-tracker', '{broken']]);
  const d2 = readDashboardData({ getItem: (k) => m.get(k) ?? null }); assert.equal(hasData(d2), true); assert.equal(d2.work, undefined);
});
