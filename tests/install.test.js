import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installHintVisible, installHintNow } from '../src/app/install.js';
import { isBackupKey, TAVON_KEYS } from '../src/data/schema.js';
import { readFileSync } from 'node:fs';

test('install tip shows only on iPhone/iPad Safari, not from the icon, not after closing', () => {
  assert.equal(installHintVisible({ ios: true, standalone: false, dismissed: false }), true);
  assert.equal(installHintVisible({ ios: false, standalone: false, dismissed: false }), false);
  assert.equal(installHintVisible({ ios: true, standalone: true, dismissed: false }), false);
  assert.equal(installHintVisible({ ios: true, standalone: false, dismissed: true }), false);
});
test('install tip is off outside a browser, and its flag stays out of backups', () => {
  assert.equal(installHintNow(), false);
  assert.equal(isBackupKey(TAVON_KEYS.installHint), false);
});
test('manifest is valid and points at real icon files', () => {
  const m = JSON.parse(readFileSync(new URL('../manifest.webmanifest', import.meta.url), 'utf8'));
  assert.equal(m.display, 'standalone'); assert.equal(m.start_url, './'); assert.equal(m.scope, './');
  for (const i of m.icons) assert.doesNotThrow(() => readFileSync(new URL('../' + i.src, import.meta.url)), i.src);
  assert.ok(m.icons.some((i) => i.purpose === 'maskable'));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /rel="manifest" href="manifest.webmanifest"/); assert.match(html, /apple-mobile-web-app-capable/);
});
