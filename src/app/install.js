// @ts-check
// The "add to Home Screen" tip. iPhone has no install button, so this card explains the three taps. It shows only in
// iPhone/iPad Safari, only when the app is not already opened from the Home Screen icon, and never again once closed.
import { TAVON_KEYS } from '../data/schema.js';
import { t } from './i18n.js';
import { esc } from './format.js';
import { icon } from '../ui/icons.js';

/** @param {{standalone:boolean, ios:boolean, dismissed:boolean}} e */
export function installHintVisible(e) { return e.ios && !e.standalone && !e.dismissed; }

/** Reads the real browser. False anywhere that is not a browser (tests). */
export function installHintNow() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = /** @type {any} */ (navigator).standalone === true || !!window.matchMedia?.('(display-mode: standalone)').matches;
  let dismissed = false; try { dismissed = !!localStorage.getItem(TAVON_KEYS.installHint); } catch { /* private mode */ }
  return installHintVisible({ ios, standalone, dismissed });
}
export function dismissInstallHint() { try { localStorage.setItem(TAVON_KEYS.installHint, '1'); } catch { /* ignore */ } }

/** @param {string} L */
export function installCard(L) {
  return `<div class="card-flat stack" id="install-card"><div class="between"><div class="row-main"><p class="t-headline">${esc(t('ins.title', L))}</p><p class="t-sub muted">${esc(t('ins.sub', L))}</p></div><span class="row-icon">${icon('phone')}</span></div>
    <ol class="steps t-sub"><li>${esc(t('ins.s1', L))}</li><li>${esc(t('ins.s2', L))}</li><li>${esc(t('ins.s3', L))}</li></ol>
    <p class="t-footnote muted">${esc(t('ins.warn', L))} <a href="#/settings/data">${esc(t('ins.backup', L))}</a></p>
    <button class="btn btn-ghost btn-block" id="install-dismiss">${esc(t('ins.close', L))}</button></div>`;
}
