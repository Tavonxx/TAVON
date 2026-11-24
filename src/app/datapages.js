// @ts-check
// Work hours page and Finance page.
import { icon } from '../ui/icons.js';
import { segmented } from '../ui/ui.js';
import { t } from './i18n.js';
import { esc } from './dashboard.js';
import { money, hours, shortDate, dayLabel, weekdayShort, monthLabel } from './format.js';
import { todayKey, weekStartKey, addDays, weekSummary, monthWork, monthSummary, filterItems, nextMonth, frequentTemplates, itemsByDay, pendingPastDays } from '../data/stats.js';
import { readCategories, categoryLabel, addItem } from '../data/store.js';
import { openWorkEditor, openMoneyEditor, confirmDays } from './editors.js';
import { toast } from '../ui/ui.js';
import { deleteQuietly } from '../data/store.js';

const BADGE = { worked: 'success', planned: 'info', off: 'neutral', leave: 'warning', swapped: 'info' };
const prevMonth = (m) => { const [y, mo] = m.split('-').map(Number); return mo === 1 ? `${y - 1}-12` : `${y}-${String(mo - 1).padStart(2, '0')}`; };
const navBar = (label, id) => `<div class="between"><button class="btn btn-secondary btn-icon" id="${id}-prev" aria-label="${esc(t('wk.prev'))}">${icon('back')}</button><span class="t-headline" aria-live="polite">${esc(label)}</span><button class="btn btn-secondary btn-icon" id="${id}-next" aria-label="${esc(t('wk.next'))}">${icon('chevron')}</button></div>`;
const mark = (s) => (s === 'worked' ? '<i class="dot"></i>' : s === 'planned' ? '<i class="dot ring"></i>' : s === 'leave' ? '<i class="dot sq"></i>' : '');

/* ---------------- Work hours ---------------- */
const W = { view: 'week', week: '', month: '' };
/** @param {{data:any, lang:string}} c */
export function renderWork({ data, lang }) {
  const today = todayKey(); if (!W.week) W.week = weekStartKey(today); if (!W.month) W.month = today.slice(0, 7);
  const tabs = `<div class="seg" id="wk-view" role="group" aria-label="${esc(t('nav.work'))}"><button data-value="week" aria-pressed="${W.view === 'week'}">${esc(t('wk.week'))}</button><button data-value="month" aria-pressed="${W.view === 'month'}">${esc(t('wk.month'))}</button></div>`;
  if (W.view === 'week') {
    const s = weekSummary(data.work, data.rules, W.week);
    const rows = s.days.map((x) => {
      const pending = x.status === 'planned' && x.day < today;
      return `<div class="row split"><button class="row-hit" data-day="${x.day}"><span class="row-icon${x.day === today ? ' accent' : ''}"><span class="t-footnote">${esc(weekdayShort(x.day, lang))}</span></span><span class="row-main"><span class="row-title">${esc(dayLabel(x.day, lang))}</span><br><span class="row-sub">${esc(x.place || '—')}${x.time ? ' · ' + esc(x.time) : ''}</span></span><span class="row-trail"><span class="stack" style="gap:2px;align-items:flex-end"><span class="badge badge-${BADGE[x.status] || 'neutral'}">${esc(t('st.' + x.status))}</span><span class="t-footnote num">${x.status === 'worked' || x.status === 'planned' ? hours(x.hours) + ' ' + esc(t('home.hours')) : ''}${x.tips ? ' · ' + esc(money(x.tips)) : ''}</span></span>${pending ? '' : icon('chevron', 'i-sm')}</span></button>${pending ? `<button class="btn btn-tonal btn-icon row-act" data-confirm="${x.day}" aria-label="${esc(t('cf.one') + ': ' + dayLabel(x.day, lang))}">${icon('check')}</button>` : ''}</div>`;
    }).join('');
    const pend = pendingPastDays(data.work, data.rules, today, 14);
    return `<div class="stack-lg">${tabs}${navBar(shortDate(W.week, lang) + ' – ' + shortDate(addDays(W.week, 6), lang), 'wk')}
      <div class="card"><div class="grid-2"><div class="stat"><span class="t-label">${esc(t('home.worked'))}</span><span class="t-title2 num">${hours(s.workedHours)}</span><span class="t-footnote muted num">${esc(t('home.planned'))} ${hours(s.plannedHours)}</span></div><div class="stat"><span class="t-label">${esc(t('home.tips'))}</span><span class="t-title2 num">${esc(money(s.tips))}</span></div></div></div>
      ${pend.length ? `<button class="btn btn-primary btn-block" id="wk-confirm-all">${icon('check', 'i-sm')}${esc(t('cf.all'))} (${pend.length})</button>` : ''}<div class="list">${rows}</div><button class="btn btn-ghost btn-block" id="wk-today">${esc(t('wk.thisweek'))}</button></div>`;
  }
  const m = monthWork(data.work, data.rules, W.month);
  const [y, mo] = W.month.split('-').map(Number); const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
  const head = m.days.slice(0, 7).length ? addDays(weekStartKey(W.month + '-01'), 0) : '';
  const heads = Array.from({ length: 7 }, (_, i) => `<div class="cal-h">${esc(weekdayShort(addDays(head, i), lang))}</div>`).join('');
  const blanks = '<div></div>'.repeat(lead);
  const cells = m.days.map((x) => `<button class="cal-d${x.day === today ? ' today' : ''}" data-day="${x.day}" aria-label="${esc(dayLabel(x.day, lang) + ': ' + t('st.' + x.status))}">${Number(x.day.slice(8))}${mark(x.status)}</button>`).join('');
  return `<div class="stack-lg">${tabs}${navBar(monthLabel(W.month, lang), 'wk')}
    <div class="card"><div class="grid-2"><div class="stat"><span class="t-label">${esc(t('wk.days'))}</span><span class="t-title2 num">${m.workedDays}</span><span class="t-footnote muted num">${esc(t('home.planned'))} ${m.plannedDays}</span></div>
    <div class="stat"><span class="t-label">${esc(t('home.worked'))}</span><span class="t-title2 num">${hours(m.workedHours)} <span class="t-sub muted">${esc(t('home.hours'))}</span></span><span class="t-footnote muted num">${esc(t('home.planned'))} ${hours(m.plannedHours)}</span></div></div>
    <div class="stat" style="margin-top:var(--s-3)"><span class="t-label">${esc(t('home.tips'))}</span><span class="t-title2 num">${esc(money(m.tips))}</span></div></div>
    <div class="card"><div class="cal">${heads}${blanks}${cells}</div></div><button class="btn btn-ghost btn-block" id="wk-today">${esc(t('wk.thismonth'))}</button></div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireWork({ data, demo, rerender }) {
  const seg = document.getElementById('wk-view'); if (seg) segmented(seg, (v) => { W.view = v; rerender(); });
  const step = (dir) => { if (W.view === 'week') W.week = addDays(W.week, 7 * dir); else W.month = dir > 0 ? nextMonth(W.month) : prevMonth(W.month); rerender(); };
  document.getElementById('wk-prev')?.addEventListener('click', () => step(-1));
  document.getElementById('wk-next')?.addEventListener('click', () => step(1));
  document.getElementById('wk-today')?.addEventListener('click', () => { W.week = ''; W.month = ''; rerender(); });
  document.querySelectorAll('[data-day]').forEach((b) => b.addEventListener('click', () => openWorkEditor({ day: /** @type {HTMLElement} */ (b).dataset.day || '', data, demo, onDone: rerender })));
  document.querySelectorAll('[data-confirm]').forEach((b) => b.addEventListener('click', () => { const day = /** @type {HTMLElement} */ (b).dataset.confirm; confirmDays({ days: pendingPastDays(data.work, data.rules, todayKey(), 400).filter((x) => x.day === day), data, demo, onDone: rerender }); }));
  document.getElementById('wk-confirm-all')?.addEventListener('click', () => confirmDays({ days: pendingPastDays(data.work, data.rules, todayKey(), 14), data, demo, onDone: rerender }));
}

/* ---------------- Finance ---------------- */
const M = { view: 'list', month: '', day: '', q: '', type: '', category: '' };
const cap = (n) => (n > 9 ? '9+' : String(n));
/** @param {any} r @param {(tp:string,c:string)=>string} label @param {string} lang */
const itemRow = (r, label, lang) => `<button class="row" data-id="${esc(r.id)}"><span class="row-icon">${icon(r.type === 'income' ? 'download' : 'upload')}</span><span class="row-main"><span class="row-title">${esc(label(r.type, r.category))}</span><br><span class="row-sub">${esc(dayLabel(r.date, lang))}${r.note ? ' · ' + esc(r.note) : ''}</span></span><span class="row-trail ${r.type === 'income' ? 'pos' : 'neg'}">${esc(money(r.type === 'income' ? r.amount : -r.amount, { sign: true }))}</span></button>`;
/** @param {{data:any, lang:string}} c */
export function renderMoney({ data, lang }) {
  const today = todayKey(); if (!M.month) M.month = today.slice(0, 7);
  const cats = readCategories(localStorage);
  const label = (tp, code) => categoryLabel(cats, tp, code, lang);
  const s = monthSummary(data.items, M.month);
  const tabs = `<div class="seg" id="mn-view" role="group" aria-label="${esc(t('nav.money'))}"><button data-value="list" aria-pressed="${M.view === 'list'}">${esc(t('mn.list'))}</button><button data-value="cal" aria-pressed="${M.view === 'cal'}">${esc(t('mn.cal'))}</button></div>`;
  const quick = frequentTemplates(data.items, today, 4);
  const quickHtml = quick.length ? `<div class="stack" style="gap:var(--s-1)"><span class="t-footnote muted">${esc(t('mn.quick'))} · ${esc(t('mn.quick.sub'))}</span><div class="chips">${quick.map((q, i) => `<button class="chip" data-quick="${i}">${esc(label(q.type, q.category))} ${esc(money(q.amount))}</button>`).join('')}</div></div>` : '';
  const top = `${navBar(monthLabel(M.month, lang), 'mn')}
    <div class="card-accent stack"><span class="t-label" style="color:inherit">${esc(t('home.balance'))}</span><span class="t-number">${esc(money(s.balance))}</span>
    <div class="grid-2 t-footnote"><span>${esc(t('home.income'))} <b class="num">${esc(money(s.income))}</b></span><span>${esc(t('home.expense'))} <b class="num">${esc(money(s.expense))}</b></span></div>
    <span class="t-footnote">${esc(t('home.carry'))} <span class="num">${esc(money(s.opening))}</span></span></div>
    <button class="btn btn-primary btn-block" id="mn-add">${icon('plus', 'i-sm')}${esc(t('mn.add'))}</button>${quickHtml}`;
  if (M.view === 'cal') {
    const by = itemsByDay(data.items, M.month);
    const [y, mo] = M.month.split('-').map(Number); const n = new Date(y, mo, 0).getDate(); const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7;
    const mon = weekStartKey(M.month + '-01');
    const heads = Array.from({ length: 7 }, (_, i) => `<div class="cal-h">${esc(weekdayShort(addDays(mon, i), lang))}</div>`).join('');
    const cells = Array.from({ length: n }, (_, i) => {
      const day = `${M.month}-${String(i + 1).padStart(2, '0')}`, e = by[day];
      const inc = e?.income ? `<span class="cnt"><i></i>${cap(e.income)}</span>` : '', exp = e?.expense ? `<span class="cnt out"><i></i>${cap(e.expense)}</span>` : '';
      const aria = dayLabel(day, lang) + (e ? `: ${e.income ? t('home.income') + ' ' + e.income : ''}${e.income && e.expense ? ', ' : ''}${e.expense ? t('home.expense') + ' ' + e.expense : ''}` : '');
      return `<button class="cal-d cal-m${day === today ? ' today' : ''}" data-d="${day}" aria-pressed="${day === M.day}" aria-label="${esc(aria)}">${i + 1}${inc}${exp}</button>`;
    }).join('');
    const sel = M.day && M.day.startsWith(M.month) ? by[M.day] : null;
    const dayBlock = M.day && M.day.startsWith(M.month) ? `<div class="stack"><div class="between"><span class="t-headline">${esc(dayLabel(M.day, lang))}</span><button class="btn btn-tonal btn-sm" id="mn-day-add">${icon('plus', 'i-sm')}${esc(t('mn.day.add'))}</button></div>${sel ? `<div class="list">${sel.items.map((r) => itemRow(r, label, lang)).join('')}</div>` : `<div class="card"><p class="t-sub muted">${esc(t('mn.day.none'))}</p></div>`}</div>` : '';
    return `<div class="stack-lg">${tabs}${top}<div class="card stack"><div class="cal">${heads}${'<div></div>'.repeat(lead)}${cells}</div><p class="t-footnote muted">${esc(t('mn.legend'))}</p></div>${dayBlock}</div>`;
  }
  const rows = filterItems(data.items, M.month, M, label);
  const allCats = [...cats.income.map((r) => ['income', r]), ...cats.expense.map((r) => ['expense', r])];
  const opts = allCats.filter(([tp]) => !M.type || tp === M.type).map(([, r]) => `<option value="${esc(r[0])}"${r[0] === M.category ? ' selected' : ''}>${esc(lang === 'en' ? r[2] : r[1])}</option>`).join('');
  const list = rows.length ? `<div class="list">${rows.map((r) => itemRow(r, label, lang)).join('')}</div>` : `<div class="card state"><div class="state-icon">${icon('search', 'i-lg')}</div><p class="t-sub muted">${esc(t('mn.none'))}</p></div>`;
  return `<div class="stack-lg">${tabs}${top}
    <div class="stack"><input class="input" id="mn-q" type="search" placeholder="${esc(t('mn.search'))}" aria-label="${esc(t('mn.search'))}" value="${esc(M.q)}" autocomplete="off">
    <div class="cluster" id="mn-type" role="group"><button class="chip" data-value="" aria-pressed="${M.type === ''}">${esc(t('mn.all'))}</button><button class="chip" data-value="income" aria-pressed="${M.type === 'income'}">${esc(t('home.income'))}</button><button class="chip" data-value="expense" aria-pressed="${M.type === 'expense'}">${esc(t('home.expense'))}</button></div>
    <div class="select-wrap"><select class="select" id="mn-cat" aria-label="${esc(t('ed.category'))}"><option value="">${esc(t('mn.allcat'))}</option>${opts}</select></div>
    <span class="t-footnote muted num" aria-live="polite">${rows.length} ${esc(t('mn.entries'))}</span></div>${list}</div>`;
}
/** @param {{data:any, demo:boolean, rerender:()=>void}} c */
export function wireMoney({ data, demo, rerender }) {
  const today = todayKey();
  const step = (dir) => { M.month = dir > 0 ? nextMonth(M.month) : prevMonth(M.month); M.day = ''; rerender(); };
  const seg = document.getElementById('mn-view'); if (seg) segmented(seg, (v) => { M.view = v; if (v === 'cal' && !M.day && today.startsWith(M.month)) M.day = today; rerender(); });
  document.getElementById('mn-prev')?.addEventListener('click', () => step(-1));
  document.getElementById('mn-next')?.addEventListener('click', () => step(1));
  const open = (extra = {}) => openMoneyEditor({ demo, items: data.items, onDone: rerender, ...extra });
  document.getElementById('mn-add')?.addEventListener('click', () => open(M.view === 'cal' && M.day ? { date: M.day } : {}));
  document.getElementById('mn-day-add')?.addEventListener('click', () => open({ date: M.day }));
  document.querySelectorAll('[data-d]').forEach((b) => b.addEventListener('click', () => { M.day = /** @type {HTMLElement} */ (b).dataset.d || ''; rerender(); }));
  const templates = frequentTemplates(data.items, today, 4);
  document.querySelectorAll('[data-quick]').forEach((b) => b.addEventListener('click', () => {
    if (demo) { toast(t('ed.demo')); return; }
    const q = templates[Number(/** @type {HTMLElement} */ (b).dataset.quick)]; if (!q) return;
    try {
      const added = addItem(localStorage, { type: q.type, amount: q.amount, category: q.category, note: q.note, date: M.view === 'cal' && M.day ? M.day : today });
      rerender();
      toast(t('ed.saved'), { action: t('ap.undo'), ms: 5000, onAction: () => { try { deleteQuietly(localStorage, added.id); rerender(); toast(t('ed.restored')); } catch { toast(t('ed.invalid')); } } });
    } catch { toast(t('ed.invalid')); }
  }));
  const q = /** @type {HTMLInputElement|null} */ (document.getElementById('mn-q'));
  q?.addEventListener('input', () => { M.q = q.value; const pos = q.selectionStart; rerender(); const n = /** @type {HTMLInputElement} */ (document.getElementById('mn-q')); n.focus(); n.setSelectionRange(pos, pos); });
  document.querySelectorAll('#mn-type .chip').forEach((b) => b.addEventListener('click', () => { M.type = /** @type {HTMLElement} */ (b).dataset.value || ''; M.category = ''; rerender(); }));
  document.getElementById('mn-cat')?.addEventListener('change', (e) => { M.category = /** @type {HTMLSelectElement} */ (e.target).value; rerender(); });
  document.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => {
    const item = (Array.isArray(data.items) ? data.items : []).find((x) => x && x.id === /** @type {HTMLElement} */ (b).dataset.id);
    if (item) open({ item });
  }));
}
export { openWorkEditor, openMoneyEditor };
