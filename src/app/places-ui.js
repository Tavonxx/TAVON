// @ts-check
// Settings > Workplaces: one page per workplace: name, first / last day, and its pay rates. Each workplace stays separate;
// renaming to a name that already exists merges them.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { esc, money, shortDate } from './format.js';
import { DataError } from '../data/store.js';
import { listPlaces, renamePlace, restorePlaces, setPlaceInfo, infoFor, hasLeft } from '../data/places.js';
import { readPayRates, normPlace } from '../data/pay.js';
import { readDashboardData, todayKey } from '../data/stats.js';
import { openRateEditor } from './pay-ui.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('pl-sheet'));
  if (!d) { d = document.createElement('dialog'); d.id = 'pl-sheet'; d.className = 'sheet center'; d.setAttribute('aria-labelledby', 'pl-t'); document.body.append(d); }
  return d;
}
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));

export function renderPlaces() {
  const list = listPlaces(localStorage), L = getLang(), today = todayKey();
  const rows = list.map((p) => `<button class="row row-hit" data-place="${esc(p.name)}"><span class="row-icon accent">${icon('tag')}</span><span class="row-main"><span class="row-title">${esc(p.name)}</span><br><span class="row-sub">${esc(t('pl.count', L).replace('{d}', String(p.days)).replace('{r}', String(p.rates)))}${hasLeft(localStorage, p.name, today) ? ' · ' + esc(t('pl.left', L)) : ''}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`).join('');
  return `<div class="stack-lg">${list.length ? `<div class="list">${rows}</div>` : `<div class="card state"><p class="t-headline">${esc(t('pl.empty', L))}</p></div>`}<p class="t-footnote muted">${esc(t('pl.note', L))}</p></div>`;
}

/** @param {string} from @param {boolean} demo @param {()=>void} rerender */
function openPlace(from, demo, rerender) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), info = infoFor(localStorage, from), key = normPlace(from);
  const rates = readPayRates(localStorage).filter((r) => normPlace(r.place) === key).sort((a, b) => String(b.from || '').localeCompare(String(a.from || '')));
  const rateRows = rates.map((r) => `<button type="button" class="row row-hit" data-rate="${esc(r.id)}"><span class="row-icon accent">${icon('money')}</span><span class="row-main"><span class="row-title">${esc(money(Number(r.rate)))}${esc(t('pay.perhour', L))}</span><br><span class="row-sub">${esc(r.from ? t('pay.since', L) + ' ' + shortDate(r.from, L) : t('pay.start', L))}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`).join('');
  d.innerHTML = `<form class="stack" novalidate><div class="between"><h2 class="t-title3" id="pl-t">${esc(from)}</h2><button type="button" class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>
    <div class="field"><label for="pl-name">${esc(t('pl.rename'))}</label><input class="input" id="pl-name" maxlength="40" value="${esc(from)}" autocomplete="off"><span class="t-footnote muted" id="pl-hint" aria-live="polite"></span></div>
    <div class="ed-row"><div class="field"><label for="pl-start">${esc(t('pl.start'))}</label><input class="input" id="pl-start" type="date" value="${esc(info.start)}"></div>
    <div class="field"><label for="pl-end">${esc(t('pl.end'))}</label><input class="input" id="pl-end" type="date" value="${esc(info.end)}"></div></div>
    <span class="t-footnote muted">${esc(t('pl.end.hint', L))}</span>
    <div class="field"><span class="label">${esc(t('pl.rates', L))}</span>${rates.length ? `<div class="list">${rateRows}</div>` : `<p class="t-footnote muted">${esc(t('pl.rates.none', L))}</p>`}
      <button type="button" class="btn btn-tonal btn-block" id="pl-addrate">${icon('plus', 'i-sm')}${esc(t('pl.rates.add', L))}</button></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  const inp = /** @type {HTMLInputElement} */ (d.querySelector('#pl-name')), hint = /** @type {HTMLElement} */ (d.querySelector('#pl-hint'));
  const others = listPlaces(localStorage).filter((p) => normPlace(p.name) !== key);
  inp.addEventListener('input', () => { hint.textContent = others.some((p) => normPlace(p.name) === normPlace(inp.value)) ? t('pl.merge') : ''; });
  const reopen = () => { rerender(); openPlace(from, false, rerender); };
  const toRate = (r) => {
    const v = (id) => /** @type {HTMLInputElement} */ (d.querySelector('#' + id)).value;
    try { if (v('pl-start') !== info.start || v('pl-end') !== info.end) setPlaceInfo(localStorage, from, { start: v('pl-start'), end: v('pl-end') }); } catch (e) { fail(e); return; } // keep what was typed
    closeSheet(d); setTimeout(() => openRateEditor(r, readDashboardData(localStorage), false, reopen, from), 220); };
  d.querySelector('#pl-addrate')?.addEventListener('click', () => toRate(null));
  d.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => toRate(rates.find((r) => r.id === /** @type {HTMLElement} */ (b).dataset.rate) || null)));
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      const to = inp.value.trim().replace(/\s+/g, ' '), val = (id) => /** @type {HTMLInputElement} */ (d.querySelector('#' + id)).value;
      const prevAll = {};
      const a = setPlaceInfo(localStorage, from, { start: val('pl-start'), end: val('pl-end') }); Object.assign(prevAll, a.prev);
      let renamed = false;
      if (normPlace(to) !== key || to !== from) { const r = renamePlace(localStorage, from, to); for (const [k, v] of Object.entries(r.prev)) if (!(k in prevAll)) prevAll[k] = v; renamed = r.changed.days + r.changed.rules + r.changed.rates > 0; }
      closeSheet(d); rerender();
      toast(renamed ? t('pl.done').replace('{a}', from).replace('{b}', to) : t('ed.saved'), { action: t('ap.undo'), ms: 6000, onAction: () => { try { restorePlaces(localStorage, prevAll); rerender(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
}
/** @param {{demo:boolean, rerender:()=>void}} c */
export function wirePlaces({ demo, rerender }) {
  document.querySelectorAll('[data-place]').forEach((b) => b.addEventListener('click', () => openPlace(/** @type {HTMLElement} */ (b).dataset.place || '', demo, rerender)));
}
