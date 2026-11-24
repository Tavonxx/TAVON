// @ts-check
// Edit sheets for a work day and a money entry. All saving goes through src/data/store.js.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast, segmented } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { esc } from './dashboard.js';
import { dayLabel } from './format.js';
import { dayInfo } from '../data/stats.js';
import { saveWorkDay, restoreWorkDay, addItem, updateItem, removeItem, reinsertItem, deleteQuietly, readCategories, categoryLabel, DataError } from '../data/store.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('ed'));
  if (!d) { d = document.createElement('dialog'); d.id = 'ed'; d.className = 'sheet'; d.setAttribute('aria-labelledby', 'ed-t'); document.body.append(d); }
  return d;
}
const head = (title) => `<div class="between"><h2 class="t-title3" id="ed-t">${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
const segHtml = (id, label, opts, cur) => `<div class="field"><span class="label" id="l-${id}">${esc(label)}</span><div class="seg" id="${id}" role="group" aria-labelledby="l-${id}">${opts.map(([v, k]) => `<button type="button" data-value="${v}" aria-pressed="${v === cur}">${esc(k)}</button>`).join('')}</div></div>`;
/** @param {any} e */
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));
/** @param {HTMLElement} root @param {string} id */
const val = (root, id) => /** @type {HTMLInputElement} */ (root.querySelector('#' + id)).value;

/** Edit one work day. @param {{day:string, data:any, demo:boolean, focus?:string, onDone:()=>void}} o */
export function openWorkEditor({ day, data, demo, focus, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), i = dayInfo(data.work, data.rules, day);
  const st = (focus === 'tips' && i.status === 'off') ? 'worked' : (['worked', 'planned', 'off', 'leave'].includes(i.status) ? i.status : 'worked'); // adding a tip implies the person worked
  d.innerHTML = `<form class="stack" novalidate>${head(dayLabel(day, L))}
    ${segHtml('e-status', t('ed.status'), ['worked', 'planned', 'off', 'leave'].map((s) => [s, t('st.' + s)]), st)}
    <div class="grid-2"><div class="field"><label for="e-hours">${esc(t('ed.hours'))}</label><input class="input" id="e-hours" inputmode="decimal" value="${i.hours || ''}"></div>
    <div class="field"><label for="e-tips">${esc(t('ed.tips'))}</label><input class="input" id="e-tips" inputmode="decimal" value="${i.tips || ''}"></div></div>
    <div class="field"><label for="e-place">${esc(t('ed.place'))}</label><input class="input" id="e-place" value="${esc(i.place)}" maxlength="80"></div>
    <div class="field"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(i.note)}" maxlength="500"></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  segmented(/** @type {HTMLElement} */ (d.querySelector('#e-status')));
  const form = /** @type {HTMLFormElement} */ (d.querySelector('form'));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const status = /** @type {HTMLElement} */ (d.querySelector('#e-status [aria-pressed="true"]'))?.dataset.value || st;
    try {
      const { prev } = saveWorkDay(localStorage, day, { status, hours: val(d, 'e-hours'), tips: val(d, 'e-tips'), place: val(d, 'e-place'), note: val(d, 'e-note') });
      closeSheet(d); onDone();
      toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { restoreWorkDay(localStorage, day, prev); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
  if (focus) /** @type {HTMLElement|null} */ (d.querySelector('#e-' + focus))?.focus();
}

/** Add or edit a money entry. @param {{item?:any, type?:string, date?:string, demo:boolean, onDone:()=>void}} o */
export function openMoneyEditor({ item, type, date, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), cats = readCategories(localStorage);
  let cur = item?.type || type || 'expense';
  const catOptions = (tp, sel) => cats[tp].map((r) => `<option value="${esc(r[0])}"${r[0] === sel ? ' selected' : ''}>${esc(L === 'en' ? r[2] : r[1])}</option>`).join('');
  const today = date || new Date().toISOString().slice(0, 10);
  d.innerHTML = `<form class="stack" novalidate>${head(item ? t('ed.edit') : t('ed.new'))}
    ${segHtml('e-type', t('ed.type'), [['expense', t('home.expense')], ['income', t('home.income')]], cur)}
    <div class="field"><label for="e-amount">${esc(t('ed.amount'))}</label><div class="input-money"><span>$</span><input class="input" id="e-amount" inputmode="decimal" value="${item ? item.amount : ''}"></div></div>
    <div class="field"><label for="e-date">${esc(t('ed.date'))}</label><input class="input" id="e-date" type="date" value="${esc(item?.date || today)}"></div>
    <div class="field"><label for="e-cat">${esc(t('ed.category'))}</label><div class="select-wrap"><select class="select" id="e-cat">${catOptions(cur, item?.category)}</select></div></div>
    <div class="field"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(item?.note || '')}" maxlength="500"></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${item ? `<button class="btn btn-danger btn-block" type="button" id="e-del">${esc(t('ed.delete'))}</button>` : ''}</form>`;
  const sel = /** @type {HTMLSelectElement} */ (d.querySelector('#e-cat'));
  segmented(/** @type {HTMLElement} */ (d.querySelector('#e-type')), (v) => { cur = v; sel.innerHTML = catOptions(cur, ''); });
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = { type: cur, amount: val(d, 'e-amount').replace(',', '.'), date: val(d, 'e-date'), category: sel.value, note: val(d, 'e-note') };
    try {
      if (item) {
        const { prev, index } = updateItem(localStorage, item.id, f);
        closeSheet(d); onDone();
        toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { reinsertItem(localStorage, prev, index); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
      } else {
        const added = addItem(localStorage, f);
        closeSheet(d); onDone();
        toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { deleteQuietly(localStorage, added.id); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
      }
    } catch (e) { fail(e); }
  });
  d.querySelector('#e-del')?.addEventListener('click', () => {
    try {
      const { item: gone, index } = removeItem(localStorage, item.id);
      closeSheet(d); onDone();
      toast(t('ed.deleted'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { reinsertItem(localStorage, gone, index); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
}
export { categoryLabel };
