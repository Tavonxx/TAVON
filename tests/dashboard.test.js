import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderHome, esc } from '../src/app/dashboard.js';
import { demoData } from '../src/app/demo.js';
import { money } from '../src/app/format.js';

const NOW = new Date('2026-11-23T15:00:00Z');
const empty = { work: undefined, items: undefined, recurring: undefined, rules: undefined, lastBackup: null };

test('empty data shows the honest empty state with a preview button, not fake numbers', () => {
  const h = renderHome({ data: empty, demo: false, lang: 'th', now: NOW });
  assert.ok(h.includes('id="demo-on"')); assert.ok(!h.includes('t-number'));
});
test('sample data renders every widget and labels itself as a preview', () => {
  const h = renderHome({ data: demoData('2026-11-23'), demo: true, lang: 'en', now: NOW });
  for (const s of ['Balance this month', 'This week', 'Latest', 'Coming up', 'Preview mode', 'demo-off']) assert.ok(h.includes(s), s);
});
test('user text is escaped everywhere it is shown', () => {
  const evil = '<img src=x onerror=alert(1)>';
  const data = { ...empty, items: [{ id: 'a', type: 'expense', date: '2026-11-02', amount: 5, category: evil }], work: { '2026-11-23': { status: 'worked', hours: 1, place: evil } } };
  const h = renderHome({ data, demo: false, lang: 'en', now: NOW });
  assert.ok(!h.includes('<img')); assert.ok(h.includes('&lt;img'));
  assert.equal(esc(`"'&<>`), '&quot;&#39;&amp;&lt;&gt;');
});
test('backup card appears when never backed up or 7+ days old, hidden when recent', () => {
  const base = { ...empty, items: [{ type: 'income', date: '2026-11-01', amount: 1 }] };
  assert.ok(renderHome({ data: base, demo: false, lang: 'en', now: NOW }).includes('Time to back up'));
  const recent = { ...base, lastBackup: String(NOW.getTime() - 2 * 86400000) };
  assert.ok(!renderHome({ data: recent, demo: false, lang: 'en', now: NOW }).includes('Time to back up'));
});
test('money: Canadian dollars, signs, negatives', () => {
  assert.equal(money(1234.5), '$1,234.50'); assert.equal(money(-5), '−$5.00'); assert.equal(money(5, { sign: true }), '+$5.00'); assert.equal(money(0, { sign: true }), '$0.00');
});
