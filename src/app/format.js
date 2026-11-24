// @ts-check
// Formatting helpers. Money is Canadian dollars (the old app's rule); dates follow the chosen language.
/** @param {number} n @param {{sign?:boolean}} [o] */
export function money(n, o = {}) {
  const v = Number(n) || 0;
  const s = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', currencyDisplay: 'narrowSymbol' }).format(Math.abs(v));
  if (o.sign && v !== 0) return (v > 0 ? '+' : '−') + s;
  return v < 0 ? '−' + s : s;
}
/** Hours like 10.5 -> "10.5", 8 -> "8". @param {number} h */
export const hours = (h) => String(Math.round((Number(h) || 0) * 100) / 100);
/** "จันทร์ 23 พ.ย." / "Mon, Nov 23" (Gregorian year, never the Buddhist one). @param {string} key @param {string} lang */
export function dayLabel(key, lang) {
  const [y, m, d] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'th-TH-u-ca-gregory', { weekday: lang === 'en' ? 'short' : 'long', day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d, 12));
}
/** @param {string} key @param {string} lang */
export const weekdayShort = (key, lang) => { const [y, m, d] = key.split('-').map(Number); return new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'th-TH-u-ca-gregory', { weekday: lang === 'en' ? 'narrow' : 'narrow' }).format(new Date(y, m - 1, d, 12)); };
/** @param {string} month YYYY-MM @param {string} lang */
export function monthLabel(month, lang) { const [y, m] = month.split('-').map(Number); return new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'th-TH-u-ca-gregory', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1, 12)); }
/** "23 พ.ย." / "Nov 23". @param {string} key @param {string} lang */
export function shortDate(key, lang) { const [y, m, d] = key.split('-').map(Number); return new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'th-TH-u-ca-gregory', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d, 12)); }
/** HTML-escape any text before it goes into markup. @param {any} s */
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
