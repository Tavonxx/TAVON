// @ts-check
// Edit sheets for a work day and a money entry. All saving goes through src/data/store.js.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast, segmented } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { esc } from './format.js';
import { dayLabel } from './format.js';
import { openShortcutEditor } from './shortcuts.js';
import { dayInfo, recentTips, categoryRanking, todayKey } from '../data/stats.js';
import { saveWorkDay, restoreWorkDay, saveWorkDays, restoreWorkDays, addItem, updateItem, removeItem, reinsertItem, deleteQuietly, readCategories, categoryLabel, DataError } from '../data/store.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('ed'));
  if (!d) { d = document.createElement('dialog'); d.id = 'ed'; d.className = 'sheet center'; d.setAttribute('aria-labelledby', 'ed-t'); document.body.append(d); }
  return d;
}
const head = (title) => `<div class="between"><h2 class="t-title3" id="ed-t">${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
const segHtml = (id, label, opts, cur) => `<div class="field"><span class="label" id="l-${id}">${esc(label)}</span><div class="seg" id="${id}" role="group" aria-labelledby="l-${id}">${opts.map(([v, k]) => `<button type="button" data-value="${v}" aria-pressed="${v === cur}">${esc(k)}</button>`).join('')}</div></div>`;
/** @param {any} e */
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));
/** @param {HTMLElement} root @param {string} id */
const val = (root, id) => /** @type {HTMLInputElement} */ (root.querySelector('#' + id)).value;

/** One-tap: mark days as worked using the schedule's hours and place. Undo restores every day.
 * @param {{days:any[], data:any, demo:boolean, onDone:()=>void}} o */
export function confirmDays({ days, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  if (!days.length) return;
  try {
    const { prev } = saveWorkDays(localStorage, days.map((x) => ({ day: x.day, patch: { status: 'worked', hours: x.hours, place: x.place, time: x.time } })));
    onDone();
    toast(t('cf.count').replace('{n}', String(days.length)), { action: t('ap.undo'), ms: 6000, onAction: () => { try { restoreWorkDays(localStorage, prev); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
  } catch (e) { fail(e); }
}

/** Edit one work day. Main screen = status + hours + tips; place and note are tucked away.
 * @param {{day:string, data:any, demo:boolean, focus?:string, onDone:()=>void}} o */
export function openWorkEditor({ day, data, demo, focus, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), i = dayInfo(data.work, data.rules, day);
  const st = (focus === 'tips' && i.status === 'off') ? 'worked' : (['worked', 'planned', 'off', 'leave'].includes(i.status) ? i.status : 'worked'); // adding a tip implies the person worked
  const tips = recentTips(data.work, 4);
  d.innerHTML = `<form class="stack" novalidate>${head(dayLabel(day, L))}
    ${segHtml('e-status', t('ed.status'), ['worked', 'planned', 'off', 'leave'].map((s) => [s, t('st.' + s)]), st)}
    <div class="grid-2"><div class="field"><label for="e-hours">${esc(t('ed.hours'))}</label><input class="input" id="e-hours" inputmode="decimal" value="${i.hours || ''}"></div>
    <div class="field"><label for="e-tips">${esc(t('ed.tips'))}</label><div class="input-money"><span>$</span><input class="input" id="e-tips" inputmode="decimal" value="${i.tips || ''}"></div></div></div>
    ${tips.length ? `<div class="field"><span class="t-footnote muted">${esc(t('ed.recent'))}</span><div class="chips" id="e-tipchips">${tips.map((v) => `<button type="button" class="chip" data-v="${v}">$${v}</button>`).join('')}</div></div>` : ''}
    <details class="more"><summary>${icon('chevron', 'i-sm')}${esc(t('ed.more'))}</summary><div class="stack" style="padding-top:var(--s-2)">
      <div class="field"><label for="e-place">${esc(t('ed.place'))}</label><input class="input" id="e-place" value="${esc(i.place)}" maxlength="80"></div>
      <div class="field"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(i.note)}" maxlength="500"></div></div></details>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  const segEl = /** @type {HTMLElement} */ (d.querySelector('#e-status'));
  segmented(segEl, (v) => { const h = /** @type {HTMLInputElement} */ (d.querySelector('#e-hours')); if ((v === 'off' || v === 'leave') && h.value === String(i.hours)) h.value = ''; else if (v === 'worked' && !h.value && i.hours) h.value = String(i.hours); });
  d.querySelectorAll('#e-tipchips .chip').forEach((c) => c.addEventListener('click', () => { /** @type {HTMLInputElement} */ (d.querySelector('#e-tips')).value = /** @type {HTMLElement} */ (c).dataset.v || ''; }));
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const status = /** @type {HTMLElement} */ (d.querySelector('#e-status [aria-pressed="true"]'))?.dataset.value || st;
    try {
      const { prev } = saveWorkDay(localStorage, day, { status, hours: val(d, 'e-hours'), tips: val(d, 'e-tips'), place: val(d, 'e-place'), note: val(d, 'e-note') });
      closeSheet(d); onDone();
      toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { restoreWorkDay(localStorage, day, prev); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
  if (focus === 'tips') /** @type {HTMLElement|null} */ (d.querySelector('#e-tips'))?.focus();
}

/** Add or edit a money entry. New entries: amount is focused, last/most-used category preselected, so the common case is
 * "type the amount, tap Save". @param {{item?:any, type?:string, date?:string, items?:any, demo:boolean, onDone:()=>void}} o */
export function openMoneyEditor({ item, type, date, items, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), cats = readCategories(localStorage), today = todayKey();
  let cur = item?.type || type || 'expense', cat = item?.category || '';
  const ordered = (tp) => { const rank = categoryRanking(items, tp, today); const all = cats[tp].map((r) => r[0]); return [...rank.filter((c) => all.includes(c)), ...all.filter((c) => !rank.includes(c))]; };
  const pickDefault = (tp) => ordered(tp)[0] || '';
  if (!cat) cat = pickDefault(cur);
  const chipsHtml = () => ordered(cur).map((c) => `<button type="button" class="chip" data-v="${esc(c)}" aria-pressed="${c === cat}">${esc(categoryLabel(cats, cur, c, L))}</button>`).join('');
  d.innerHTML = `<form class="stack" novalidate>${head(item ? t('ed.edit') : t('ed.new'))}
    ${segHtml('e-type', t('ed.type'), [['expense', t('home.expense')], ['income', t('home.income')]], cur)}
    <div class="field"><label for="e-amount">${esc(t('ed.amount'))}</label><div class="input-money"><span>$</span><input class="input" id="e-amount" inputmode="decimal" autocomplete="off" value="${item ? item.amount : ''}"></div></div>
    <div class="field"><span class="label" id="l-cat">${esc(t('ed.cat'))}</span><div class="chips" id="e-cats" role="group" aria-labelledby="l-cat">${chipsHtml()}</div></div>
    <div class="field"><label for="e-date">${esc(t('ed.date'))}</label><input class="input" id="e-date" type="date" value="${esc(item?.date || date || today)}"></div>
    <details class="more"><summary>${icon('chevron', 'i-sm')}${esc(t('ed.more'))}</summary><div class="field" style="padding-top:var(--s-2)"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(item?.note || '')}" maxlength="500"></div></details>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${item ? `<button class="btn btn-secondary btn-block" type="button" id="e-dup">${esc(t('ed.dup'))}</button><button class="btn btn-secondary btn-block" type="button" id="e-sc">${esc(t('sc.fromentry'))}</button><button class="btn btn-danger btn-block" type="button" id="e-del">${esc(t('ed.delete'))}</button>` : `<button class="btn btn-secondary btn-block" type="button" id="e-more">${esc(t('ed.saveadd'))}</button>`}</form>`;
  const chipsEl = /** @type {HTMLElement} */ (d.querySelector('#e-cats'));
  chipsEl.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { cat = /** @type {HTMLElement} */ (b).dataset.v || ''; chipsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); } });
  segmented(/** @type {HTMLElement} */ (d.querySelector('#e-type')), (v) => { cur = v; cat = pickDefault(cur); chipsEl.innerHTML = chipsHtml(); });
  const fields = () => ({ type: cur, amount: val(d, 'e-amount').replace(',', '.'), date: val(d, 'e-date'), category: cat, note: val(d, 'e-note') });
  const undoAdd = (added) => ({ action: t('ap.undo'), ms: 5000, onAction: () => { try { deleteQuietly(localStorage, added.id); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
  /** @param {boolean} keepOpen */
  const submit = (keepOpen) => {
    try {
      if (item) {
        const { prev, index } = updateItem(localStorage, item.id, fields());
        closeSheet(d); onDone();
        toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { reinsertItem(localStorage, prev, index); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
      } else {
        const added = addItem(localStorage, fields());
        onDone(); toast(t('ed.saved'), undoAdd(added));
        if (keepOpen) { /** @type {HTMLInputElement} */ (d.querySelector('#e-amount')).value = ''; /** @type {HTMLInputElement} */ (d.querySelector('#e-note')).value = ''; /** @type {HTMLElement} */ (d.querySelector('#e-amount')).focus(); } else closeSheet(d);
      }
    } catch (e) { fail(e); }
  };
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => { ev.preventDefault(); submit(false); });
  d.querySelector('#e-more')?.addEventListener('click', () => submit(true));
  d.querySelector('#e-dup')?.addEventListener('click', () => {
    try { const added = addItem(localStorage, { ...fields(), date: today }); closeSheet(d); onDone(); toast(t('ed.saved'), undoAdd(added)); } catch (e) { fail(e); }
  });
  d.querySelector('#e-sc')?.addEventListener('click', () => { const f = fields(); closeSheet(d); setTimeout(() => openShortcutEditor({ prefill: { label: item.note || '', type: f.type, category: f.category, amount: Number(f.amount) || null, count: 1 }, demo, onDone }), 220); });
  d.querySelector('#e-del')?.addEventListener('click', () => {
    try {
      const { item: gone, index } = removeItem(localStorage, item.id);
      closeSheet(d); onDone();
      toast(t('ed.deleted'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { reinsertItem(localStorage, gone, index); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
  setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector('#e-amount'))?.focus(), 50);
}
export { categoryLabel };
