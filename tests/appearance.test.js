import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, DEFAULTS, load, save, resolveTheme, KEY } from '../src/ui/appearance.js';
import { ICON_NAMES, icon, spriteMarkup } from '../src/ui/icons.js';

const fakeStore = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), m }; };

test('sanitize falls back to defaults for junk and keeps valid values', () => {
  assert.deepEqual(sanitize(null), DEFAULTS);
  assert.deepEqual(sanitize('x'), DEFAULTS);
  assert.equal(sanitize({ theme: 'neon' }).theme, 'auto');
  assert.equal(sanitize({ theme: 'dark', accent: 'ocean' }).accent, 'ocean');
});
test('save/load round-trips and survives corrupt storage', () => {
  const s = fakeStore();
  save({ theme: 'dark', density: 'compact' }, s);
  assert.equal(load(s).theme, 'dark');
  s.setItem(KEY, '{broken');
  assert.deepEqual(load(s), DEFAULTS);
});
test('appearance only writes its own key', () => {
  const s = fakeStore(); save({ theme: 'light' }, s);
  assert.deepEqual([...s.m.keys()], ['tavon-appearance']);
});
test('auto follows the device, explicit choice wins', () => {
  assert.equal(resolveTheme('auto', true), 'dark');
  assert.equal(resolveTheme('auto', false), 'light');
  assert.equal(resolveTheme('light', true), 'light');
});
test('icons: sprite contains every icon, unknown name throws', () => {
  const sp = spriteMarkup();
  for (const n of ICON_NAMES) assert.ok(sp.includes(`id="i-${n}"`));
  assert.throws(() => icon('nope'));
  assert.ok(icon('home').includes('aria-hidden="true"'));
});

import { centerTop } from '../src/ui/ui.js';
test('centerTop centres in the visible area and never goes above it', () => {
  assert.equal(centerTop(0, 800, 400), 200);
  assert.equal(centerTop(0, 500, 400), 50);   // keyboard up: centred in the 500px that is visible
  assert.equal(centerTop(0, 420, 400), 12);   // too tall: stays at the top margin
  assert.equal(centerTop(60, 500, 400), 110); // page scrolled by the browser
});
