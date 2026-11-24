// Run: npm test
// All data here is made up for testing. No real personal data.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackup, importBackup, listSnapshots, restoreSnapshot, summarize } from '../src/data/backup.js';
import { suggestWeeklySchedule, shiftForDate } from '../src/data/schedule.js';
import { LEGACY_KEYS, LEGACY_WORK_VERSION, TAVON_KEYS } from '../src/data/schema.js';

class FakeStorage {
  constructor(init = {}, limit = Infinity) { this.m = new Map(Object.entries(init)); this.limit = limit; }
  get length() { return this.m.size; }
  key(i) { return [...this.m.keys()][i] ?? null; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) {
    const size = [...this.m].reduce((n, [a, b]) => n + a.length + b.length, 0) + String(v).length;
    if (size > this.limit) throw new Error('QuotaExceededError');
    this.m.set(k, String(v));
  }
  removeItem(k) { this.m.delete(k); }
  dump() { return Object.fromEntries(this.m); }
}

const work = { '2026-10-05': { status: 'worked', hours: 8, tips: 40.25, note: 'x', place: 'Shop A', time: '9 – 5' },
  '2026-10-06': { status: 'off', hours: 0, tips: 0, note: '' } };
const finance = [{ id: 'a1', type: 'income', amount: 100, date: '2026-10-01', category: 'salary', note: '' },
  { id: 'b2', type: 'expense', amount: 12.5, date: '2026-10-02', category: 'food', note: 'ข้าว', subcategoryId: '', subcategoryName: '' }];
const legacy = () => ({
  [LEGACY_KEYS.work]: JSON.stringify(work),
  [LEGACY_KEYS.workVersion]: LEGACY_WORK_VERSION,
  [LEGACY_KEYS.workplaces]: JSON.stringify({ 'Shop A': { status: 'active', startDate: '2026-01-01', endDate: '' } }),
  [LEGACY_KEYS.finance]: JSON.stringify(finance),
  [LEGACY_KEYS.categories]: JSON.stringify({ income: [['salary', 'เงินเดือน', 'Salary']], expense: [['food', 'อาหาร', 'Food', true]] }),
  [LEGACY_KEYS.recurring]: JSON.stringify([{ id: 'r1', name: 'Phone', amount: 50, day: 31, category: 'bills', startMonth: '2026-01', generatedMonths: ['2026-01'] }]),
  [LEGACY_KEYS.theme]: 'dark',
  [LEGACY_KEYS.language]: 'th',
  'bk-last': '123', // not an app data key; must be left alone
});

test('backup → import round-trip keeps every value byte-for-byte', () => {
  const src = new FakeStorage(legacy());
  const parsed = parseBackup(createBackup(src));
  assert.equal(parsed.ok, true);
  const dst = new FakeStorage();
  importBackup(dst, parsed);
  for (const [k, v] of Object.entries(legacy())) if (k !== 'bk-last') assert.equal(dst.getItem(k), v, k);
});

test('accepts the old PP Space 2.0 "Export backup" text', () => {
  const oldText = JSON.stringify(Object.fromEntries(Object.entries(legacy()).filter(([k]) => k.startsWith('pee-'))));
  const parsed = parseBackup(oldText);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.source, 'pp-space-2');
  assert.deepEqual(parsed.summary, { keys: 8, workDays: 2, workplaces: 1, transactions: 2, recurringRules: 1 });
});

test('old backup without version marker still gets the marker, so the old app never re-seeds', () => {
  const noVersion = { ...legacy() }; delete noVersion[LEGACY_KEYS.workVersion]; delete noVersion['bk-last'];
  const dst = new FakeStorage();
  importBackup(dst, parseBackup(JSON.stringify(noVersion)));
  assert.equal(dst.getItem(LEGACY_KEYS.workVersion), LEGACY_WORK_VERSION);
  assert.equal(dst.getItem(LEGACY_KEYS.work), JSON.stringify(work));
});

test('rejects garbage and backups with broken JSON values; nothing changes', () => {
  assert.equal(parseBackup('hello').ok, false);
  assert.equal(parseBackup('{"other":1}').ok, false);
  const bad = parseBackup(JSON.stringify({ [LEGACY_KEYS.finance]: '[{broken' }));
  assert.equal(bad.ok, false);
  const dst = new FakeStorage(legacy());
  assert.throws(() => importBackup(dst, bad));
  assert.deepEqual(dst.dump(), legacy());
});

test('questionable records are reported but never dropped', () => {
  const odd = [...finance, { id: 'c3', type: 'expense', amount: 0, date: '2026-10-03' }, { id: 'a1', type: 'income', amount: 5, date: '2026-10-04' }];
  const parsed = parseBackup(JSON.stringify({ [LEGACY_KEYS.finance]: JSON.stringify(odd) }));
  assert.equal(parsed.ok, true);
  assert.ok(parsed.warnings.some((w) => w.includes('would be hidden')));
  assert.ok(parsed.warnings.some((w) => w.includes('duplicate id a1')));
  assert.equal(parsed.summary.transactions, 4);
});

test('import takes a snapshot first and restore brings old data back (undo)', () => {
  const st = new FakeStorage(legacy());
  const other = { [LEGACY_KEYS.finance]: JSON.stringify([finance[0]]) };
  const res = importBackup(st, parseBackup(JSON.stringify(other)));
  assert.equal(res.before.transactions, 2);
  assert.equal(res.after.transactions, 1);
  assert.equal(st.getItem(LEGACY_KEYS.work), null); // replace, not merge
  restoreSnapshot(st, res.snapshotId);
  for (const [k, v] of Object.entries(legacy())) assert.equal(st.getItem(k), v, k);
  assert.ok(listSnapshots(st).length >= 2); // the undo of the restore is kept too
});

test('importing the same backup twice creates no duplicates', () => {
  const st = new FakeStorage();
  const parsed = parseBackup(createBackup(new FakeStorage(legacy())));
  importBackup(st, parsed); importBackup(st, parsed);
  assert.equal(JSON.parse(st.getItem(LEGACY_KEYS.finance)).length, 2);
});

test('if storage fills up, nothing is changed', () => {
  const st = new FakeStorage(legacy(), 1500);
  assert.throws(() => importBackup(st, parseBackup(createBackup(new FakeStorage(legacy())))));
  assert.deepEqual(st.dump(), legacy());
});

test('snapshots never end up inside backups and only 3 are kept', () => {
  const st = new FakeStorage(legacy());
  const parsed = parseBackup(createBackup(st));
  for (let i = 0; i < 5; i++) importBackup(st, parsed, new Date(2026, 0, i + 1));
  assert.equal(listSnapshots(st).length, 3);
  assert.equal(TAVON_KEYS.snapshots in JSON.parse(createBackup(st)).data, false);
});

test('weekly schedule is suggested from records, not from code', () => {
  const recs = {};
  const today = new Date(2026, 10, 23);
  for (let i = 1; i <= 56; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (d.getDay() === 1) recs[key] = { status: 'worked', place: 'Shop A', time: '11 – 9', hours: 10 };
    else if (d.getDay() === 3 && i < 20) recs[key] = { status: 'worked', place: 'Shop B', time: '11 – 9', hours: 10 }; // only 3 of 8 weeks
    else recs[key] = { status: 'off', hours: 0 };
  }
  const rules = suggestWeeklySchedule(recs, { today });
  assert.deepEqual(rules.map((r) => [r.weekday, r.place, r.hours]), [[1, 'Shop A', 10]]);
  assert.equal(shiftForDate(rules, new Date(2026, 10, 30)).place, 'Shop A');
  assert.equal(shiftForDate(rules, new Date(2026, 10, 29)), null);
});

test('summary handles empty storage', () => {
  assert.deepEqual(summarize({}), { keys: 0, workDays: 0, workplaces: 0, transactions: 0, recurringRules: 0 });
});
