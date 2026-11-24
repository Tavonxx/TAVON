// @ts-check
// One-tap shortcut buttons: grid, confirm sheet, editor, manage page.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast, segmented } from '../ui/ui.js';
import { t, getLang } from './i18n.js';
import { money, esc } from './format.js';
import { todayKey } from '../data/stats.js';
import { readCategories, categoryLabel, deleteMany, DataError } from '../data/store.js';
import { readShortcuts, addShortcut, updateShortcut, removeShortcut, restoreShortcut, moveShortcut, useShortcut } from '../data/shortcuts.js';

/** @returns {HTMLDialogElement} */
function sheet() {
  let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('sc-sheet'));
  if (!d) { d = document.createElement('dialog'); d.id = 'sc-sheet'; d.className = 'sheet center'; d.setAttribute('aria-labelledby', 'sc-t'); document.body.append(d); }
  return d;
}
const head = (title) => `<div class="between"><h2 class="t-title3" id="sc-t">${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>`;
/** @param {any} e */
const fail = (e) => toast(e instanceof DataError ? t('ed.error') + t('err.' + e.code) : t('ed.invalid'));
/** @param {HTMLElement} root @param {string} id */
const val = (root, id) => /** @type {HTMLInputElement} */ (root.querySelector('#' + id)).value;

/** Grid size follows the number of buttons: 1 = full width, 2-4 = two columns, more = three. @param {any[]} list @param {string} lang */
export function shortcutGrid(list, lang) {
  if (!list.length) return `<div class="card state"><div class="state-icon">${icon('bolt', 'i-lg')}</div><p class="t-headline">${esc(t('sc.empty', lang))}</p><p class="t-sub muted">${esc(t('sc.empty.sub', lang))}</p><a class="btn btn-primary" href="#/settings/shortcuts">${esc(t('sc.create', lang))}</a></div>`;
  const cols = list.length === 1 ? 1 : list.length <= 4 ? 2 : 3;
  const tiles = list.map((s) => `<button class="sc ${s.type === 'income' ? 'inc' : 'exp'}" data-sc="${esc(s.id)}"><span class="sc-l">${esc(s.label)}</span><span class="sc-a">${s.amount ? esc(money(s.amount)) : '—'}${s.count > 1 ? ' × ' + s.count : ''}</span></button>`).join('');
  return `<div class="stack"><div class="sc-grid${cols === 1 ? ' one' : ''}" style="--cols:${cols}">${tiles}</div><a class="btn btn-ghost btn-sm" style="align-self:flex-start" href="#/settings/shortcuts">${esc(t('sc.manage', lang))}</a></div>`;
}
/** Make every tile open its confirm sheet. @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireShortcuts({ data, demo, rerender }) {
  document.querySelectorAll('[data-sc]').forEach((b) => b.addEventListener('click', () => {
    const sc = (data.shortcuts || []).find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.sc);
    if (sc) openShortcutConfirm({ sc, demo, onDone: rerender });
  }));
}

/** Tap a shortcut: price is filled in, change it if needed, confirm. @param {{sc:any, demo:boolean, onDone:()=>void}} o */
export function openShortcutConfirm({ sc, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const d = sheet();
  let count = sc.count;
  const counts = [...new Set([1, 2, 3, sc.count])].sort((a, b) => a - b);
  d.innerHTML = `<form class="stack" novalidate>${head(sc.label)}
    <div class="field"><label for="c-amount">${esc(t('ed.amount'))}</label><div class="input-money"><span>$</span><input class="input" id="c-amount" inputmode="decimal" autocomplete="off" value="${sc.amount ?? ''}"></div></div>
    <div class="field"><span class="label" id="l-cnt">${esc(t('sc.howmany'))}</span><div class="seg" id="c-count" role="group" aria-labelledby="l-cnt">${counts.map((n) => `<button type="button" data-value="${n}" aria-pressed="${n === count}">× ${n}</button>`).join('')}</div></div>
    <button type="button" class="chip" id="c-keep" aria-pressed="false" hidden>${esc(t('sc.keep'))}</button>
    <details class="more"><summary>${icon('chevron', 'i-sm')}${esc(t('ed.more'))}</summary><div class="field" style="padding-top:var(--s-2)"><label for="c-date">${esc(t('ed.date'))}</label><input class="input" id="c-date" type="date" value="${todayKey()}"></div></details>
    <button class="btn btn-primary btn-block" type="submit" id="c-save"></button></form>`;
  const amountEl = /** @type {HTMLInputElement} */ (d.querySelector('#c-amount'));
  const keep = /** @type {HTMLElement} */ (d.querySelector('#c-keep'));
  const refresh = () => {
    const a = Number(amountEl.value.replace(',', '.')); const total = Number.isFinite(a) && a > 0 ? money(Math.round(a * count * 100) / 100) : '';
    /** @type {HTMLElement} */ (d.querySelector('#c-save')).textContent = total ? `${t('sc.save')} ${total}` : t('sc.save');
    keep.hidden = !(sc.amount && a > 0 && a !== sc.amount);
  };
  amountEl.addEventListener('input', refresh);
  keep.addEventListener('click', () => keep.setAttribute('aria-pressed', String(keep.getAttribute('aria-pressed') !== 'true')));
  segmented(/** @type {HTMLElement} */ (d.querySelector('#c-count')), (v) => { count = Number(v); refresh(); });
  refresh();
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    try {
      const { added } = useShortcut(localStorage, sc, { amount: amountEl.value.replace(',', '.'), count, date: val(d, 'c-date'), rememberPrice: keep.getAttribute('aria-pressed') === 'true' });
      closeSheet(d); onDone();
      toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { deleteMany(localStorage, added.map((x) => x.id)); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
  setTimeout(() => { amountEl.focus(); amountEl.select(); }, 50);
}

/** Create or edit a shortcut. `prefill` can come from an existing entry. @param {{sc?:any, prefill?:any, demo:boolean, onDone:()=>void}} o */
export function openShortcutEditor({ sc, prefill, demo, onDone }) {
  if (demo) { toast(t('ed.demo')); return; }
  const L = getLang(), d = sheet(), cats = readCategories(localStorage);
  const base = sc || prefill || {};
  let type = base.type || 'expense', cat = base.category || cats[type][0][0], count = base.count || 1;
  const chips = () => cats[type].map((r) => `<button type="button" class="chip" data-v="${esc(r[0])}" aria-pressed="${r[0] === cat}">${esc(categoryLabel(cats, type, r[0], L))}</button>`).join('');
  d.innerHTML = `<form class="stack" novalidate>${head(sc ? t('sc.edit') : t('sc.create'))}
    <div class="field"><label for="s-name">${esc(t('sc.name'))}</label><input class="input" id="s-name" maxlength="24" value="${esc(base.label || '')}" autocomplete="off"></div>
    <div class="field"><span class="label" id="l-st">${esc(t('ed.type'))}</span><div class="seg" id="s-type" role="group" aria-labelledby="l-st"><button type="button" data-value="expense" aria-pressed="${type === 'expense'}">${esc(t('home.expense'))}</button><button type="button" data-value="income" aria-pressed="${type === 'income'}">${esc(t('home.income'))}</button></div></div>
    <div class="field"><span class="label" id="l-sc">${esc(t('ed.cat'))}</span><div class="chips" id="s-cats" role="group" aria-labelledby="l-sc">${chips()}</div></div>
    <div class="field"><label for="s-price">${esc(t('sc.price'))}</label><div class="input-money"><span>$</span><input class="input" id="s-price" inputmode="decimal" value="${base.amount ?? ''}"></div></div>
    <div class="field"><span class="label" id="l-sn">${esc(t('sc.count'))}</span><div class="seg" id="s-count" role="group" aria-labelledby="l-sn">${[1, 2, 3].map((n) => `<button type="button" data-value="${n}" aria-pressed="${n === count}">× ${n}</button>`).join('')}</div></div>
    <button class="btn btn-primary btn-block" type="submit">${esc(t('ed.save'))}</button>
    ${sc ? `<button class="btn btn-danger btn-block" type="button" id="s-del">${esc(t('sc.delete'))}</button>` : ''}</form>`;
  const catsEl = /** @type {HTMLElement} */ (d.querySelector('#s-cats'));
  catsEl.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('.chip'); if (b) { cat = /** @type {HTMLElement} */ (b).dataset.v || ''; catsEl.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === b))); } });
  segmented(/** @type {HTMLElement} */ (d.querySelector('#s-type')), (v) => { type = v; cat = cats[type][0][0]; catsEl.innerHTML = chips(); });
  segmented(/** @type {HTMLElement} */ (d.querySelector('#s-count')), (v) => { count = Number(v); });
  /** @type {HTMLFormElement} */ (d.querySelector('form')).addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = { label: val(d, 's-name'), type, category: cat, amount: val(d, 's-price'), count };
    try { if (sc) updateShortcut(localStorage, sc.id, f); else addShortcut(localStorage, f); closeSheet(d); onDone(); toast(t('ed.saved')); } catch (e) { fail(e); }
  });
  d.querySelector('#s-del')?.addEventListener('click', () => {
    try {
      const { gone } = removeShortcut(localStorage, sc.id); closeSheet(d); onDone();
      toast(t('sc.deleted'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { restoreShortcut(localStorage, gone); onDone(); toast(t('ed.restored')); } catch (e) { fail(e); } } });
    } catch (e) { fail(e); }
  });
  openSheet(d);
  setTimeout(() => /** @type {HTMLElement|null} */ (d.querySelector('#s-name'))?.focus(), 50);
}

/** Settings > Shortcuts page body. @param {{data:any, lang:string}} c */
export function renderShortcutManage({ data, lang }) {
  const cats = readCategories(localStorage); const list = data.shortcuts || [];
  const rows = list.map((s, i) => `<div class="row split"><button class="row-hit" data-edit="${esc(s.id)}"><span class="row-icon accent">${icon('bolt')}</span><span class="row-main"><span class="row-title">${esc(s.label)}</span><br><span class="row-sub">${s.amount ? esc(money(s.amount)) : '—'}${s.count > 1 ? ' × ' + s.count : ''} · ${esc(categoryLabel(cats, s.type, s.category, lang))}</span></span></button>
    <button class="btn btn-ghost btn-icon row-act" data-mv="-1:${esc(s.id)}" aria-label="${esc(t('sc.up', lang))}: ${esc(s.label)}"${i === 0 ? ' disabled' : ''}>${icon('up')}</button><button class="btn btn-ghost btn-icon row-act" style="margin-left:calc(var(--s-2)*-1)" data-mv="1:${esc(s.id)}" aria-label="${esc(t('sc.down', lang))}: ${esc(s.label)}"${i === list.length - 1 ? ' disabled' : ''}>${icon('down')}</button></div>`).join('');
  return `<div class="stack-lg"><button class="btn btn-primary btn-block" id="sc-new">${icon('plus', 'i-sm')}${esc(t('sc.create', lang))}</button>${list.length ? `<div class="list">${rows}</div><p class="t-footnote muted">${esc(t('sc.hint', lang))}</p>` : `<div class="card state"><p class="t-sub muted">${esc(t('sc.empty.sub', lang))}</p></div>`}</div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireShortcutManage({ data, demo, rerender }) {
  document.getElementById('sc-new')?.addEventListener('click', () => openShortcutEditor({ demo, onDone: rerender }));
  document.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => { const sc = (data.shortcuts || []).find((x) => x.id === /** @type {HTMLElement} */ (b).dataset.edit); if (sc) openShortcutEditor({ sc, demo, onDone: rerender }); }));
  document.querySelectorAll('[data-mv]').forEach((b) => b.addEventListener('click', () => {
    if (demo) { toast(t('ed.demo')); return; }
    const [dir, id] = /** @type {string} */ (/** @type {HTMLElement} */ (b).dataset.mv).split(':');
    try { moveShortcut(localStorage, id, dir === '-1' ? -1 : 1); rerender(); } catch (e) { fail(e); }
  }));
}
