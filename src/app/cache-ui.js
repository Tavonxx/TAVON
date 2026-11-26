// @ts-check
// Settings > App files (offline). The one escape hatch if the offline copy ever misbehaves: remove the saved copy of
// the app's files and reload. Your data (work days, money, settings) is NOT touched: it is not in that copy.
import { t } from './i18n.js';
import { esc } from './format.js';
import { toast } from '../ui/ui.js';

/** @param {{lang:string}} o */
export function renderCache({ lang }) {
  const on = typeof navigator !== 'undefined' && 'serviceWorker' in navigator && window.isSecureContext && location.protocol.startsWith('http');
  return `<div class="stack-lg"><p class="t-sub">${esc(t('cache.what', lang))}</p>
    <p class="t-sub muted">${esc(on ? t('cache.on', lang) : t('cache.off', lang))}</p>
    <p class="t-footnote muted">${esc(t('cache.safe', lang))}</p>
    <button class="btn btn-secondary btn-block" id="cache-reset">${esc(t('cache.reset', lang))}</button></div>`;
}
/** Remove the saved app files and the worker, then reload. */
export async function resetAppFiles() {
  try {
    const regs = await navigator.serviceWorker?.getRegistrations?.();
    await Promise.all((regs || []).map((r) => r.unregister()));
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('tavon-')).map((k) => caches.delete(k)));
  } catch { /* nothing to clear */ }
  location.reload();
}
/** @param {{lang:string}} o */
export function wireCache({ lang }) {
  document.getElementById('cache-reset')?.addEventListener('click', () => { toast(t('cache.done', lang)); setTimeout(resetAppFiles, 600); });
}
/** Register the offline worker (https only, never blocks the app). */
export function registerOffline() {
  if (!('serviceWorker' in navigator) || !(window.isSecureContext && location.protocol.startsWith('http'))) return;
  addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}); });
}
