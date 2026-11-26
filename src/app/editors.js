// @ts-check
// Edit sheets for a work day and a money entry. All saving goes through src/data/store.js.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast, segmented, flashNext } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { esc } from './format.js';
import { dayLabel } from './format.js';
import { openShortcutEditor } from './shortcuts.js';
import { knownPlaces } from './pay-ui.js';
import { normPlace } from '../data/pay.js';
import { subsFor, addSub, removeSub, restoreSubs, lastSubId } from '../data/subcategories.js';
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
    days.forEach((x) => flashNext(`[data-day="${x.day}"]`)); flashNext('#today-card');
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
  const tips = recentTips(data.work, 4), places = knownPlaces(data, i.place);
  d.innerHTML = `<form class="stack" novalidate>${head(dayLabel(day, L))}
    ${segHtml('e-status', t('ed.status'), ['worked', 'planned', 'off', 'leave'].map((s) => [s, t('st.' + s)]), st)}
    <div class="grid-2"><div class="field"><label for="e-hours">${esc(t('ed.hours'))}</label><input class="input" id="e-hours" inputmode="decimal" value="${i.hours || ''}"></div>
    <div class="field"><label for="e-tips">${esc(t('ed.tips'))}</label><div class="input-money"><span>$</span><input class="input" id="e-tips" inputmode="decimal" value="${i.tips || ''}"></div></div></div>
    ${tips.length ? `<div class="field"><span class="t-footnote muted">${esc(t('ed.recent'))}</span><div class="chips" id="e-tipchips">${tips.map((v) => `<button type="button" class="chip" data-v="${v}">$${v}</button>`).join('')}</div></div>` : ''}
    <div class="field"><label for="e-place">${esc(t('ed.place'))}</label><input class="input" id="e-place" value="${esc(i.place)}" maxlength="80" autocomplete="off">${places.length ? `<div class="chips" id="e-placechips" role="group" aria-label="${esc(t('ed.place'))}" style="margin-top:var(--s-2)">${places.map((p) => `<button type="button" class="chip" data-p="${esc(p)}" aria-pressed="${normPlace(p) === normPlace(i.place)}">${esc(p)}</button>`).join('')}</div>` : ''}</div>
    <details class="more"><summary>${icon('chevron', 'i-sm')}${esc(t('ed.more'))}</summary><div class="stack" style="padding-top:var(--s-2)">
      <div class="field"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(i.note)}" maxlength="500"></div></div></details>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  const segEl = /** @type {HTMLElement} */ (d.querySelector('#e-status'));
  segmented(segEl, (v) => { const h = /** @type {HTMLInputElement} */ (d.querySelector('#e-hours')); if ((v === 'off' || v === 'leave') && h.value === String(i.hours)) h.value = ''; else if (v === 'worked' && !h.value && i.hours) h.value = String(i.hours); });
  d.querySelectorAll('#e-tipchips .chip').forEach((c) => c.addEventListener('click', () => { /** @type {HTMLInputElement} */ (d.querySelector('#e-tips')).value = /** @type {HTMLElement} */ (c).dataset.v || ''; }));
  const placeIn = /** @type {HTMLInputElement} */ (d.querySelector('#e-place')), placeChips = d.querySelector('#e-placechips');
  const markPlace = () => placeChips?.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(normPlace(/** @type {HTMLElement} */ (c).dataset.p) === normPlace(placeIn.value))));
  placeChips?.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { placeIn.value = /** @type {HTMLElement} */ (b).dataset.p || ''; markPlace(); } });
  placeIn.addEventListener('input', markPlace);
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
  // sub-category (e.g. Transport > TTC): remembered per category; the last one used is pre-picked for new entries
  let sub = item?.subcategoryId ? { id: item.subcategoryId, name: item.subcategoryName || '' } : null, manage = false, adding = false;
  const subList = () => { const l = subsFor(localStorage, cur, cat); return sub && sub.name && !l.some((x) => x.id === sub.id) && cat === item?.category ? [...l, { id: sub.id, name: sub.name }] : l; };
  const pickLast = () => { const l = subsFor(localStorage, cur, cat), id = lastSubId(items, cur, cat, l); const f = l.find((x) => x.id === id); sub = f ? { id: f.id, name: f.name } : null; };
  if (!item) pickLast();
  const subHtml = () => {
    const l = subList();
    const chips = l.map((x) => manage
      ? `<span class="chip chip-edit"><span>${esc(x.name)}</span><button type="button" class="chip-x" data-rm="${esc(x.id)}" aria-label="${esc(t('ed.delete') + ': ' + x.name)}">${icon('close', 'i-sm')}</button></span>`
      : `<button type="button" class="chip" data-s="${esc(x.id)}" aria-pressed="${sub?.id === x.id}">${esc(x.name)}</button>`).join('');
    const add = adding
      ? `<span class="sub-add"><input class="input" id="e-subname" maxlength="30" autocomplete="off" placeholder="${esc(t('ed.sub.ph'))}"><button type="button" class="btn btn-tonal" id="e-subok">${esc(t('ed.sub.ok'))}</button></span>`
      : `<button type="button" class="chip chip-add" id="e-subnew">${icon('plus', 'i-sm')}${esc(t('ed.sub.add'))}</button>`;
    return `<div class="between"><span class="label" id="l-sub">${esc(t('ed.sub'))}</span>${l.length ? `<button type="button" class="link-btn" id="e-submanage">${esc(manage ? t('ed.sub.done') : t('ed.sub.manage'))}</button>` : ''}</div><div class="chips" id="e-sublist" role="group" aria-labelledby="l-sub">${chips}${manage ? '' : add}</div>`;
  };
  d.innerHTML = `<form class="stack ed-money" novalidate>${head(item ? t('ed.edit') : t('ed.new'))}
    ${segHtml('e-type', t('ed.type'), [['expense', t('home.expense')], ['income', t('home.income')]], cur)}
    <div class="field ed-amount"><label for="e-amount">${esc(t('ed.amount'))}</label><div class="input-money"><span>$</span><input class="input" id="e-amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${item ? item.amount : ''}"></div></div>
    <div class="ed-group"><div class="field"><span class="label" id="l-cat">${esc(t('ed.cat'))}</span><div class="chips" id="e-cats" role="group" aria-labelledby="l-cat">${chipsHtml()}</div></div>
    <div class="field" id="e-subbox">${subHtml()}</div></div>
    <div class="ed-row"><div class="field"><label for="e-date">${esc(t('ed.date'))}</label><input class="input" id="e-date" type="date" value="${esc(item?.date || date || today)}"></div>
    <div class="field"><label for="e-note">${esc(t('ed.note'))}</label><input class="input" id="e-note" value="${esc(item?.note || '')}" maxlength="500" placeholder="${esc(t('ed.note.ph'))}"></div></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${item ? `<div class="grid-2"><button class="btn btn-secondary" type="button" id="e-dup">${esc(t('ed.dup'))}</button><button class="btn btn-secondary" type="button" id="e-sc">${esc(t('sc.fromentry'))}</button></div><button class="btn btn-danger btn-block" type="button" id="e-del">${esc(t('ed.delete'))}</button>` : `<button class="btn btn-secondary btn-block" type="button" id="e-more">${esc(t('ed.saveadd'))}</button>`}</form>`;
  const subBox = /** @type {HTMLElement} */ (d.querySelector('#e-subbox'));
  const redrawSub = () => { subBox.innerHTML = subHtml(); if (adding) /** @type {HTMLElement|null} */ (subBox.querySelector('#e-subname'))?.focus(); };
  const amountEl = /** @type {HTMLInputElement} */ (d.querySelector('#e-amount'));
  const saveNewSub = () => {
    const inp = /** @type {HTMLInputElement|null} */ (subBox.querySelector('#e-subname')); const name = inp?.value.trim() || '';
    if (!name) { adding = false; redrawSub(); return; }
    try { const r = addSub(localStorage, cur, cat, name); sub = { id: r.sub.id, name: r.sub.name }; adding = false; redrawSub(); } catch (e) { fail(e); }
  };
  subBox.addEventListener('click', (e) => {
    const el = /** @type {HTMLElement} */ (e.target);
    const rm = el.closest('[data-rm]'), pick = el.closest('[data-s]');
    if (rm) {
      const id = /** @type {HTMLElement} */ (rm).dataset.rm || '', gone = subList().find((x) => x.id === id);
      try { const { prev } = removeSub(localStorage, cur, cat, id); if (sub?.id === id) sub = null; redrawSub(); toast(t('ed.sub.removed').replace('{n}', gone?.name || ''), { action: t('ap.undo'), ms: 5000, onAction: () => { try { restoreSubs(localStorage, prev); redrawSub(); toast(t('ed.restored')); } catch (x) { fail(x); } } }); } catch (x) { fail(x); }
    } else if (pick) {
      const id = /** @type {HTMLElement} */ (pick).dataset.s || '', f = subList().find((x) => x.id === id);
      sub = sub?.id === id ? null : (f ? { id: f.id, name: f.name } : null);
      const dflt = f && /** @type {any} */ (f).amount;
      if (sub && dflt && !amountEl.value) amountEl.value = String(dflt);
      redrawSub();
    } else if (el.closest('#e-subnew')) { adding = true; redrawSub(); }
    else if (el.closest('#e-subok')) saveNewSub();
    else if (el.closest('#e-submanage')) { manage = !manage; adding = false; redrawSub(); }
  });
  subBox.addEventListener('keydown', (e) => { if (e.key === 'Enter' && /** @type {HTMLElement} */ (e.target).id === 'e-subname') { e.preventDefault(); saveNewSub(); } });
  const chipsEl = /** @type {HTMLElement} */ (d.querySelector('#e-cats'));
  chipsEl.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { cat = /** @type {HTMLElement} */ (b).dataset.v || ''; chipsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); adding = false; manage = false; pickLast(); redrawSub(); } });
  segmented(/** @type {HTMLElement} */ (d.querySelector('#e-type')), (v) => { cur = v; cat = pickDefault(cur); chipsEl.innerHTML = chipsHtml(); adding = false; manage = false; pickLast(); redrawSub(); });
  const fields = () => ({ type: cur, amount: val(d, 'e-amount').replace(',', '.'), date: val(d, 'e-date'), category: cat, note: val(d, 'e-note'), subcategoryId: sub?.id || '', subcategoryName: sub?.name || '' });
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
        flashNext(`[data-id="${added.id}"]`); onDone(); toast(t('ed.saved'), undoAdd(added));
        if (keepOpen) { /** @type {HTMLInputElement} */ (d.querySelector('#e-amount')).value = ''; /** @type {HTMLInputElement} */ (d.querySelector('#e-note')).value = ''; amountEl.focus(); } else closeSheet(d);
      }
    } catch (e) { fail(e); }
  };
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => { ev.preventDefault(); submit(false); });
  d.querySelector('#e-more')?.addEventListener('click', () => submit(true));
  d.querySelector('#e-dup')?.addEventListener('click', () => {
    try { const added = addItem(localStorage, { ...fields(), date: today }); closeSheet(d); flashNext(`[data-id="${added.id}"]`); onDone(); toast(t('ed.saved'), undoAdd(added)); } catch (e) { fail(e); }
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
