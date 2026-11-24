// @ts-check
// Hash router: pure parsing (testable) + which tab a route belongs to.
export const TABS = ['home', 'work', 'money', 'settings'];
export const SETTINGS_PAGES = ['appearance', 'language', 'shortcuts'];

/** @param {string} hash e.g. "#/settings/appearance"
 * @returns {{name:string, tab:string, parent:string|null, known:boolean}} */
export function parseRoute(hash) {
  const parts = String(hash || '').replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home', tab: 'home', parent: null, known: true };
  const [a, b] = parts;
  if (parts.length === 1 && TABS.includes(a)) return { name: a, tab: a, parent: null, known: true };
  if (a === 'settings' && parts.length === 2 && SETTINGS_PAGES.includes(b)) return { name: `settings/${b}`, tab: 'settings', parent: 'settings', known: true };
  return { name: 'notfound', tab: 'home', parent: null, known: false };
}
