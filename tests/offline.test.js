import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const files = JSON.parse(sw.match(/const FILES = (\[[\s\S]*?\n\]);/)[1].replace(/,(\s*\])/, '$1'));
const walk = (d) => readdirSync(join(root, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));

test('every app file is in the offline list (add new files to FILES in sw.js)', () => {
  const need = [...walk('src'), 'index.html', 'manifest.webmanifest'];
  for (const f of need) assert.ok(files.includes(f), `${f} is missing from FILES in sw.js`);
});
test('every file in the offline list exists', () => {
  for (const f of files) if (f !== './') assert.doesNotThrow(() => readFileSync(join(root, f)), f);
});
test('the worker only handles same-origin GETs and never touches storage', () => {
  assert.match(sw, /req\.method !== 'GET'/); assert.match(sw, /origin !== self\.location\.origin/);
  assert.doesNotMatch(sw, /localStorage|indexedDB/);
});
test('fonts and icons used by the page are cached too', () => {
  const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8') + readFileSync(join(root, 'src/styles/base.css'), 'utf8');
  for (const m of css.matchAll(/url\(['"]?\.\.\/\.\.\/(assets\/[^'")]+)/g)) assert.ok(files.includes(m[1]), m[1]);
});
