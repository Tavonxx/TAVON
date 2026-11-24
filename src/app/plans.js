// @ts-check
// Settings pages: weekly work schedule and recurring bills.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast, segmented, switchControl } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { money, esc } from './format.js';
import { todayKey, planSwap, addDays, dayInfo } from '../data/stats.js';
import { suggestWeeklySchedule } from '../data/schedule.js';
import { readCategories, categoryLabel, DataError, saveWorkDays, restoreWorkDays } from '../data/store.js';
import { addCategory, renameCategory, restoreCategories } from '../data/categories.js';
import { setWeekday, replaceSchedule, restoreSchedule, addRecurring, updateRecurring, removeRecurring, restoreRecurring } from '../data/plans.js';

const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first, like the rest of the app
const wdName = (wd, lang) => new Intl.DateTimeFormat(lang === 'en' ? 'en-CA' : 'th-TH-u-ca-gregory', { weekday: 'long' }).format(new Date(2026, 10, 22 + wd, 12)); // 22 Nov 2026 is a Sunday
/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('pl-sheet'));
  if (!d) { d = document.createElement('dialog'); d.id = 'pl-sheet'; d.className = 'sheet'; d.setAttribute('aria-labelledby', 'pl-t'); document.body.append(d); }
  return d;
}
const head = (title) => `<div class="between"><h2 class="t-title3" id="pl-t">${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));
const val = (root, id) => /** @type {HTMLInputElement} */ (root.querySelector('#' + id)).value;
const undoToast = (msg, undo, onDone) => toast(msg, { action: t('ap.undo'), ms: 5000, onAction: () => { try { undo(); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
const rules = (data) => (Array.isArray(data.rules) ? data.rules : []);

/** @param {{data:any, lang:string}} c */
export function renderSchedule({ data, lang }) {
  const by = new Map(rules(data).map((r) => [r.weekday, r]));
  const rows = ORDER.map((wd) => { const r = by.get(wd);
    return `<button class="row row-hit" data-wd="${wd}"><span class="row-main"><span class="row-title">${esc(wdName(wd, lang))}</span><br><span class="row-sub">${r ? esc([r.place, r.time, r.hours + ' ' + t('ed.hours', lang).toLowerCase()].filter(Boolean).join(' · ')) : esc(t('pl.off', lang))}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`; }).join('');
  return `<div class="stack-lg"><div class="list">${rows}</div><button class="btn btn-secondary btn-block" id="pl-suggest">${esc(t('pl.suggest', lang))}</button></div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireSchedule({ data, demo, rerender }) {
  document.querySelectorAll('[data-wd]').forEach((b) => b.addEventListener('click', () => openDayEditor(Number(/** @type {HTMLElement} */ (b).dataset.wd), rules(data), demo, rerender)));
  document.getElementById('pl-suggest')?.addEventListener('click', () => {
    if (demo) { toast(t('ed.demo')); return; }
    const sug = suggestWeeklySchedule(data.work, { today: new Date() });
    if (!sug.length) { toast(t('pl.suggest.none')); return; }
    const L = getLang(), d = sheet();
    d.innerHTML = `<div class="stack">${head(t('pl.suggest.title'))}<p class="t-sub muted">${esc(t('pl.suggest.note'))}</p><div class="list">${ORDER.map((wd) => sug.find((r) => r.weekday === wd)).filter(Boolean).map((r) => `<div class="row"><span class="row-main"><span class="row-title">${esc(wdName(r.weekday, L))}</span><br><span class="row-sub">${esc([r.place, r.time, r.hours + ' ' + t('ed.hours').toLowerCase()].filter(Boolean).join(' · '))}</span></span></div>`).join('')}</div><button class="btn btn-primary btn-block" id="pl-use">${esc(t('pl.suggest.use'))}</button></div>`;
    d.querySelector('#pl-use')?.addEventListener('click', () => { try { const { prev } = replaceSchedule(localStorage, sug); closeSheet(d); rerender(); undoToast(t('ed.saved'), () => restoreSchedule(localStorage, prev), rerender); } catch (e) { fail(e); } });
    openSheet(d);
  });
}
/** @param {number} wd @param {any[]} list @param {boolean} demo @param {()=>void} onDone */
function openDayEditor(wd, list, demo, onDone) {
  if (demo) { toast(t('ed.demo')); return; }
  const d = sheet(), r = list.find((x) => x.weekday === wd);
  d.innerHTML = `<form class="stack" novalidate>${head(wdName(wd, getLang()))}
    <div class="row"><span class="row-main"><span class="row-title" id="l-on">${esc(t('pl.works'))}</span></span><button type="button" class="switch" role="switch" id="pl-on" aria-labelledby="l-on" aria-checked="${!!r}"></button></div>
    <div id="pl-fields" class="stack"${r ? '' : ' hidden'}>
      <div class="field"><label for="p-place">${esc(t('ed.place'))}</label><input class="input" id="p-place" maxlength="40" value="${esc(r?.place || '')}" autocomplete="off"></div>
      <div class="field"><label for="p-time">${esc(t('pl.time'))}</label><input class="input" id="p-time" maxlength="20" value="${esc(r?.time || '')}" autocomplete="off"></div>
      <div class="field"><label for="p-hours">${esc(t('ed.hours'))}</label><input class="input" id="p-hours" inputmode="decimal" value="${r?.hours ?? ''}"></div></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  const sw = /** @type {HTMLElement} */ (d.querySelector('#pl-on')); let on = !!r;
  switchControl(sw, (v) => { on = v; /** @type {HTMLElement} */ (d.querySelector('#pl-fields')).hidden = !v; });
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    try { const { prev } = setWeekday(localStorage, wd, on ? { place: val(d, 'p-place'), time: val(d, 'p-time'), hours: val(d, 'p-hours').replace(',', '.') } : null); closeSheet(d); onDone(); undoToast(t('ed.saved'), () => restoreSchedule(localStorage, prev), onDone); } catch (e) { fail(e); }
  });
  openSheet(d); setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector(on ? '#p-place' : 'button[type=submit]'))?.focus(), 50);
}

/** @param {{data:any, lang:string}} c */
export function renderRecurring({ data, lang }) {
  const cats = readCategories(localStorage), list = Array.isArray(data.recurring) ? data.recurring.filter((r) => r && r.id) : [];
  const rows = list.map((r) => `<button class="row row-hit" data-rec="${esc(r.id)}"><span class="row-icon accent">${icon('money')}</span><span class="row-main"><span class="row-title">${esc(r.note || categoryLabel(cats, 'expense', r.category, lang))}</span><br><span class="row-sub">${esc(money(Number(r.amount)))} · ${esc(t('pl.rec.line', lang))} ${esc(r.day)}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`).join('');
  return `<div class="stack-lg"><button class="btn btn-primary btn-block" id="rec-new">${icon('plus', 'i-sm')}${esc(t('pl.rec.add', lang))}</button>${list.length ? `<div class="list">${rows}</div>` : `<div class="card state"><p class="t-sub muted">${esc(t('pl.rec.empty', lang))}</p></div>`}</div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireRecurring({ data, demo, rerender }) {
  document.getElementById('rec-new')?.addEventListener('click', () => openRecEditor(null, demo, rerender));
  document.querySelectorAll('[data-rec]').forEach((b) => b.addEventListener('click', () => openRecEditor((data.recurring || []).find((x) => x?.id === /** @type {HTMLElement} */ (b).dataset.rec) || null, demo, rerender)));
}
/** @param {any} r @param {boolean} demo @param {()=>void} onDone */
function openRecEditor(r, demo, onDone) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), cats = readCategories(localStorage);
  let cat = r?.category || cats.expense[0][0];
  d.innerHTML = `<form class="stack" novalidate>${head(r ? t('pl.rec.edit') : t('pl.rec.add'))}
    <div class="field"><label for="r-note">${esc(t('pl.rec.name'))}</label><input class="input" id="r-note" maxlength="60" value="${esc(r?.note || '')}" autocomplete="off"></div>
    <div class="field"><label for="r-amount">${esc(t('ed.amount'))}</label><div class="input-money"><span>$</span><input class="input" id="r-amount" inputmode="decimal" value="${r?.amount ?? ''}"></div></div>
    <div class="field"><label for="r-day">${esc(t('pl.rec.day'))}</label><input class="input" id="r-day" inputmode="numeric" maxlength="2" value="${r?.day ?? ''}"></div>
    <div class="field"><label for="r-start">${esc(t('pl.rec.start'))}</label><input class="input" id="r-start" type="month" value="${esc(r?.startMonth || todayKey().slice(0, 7))}"></div>
    <div class="field"><span class="label" id="l-rc">${esc(t('ed.cat'))}</span><div class="chips" id="r-cats" role="group" aria-labelledby="l-rc">${cats.expense.map((c) => `<button type="button" class="chip" data-v="${esc(c[0])}" aria-pressed="${c[0] === cat}">${esc(categoryLabel(cats, 'expense', c[0], L))}</button>`).join('')}</div></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${r ? `<button class="btn btn-danger btn-block" type="button" id="r-del">${esc(t('pl.rec.delete'))}</button>` : ''}</form>`;
  const catsEl = /** @type {HTMLElement} */ (d.querySelector('#r-cats'));
  catsEl.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { cat = /** @type {HTMLElement} */ (b).dataset.v || ''; catsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); } });
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = { note: val(d, 'r-note'), amount: val(d, 'r-amount'), day: val(d, 'r-day'), startMonth: val(d, 'r-start'), category: cat };
    try { if (r) updateRecurring(localStorage, r.id, f); else addRecurring(localStorage, f); closeSheet(d); onDone(); toast(t('ed.saved')); } catch (e) { fail(e); }
  });
  d.querySelector('#r-del')?.addEventListener('click', () => {
    try { const { gone, index } = removeRecurring(localStorage, r.id); closeSheet(d); onDone(); undoToast(t('pl.rec.deleted'), () => restoreRecurring(localStorage, gone, index), onDone); } catch (e) { fail(e); }
  });
  openSheet(d); setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector('#r-note'))?.focus(), 50);
}

/** Swap one work day for another (quick action). @param {{data:any, demo:boolean, onDone:()=>void}} o */
export function openSwap({ data, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const d = sheet(), today = todayKey();
  let from = today; for (let i = 0; i < 14; i++) { const k = addDays(today, i); if (dayInfo(data.work, data.rules, k).status === 'planned') { from = k; break; } }
  let to = addDays(from, 1); for (let i = 1; i < 14; i++) { const k = addDays(from, i); if (!['planned', 'worked'].includes(dayInfo(data.work, data.rules, k).status)) { to = k; break; } }
  d.innerHTML = `<form class="stack" novalidate>${head(t('sw.title'))}
    <div class="field"><label for="w-from">${esc(t('sw.from'))}</label><input class="input" id="w-from" type="date" value="${from}"></div>
    <div class="field"><label for="w-to">${esc(t('sw.to'))}</label><input class="input" id="w-to" type="date" value="${to}"></div>
    <p class="t-footnote muted">${esc(t('sw.hint'))}</p>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('sw.save'))}</button></form>`;
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      const { prev } = saveWorkDays(localStorage, planSwap(data.work, data.rules, val(d, 'w-from'), val(d, 'w-to')));
      closeSheet(d); onDone(); undoToast(t('ed.saved'), () => restoreWorkDays(localStorage, prev), onDone);
    } catch (e) { fail(e); }
  });
  openSheet(d);
}

/** @param {{lang:string}} c */
export function renderCategories({ lang }) {
  const cats = readCategories(localStorage);
  const block = (type) => `<section class="stack" aria-label="${esc(t('home.' + type, lang))}"><h2 class="t-label">${esc(t('home.' + type, lang))}</h2><div class="list">${cats[type].map((r) => `<button class="row row-hit" data-cat="${type}:${esc(r[0])}"><span class="row-main"><span class="row-title">${esc(lang === 'en' ? r[2] : r[1])}</span></span><span class="row-trail">${icon('chevron', 'i-sm')}</span></button>`).join('')}</div><button class="btn btn-secondary btn-block" data-catadd="${type}">${icon('plus', 'i-sm')}${esc(t('cat.add', lang))}</button></section>`;
  return `<div class="stack-lg">${block('expense')}${block('income')}<p class="t-footnote muted">${esc(t('cat.note', lang))}</p></div>`;
}
/** @param {{demo:boolean, rerender:()=>void}} c */
export function wireCategories({ demo, rerender }) {
  document.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { const [type, code] = /** @type {string} */ (/** @type {HTMLElement} */ (b).dataset.cat).split(':'); openCatEditor(type, code, demo, rerender); }));
  document.querySelectorAll('[data-catadd]').forEach((b) => b.addEventListener('click', () => openCatEditor(/** @type {string} */ (/** @type {HTMLElement} */ (b).dataset.catadd), '', demo, rerender)));
}
/** @param {string} type @param {string} code @param {boolean} demo @param {()=>void} onDone */
function openCatEditor(type, code, demo, onDone) {
  if (demo) { toast(t('ed.demo')); return; }
  const d = sheet(), row = readCategories(localStorage)[type].find((r) => r[0] === code);
  d.innerHTML = `<form class="stack" novalidate>${head(row ? t('cat.edit') : t('cat.add'))}
    <div class="field"><label for="k-th">${esc(t('cat.th'))}</label><input class="input" id="k-th" maxlength="24" value="${esc(row?.[1] || '')}" autocomplete="off"></div>
    <div class="field"><label for="k-en">${esc(t('cat.en'))}</label><input class="input" id="k-en" maxlength="24" value="${esc(row?.[2] || '')}" autocomplete="off"></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button></form>`;
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = { th: val(d, 'k-th'), en: val(d, 'k-en') };
    try { const { prev } = row ? renameCategory(localStorage, /** @type {any} */ (type), code, f) : addCategory(localStorage, /** @type {any} */ (type), f); closeSheet(d); onDone(); undoToast(t('ed.saved'), () => restoreCategories(localStorage, prev), onDone); } catch (e) { fail(e); }
  });
  openSheet(d); setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector('#k-th'))?.focus(), 50);
}
