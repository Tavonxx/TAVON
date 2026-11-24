import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute } from '../src/app/router.js';
import { t, KEYS, getLang, setLang } from '../src/app/i18n.js';

test('router: tabs, sub-pages, empty hash and unknown routes', () => {
  assert.equal(parseRoute('').name, 'home');
  assert.equal(parseRoute('#/').name, 'home');
  assert.equal(parseRoute('#/money').tab, 'money');
  const s = parseRoute('#/settings/appearance');
  assert.deepEqual([s.name, s.tab, s.parent], ['settings/appearance', 'settings', 'settings']);
  assert.equal(parseRoute('#/settings/nope').known, false);
  assert.equal(parseRoute('#/hack/../x').known, false);
  assert.equal(parseRoute('#/work?x=1').name, 'work');
});
test('i18n: every key has Thai and English text, unknown key returns the key', () => {
  for (const k of KEYS) { assert.ok(t(k, 'th').length > 0, k); assert.ok(t(k, 'en').length > 0, k); }
  assert.equal(t('nope'), 'nope');
});
test('i18n: language defaults to Thai, survives broken storage, only writes tavon-lang', () => {
  const m = new Map(); const st = { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) };
  assert.equal(getLang(st), 'th');
  setLang('en', st); assert.equal(getLang(st), 'en');
  setLang('xx', st); assert.equal(getLang(st), 'th');
  assert.deepEqual([...m.keys()], ['tavon-lang']);
  assert.equal(getLang({ getItem() { throw new Error('blocked'); } }), 'th');
});
