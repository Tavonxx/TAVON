// Checks every colour pair in tokens.css against WCAG 2.2 AA, for both themes and every accent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

const parseVars = (block) => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+)(?:;|$)/g)].map((m) => [m[1], m[2].trim()]));
const light = {};
for (const m of css.matchAll(/(?:^|[}/])\s*:root\s*\{([^}]*)\}/g)) Object.assign(light, parseVars(m[1]));
const dark = { ...light, ...parseVars(css.match(/html\[data-theme="dark"\]\s*\{([^}]*)\}/)[1]) };
const rest = { ...dark, ...parseVars(css.match(/html\[data-rest="on"\]\s*\{([^}]*)\}/)[1]) };
const accents = Object.fromEntries([...css.matchAll(/html\[data-accent="(\w+)"\]\s*\{([^}]*)\}/g)].map((m) => [m[1], parseVars(m[2])]));

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const blend = (fg, pct, bg) => fg.map((c, i) => Math.round(c * pct + bg[i] * (1 - pct)));
const mixPct = (v) => Number(v.match(/(\d+)%/)[1]) / 100;

function resolve(theme, name, accent) {
  const v = { ...theme, ...(accent || {}) };
  let val = v[name];
  if (val === undefined) throw new Error('missing ' + name);
  const ref = val.match(/^var\((--[\w-]+)\)$/);
  if (ref) val = v[ref[1]];
  return val;
}
const col = (theme, name, accent) => hex(resolve(theme, name, accent));

for (const [themeName, theme] of [['light', light], ['dark', dark], ['rest', rest]]) {
  const bgs = ['--bg', '--surface', '--surface-2'];
  const accentSet = themeName === 'light' ? Object.entries(accents).map(([n, a]) => [n, { '--acc-light': a['--acc-light'] }]) : Object.entries(accents).map(([n, a]) => [n, { '--acc-dark': a['--acc-dark'] }]);

  test(`${themeName}: body text levels are readable (>=4.5) on every background`, () => {
    for (const t of ['--text', '--text-2', '--text-3']) for (const b of bgs)
      assert.ok(ratio(col(theme, t), col(theme, b)) >= 4.5, `${t} on ${b}`);
  });

  test(`${themeName}: status colours readable as text, also on their own tint`, () => {
    for (const s of ['success', 'danger', 'warning', 'info']) for (const b of bgs) {
      assert.ok(ratio(col(theme, `--${s}`), col(theme, b)) >= 4.5, `${s} on ${b}`);
      const tint = blend(col(theme, `--${s}`), mixPct(theme[`--${s}-soft`]), col(theme, b));
      assert.ok(ratio(col(theme, `--${s}`), tint) >= 4.5, `${s} on ${s}-soft over ${b}`);
    }
  });

  test(`${themeName}: input borders and chart colours are visible (>=3)`, () => {
    for (const b of bgs) assert.ok(ratio(col(theme, '--line-strong'), col(theme, b)) >= 3, `line-strong on ${b}`);
    for (let i = 1; i <= 6; i++) assert.ok(ratio(col(theme, `--chart-${i}`), col(theme, '--surface')) >= 3, `chart-${i}`);
  });

  test(`${themeName}: inverse (toast) text is readable`, () => {
    assert.ok(ratio(col(theme, '--inverse-text'), col(theme, '--inverse-bg')) >= 4.5);
  });

  for (const [name, a] of accentSet) {
    test(`${themeName}/${name}: accent works as button fill, as text, and on its tint`, () => {
      const acc = col(theme, '--accent', a);
      assert.ok(ratio(col(theme, '--on-accent'), acc) >= 4.5, 'on-accent on accent');
      for (const b of bgs) {
        assert.ok(ratio(acc, col(theme, b)) >= 4.5, `accent text on ${b}`);
        const tint = blend(acc, mixPct(theme['--accent-soft']), col(theme, b));
        assert.ok(ratio(acc, tint) >= 4.5, `accent on accent-soft over ${b}`);
      }
    });
  }
}

test('all four accents are defined with both a light and a dark value', () => {
  assert.deepEqual(Object.keys(accents).sort(), ['forest', 'mono', 'ocean', 'terracotta']);
  for (const a of Object.values(accents)) assert.ok(a['--acc-light'] && a['--acc-dark']);
});

test('touch target token is at least 44px and body line-height suits Thai (>=1.5)', () => {
  assert.equal(light['--tap'], '2.75rem');
  assert.ok(Number(light['--lh-body']) >= 1.5);
});
