// @ts-check
// Settings > Workplaces: rename a name everywhere, or merge two names into one.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { esc } from './format.js';
import { DataError } from '../data/store.js';
import { listPlaces, renamePlace, restorePlaces } from '../data/places.js';
import { normPlace } from '../data/pay.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('pl-sheet'));
  if (!d) { d = document.createElement('dialog'); d.id = 'pl-sheet'; d.className = 'sheet center'; d.setAttribute('aria-labelledby', 'pl-t'); document.body.append(d); }
  return d;
}
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));

export function renderPlaces() {
  const list = listPlaces(localStorage), L = getLang();
  const rows = list.map((p) => `<button class="row row-hit" data-place="${esc(p.name)}"><span class="row-icon accent">${icon('tag')}</span><span class="row-main"><span class="row-title">${esc(p.name)}</span><br><span class="row-sub">${esc(t('pl.count', L).replace('{d}', String(p.days)).replace('{r}', String(p.rates)))}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`).join('');
  return `<div class="stack-lg">${list.length ? `<div class="list">${rows}</div>` : `<div class="card state"><p class="t-headline">${esc(t('pl.empty', L))}</p></div>`}<p class="t-footnote muted">${esc(t('pl.note', L))}</p></div>`;
}
/** @param {{demo:boolean, rerender:()=>void}} c */
export function wirePlaces({ demo, rerender }) {
  document.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => {
    if (demo) { toast(t('ed.demo')); return; }
    const from = /** @type {HTMLElement} */ (b).dataset.place || '', d = sheet();
    d.innerHTML = `<form class="stack" novalidate><div class="between"><h2 class="t-title3" id="pl-t">${esc(from)}</h2><button type="button" class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>
      <div class="field"><label for="pl-name">${esc(t('pl.new'))}</label><input class="input" id="pl-name" maxlength="40" value="${esc(from)}" autocomplete="off"><span class="t-footnote muted" id="pl-hint" aria-live="polite"></span></div>
      <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
    const inp = /** @type {HTMLInputElement} */ (d.querySelector('#pl-name')), hint = /** @type {HTMLElement} */ (d.querySelector('#pl-hint'));
    const others = listPlaces(localStorage).filter((p) => normPlace(p.name) !== normPlace(from));
    const upd = () => { hint.textContent = others.some((p) => normPlace(p.name) === normPlace(inp.value)) ? t('pl.merge') : ''; };
    inp.addEventListener('input', upd);
    /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
      ev.preventDefault();
      try {
        const to = inp.value.trim().replace(/\s+/g, ' ');
        const { prev, changed } = renamePlace(localStorage, from, to);
        closeSheet(d); rerender();
        if (!changed.days && !changed.rules && !changed.rates) return;
        toast(t('pl.done').replace('{a}', from).replace('{b}', to), { action: t('ap.undo'), ms: 6000, onAction: () => { try { restorePlaces(localStorage, prev); rerender(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
      } catch (e) { fail(e); }
    });
    openSheet(d); setTimeout(() => { inp.focus(); inp.select(); }, 60);
  }));
}
