// @ts-check
// Settings > Pay rates: hourly pay per workplace.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { money, esc, shortDate } from './format.js';
import { DataError } from '../data/store.js';
import { addRate, updateRate, removeRate, restoreRate, normPlace } from '../data/pay.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('pay-sheet'));
  if (!d) { d = document.createElement('dialog'); d.id = 'pay-sheet'; d.className = 'sheet'; d.setAttribute('aria-labelledby', 'pay-t'); document.body.append(d); }
  return d;
}
const head = (title) => `<div class="between"><h2 class="t-title3" id="pay-t">${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));
const val = (root, id) => /** @type {HTMLInputElement} */ (root.querySelector('#' + id)).value;
/** Workplace names the person already uses (schedule, day records, rates), each once. @param {any} data */
export function knownPlaces(data) {
  /** @type {Map<string,string>} */ const m = new Map();
  const add = (p) => { const s = String(p ?? '').trim().replace(/\s+/g, ' '); if (s && !m.has(normPlace(s))) m.set(normPlace(s), s); };
  (Array.isArray(data.rules) ? data.rules : []).forEach((r) => add(r?.place));
  Object.values(data.work && typeof data.work === 'object' ? data.work : {}).forEach((r) => add(/** @type {any} */ (r)?.place));
  (Array.isArray(data.payRates) ? data.payRates : []).forEach((r) => add(r?.place));
  return [...m.values()];
}

/** @param {{data:any, lang:string}} c */
export function renderPay({ data, lang }) {
  const list = (Array.isArray(data.payRates) ? data.payRates : []).slice().sort((a, b) => normPlace(a.place).localeCompare(normPlace(b.place)) || String(b.from || '').localeCompare(String(a.from || '')));
  const rows = list.map((r) => `<button class="row row-hit" data-rate="${esc(r.id)}"><span class="row-icon accent">${icon('money')}</span><span class="row-main"><span class="row-title">${esc(r.place || t('pay.all', lang))}</span><br><span class="row-sub">${esc(r.from ? t('pay.since', lang) + ' ' + shortDate(r.from, lang) : t('pay.start', lang))}</span></span><span class="row-trail"><span class="t-headline num">${esc(money(Number(r.rate)))}${esc(t('pay.perhour', lang))}</span>${icon('chevron', 'i-sm')}</span></button>`).join('');
  return `<div class="stack-lg"><button class="btn btn-primary btn-block" id="pay-new">${icon('plus', 'i-sm')}${esc(t('pay.add', lang))}</button>
    ${list.length ? `<div class="list">${rows}</div>` : `<div class="card state"><p class="t-headline">${esc(t('pay.empty', lang))}</p><p class="t-sub muted">${esc(t('pay.empty.sub', lang))}</p></div>`}
    <p class="t-footnote muted">${esc(t('pay.note', lang))}</p></div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wirePay({ data, demo, rerender }) {
  document.getElementById('pay-new')?.addEventListener('click', () => openRateEditor(null, data, demo, rerender));
  document.querySelectorAll('[data-rate]').forEach((b) => b.addEventListener('click', () => openRateEditor((data.payRates || []).find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.rate) || null, data, demo, rerender)));
}
/** @param {any} r @param {any} data @param {boolean} demo @param {()=>void} onDone */
function openRateEditor(r, data, demo, onDone) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), places = knownPlaces(data);
  const isAll = r ? !r.place : !places.length; // first rate: default to "every workplace" (simplest)
  const chips = `<button type="button" class="chip" data-p="" aria-pressed="${isAll}">${esc(t('pay.all', L))}</button>${places.map((p) => `<button type="button" class="chip" data-p="${esc(p)}" aria-pressed="${!!r && normPlace(r.place) === normPlace(p)}">${esc(p)}</button>`).join('')}`;
  d.innerHTML = `<form class="stack" novalidate>${head(r ? t('pay.edit') : t('pay.add'))}
    <div class="field"><label for="y-place">${esc(t('pay.place'))}</label><input class="input" id="y-place" maxlength="40" value="${esc(r ? r.place : '')}" placeholder="${esc(t('pay.all', L))}" autocomplete="off"><div class="chips" id="y-chips" role="group" aria-label="${esc(t('pay.place'))}" style="margin-top:var(--s-2)">${chips}</div><span class="t-footnote muted">${esc(t('pay.all.hint', L))}</span></div>
    <div class="field"><label for="y-rate">${esc(t('pay.rate'))}</label><div class="input-money"><span>$</span><input class="input" id="y-rate" inputmode="decimal" value="${r?.rate ?? ''}" autocomplete="off"></div></div>
    <div class="field"><label for="y-from">${esc(t('pay.from'))}</label><input class="input" id="y-from" type="date" value="${esc(r?.from || '')}"></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${r ? `<button class="btn btn-danger btn-block" type="button" id="y-del">${esc(t('pay.delete'))}</button>` : ''}</form>`;
  const place = /** @type {HTMLInputElement} */ (d.querySelector('#y-place')), chipsEl = /** @type {HTMLElement} */ (d.querySelector('#y-chips'));
  const mark = () => chipsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(normPlace(/** @type {HTMLElement} */ (c).dataset.p) === normPlace(place.value))));
  chipsEl.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { place.value = /** @type {HTMLElement} */ (b).dataset.p || ''; mark(); } });
  place.addEventListener('input', mark); mark();
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = { place: place.value, rate: val(d, 'y-rate'), from: val(d, 'y-from') };
    try { if (r) updateRate(localStorage, r.id, f); else addRate(localStorage, f); closeSheet(d); onDone(); toast(t('ed.saved')); } catch (e) { fail(e); }
  });
  d.querySelector('#y-del')?.addEventListener('click', () => {
    try { const { gone, index } = removeRate(localStorage, r.id); closeSheet(d); onDone(); toast(t('pay.deleted'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { restoreRate(localStorage, gone, index); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } }); } catch (e) { fail(e); }
  });
  openSheet(d); setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector('#y-rate'))?.focus(), 50);
}
