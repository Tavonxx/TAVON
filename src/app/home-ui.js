// @ts-check
import { icon } from '../ui/icons.js';
import { toast, switchControl } from '../ui/ui.js';
import { t } from './i18n.js';
import { esc } from './format.js';
import { moveSection, setSectionShown, resetLayout } from '../data/homelayout.js';
import { DataError } from '../data/store.js';

const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));

/** Settings > Arrange Home. @param {{data:any, lang:string}} o */
export function renderHomeLayout({ data, lang }) {
  const { order, hidden } = data.layout;
  const rows = order.map((id, i) => {
    const on = !hidden.includes(id), label = t('hl.' + id, lang);
    return `<div class="row"><span class="row-main"><span class="row-title" id="hl-l-${id}">${esc(label)}</span></span>
      <button class="btn btn-ghost btn-icon row-act" data-mv="-1:${id}" aria-label="${esc(t('sc.up', lang))}: ${esc(label)}"${i === 0 ? ' disabled' : ''}>${icon('up')}</button>
      <button class="btn btn-ghost btn-icon row-act" data-mv="1:${id}" aria-label="${esc(t('sc.down', lang))}: ${esc(label)}"${i === order.length - 1 ? ' disabled' : ''}>${icon('down')}</button>
      <button class="switch" data-show="${id}" aria-labelledby="hl-l-${id}" aria-checked="${on}"></button></div>`;
  }).join('');
  return `<div class="stack-lg"><div class="list">${rows}</div><p class="t-footnote muted">${esc(t('hl.fixed', lang))}</p>
    <button class="btn btn-secondary btn-block" id="hl-reset">${esc(t('hl.reset', lang))}</button></div>`;
}
/** @param {{demo:boolean, rerender:()=>void}} c */
export function wireHomeLayout({ demo, rerender }) {
  const run = (fn) => { if (demo) { toast(t('ed.demo')); rerender(); return; } try { fn(); } catch (e) { fail(e); } rerender(); };
  document.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', () => {
    const [dir, id] = /** @type {string} */ (/** @type {HTMLElement} */ (b).dataset.mv).split(':');
    run(() => moveSection(localStorage, id, dir === '-1' ? -1 : 1));
  }));
  document.querySelectorAll('[data-show]').forEach((sw) => {
    const el = /** @type {HTMLElement} */ (sw);
    switchControl(el, (on) => run(() => setSectionShown(localStorage, el.dataset.show || '', on)));
  });
  document.getElementById('hl-reset')?.addEventListener('click', () => run(() => resetLayout(localStorage)));
}
