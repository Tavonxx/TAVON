// @ts-check
// Appearance settings: stored in tavon-meta-independent key `tavon-appearance` (never touches legacy data).
export const KEY = 'tavon-appearance';
/** @type {Record<string,string>} */
export const DEFAULTS = Object.freeze({ theme: 'auto', accent: 'terracotta', fontSize: 'default', density: 'comfortable', motion: 'system' });
const ALLOWED = {
  theme: ['auto', 'light', 'dark'],
  accent: ['terracotta', 'forest', 'ocean', 'mono'],
  fontSize: ['small', 'default', 'large', 'xlarge'],
  density: ['compact', 'comfortable', 'spacious'],
  motion: ['system', 'off'],
};
/** @param {any} raw */
export function sanitize(raw) {
  /** @type {Record<string,string>} */ const out = { ...DEFAULTS };
  if (raw && typeof raw === 'object') for (const k of Object.keys(ALLOWED)) if (ALLOWED[k].includes(raw[k])) out[k] = raw[k];
  return out;
}
/** @param {Storage} [store] */
export function load(store = globalThis.localStorage) {
  try { return sanitize(JSON.parse(store.getItem(KEY) || 'null')); } catch { return { ...DEFAULTS }; }
}
/** @param {any} s @param {Storage} [store] */
export function save(s, store = globalThis.localStorage) {
  try { store.setItem(KEY, JSON.stringify(sanitize(s))); return true; } catch { return false; }
}
/** @param {string} theme @param {boolean} prefersDark */
export const resolveTheme = (theme, prefersDark) => (theme === 'auto' ? (prefersDark ? 'dark' : 'light') : theme);

/** Apply settings to <html>. Returns the resolved theme. @param {any} s @param {HTMLElement} [el] */
export function apply(s, el = document.documentElement) {
  const v = sanitize(s);
  const dark = typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = resolveTheme(v.theme, dark);
  el.dataset.theme = theme;
  el.dataset.accent = v.accent;
  el.dataset.fontSize = v.fontSize;
  el.dataset.density = v.density;
  if (v.motion === 'off') el.dataset.motion = 'off'; else delete el.dataset.motion;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#141414' : '#F4F1EA');
  return theme;
}
/** Keep "auto" in sync with the device. @param {() => any} getSettings */
export function watchSystem(getSettings) {
  if (typeof matchMedia !== 'function') return () => {};
  const mq = matchMedia('(prefers-color-scheme: dark)');
  const fn = () => { if (getSettings().theme === 'auto') apply(getSettings()); };
  mq.addEventListener('change', fn);
  return () => mq.removeEventListener('change', fn);
}
