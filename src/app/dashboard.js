// @ts-check
// Home dashboard. Pure rendering: takes data in, returns HTML out. Never writes anything.
import { icon } from '../ui/icons.js';
import { t } from './i18n.js';
import { money, hours, dayLabel, weekdayShort, shortDate, esc } from './format.js';
import { shortcutGrid } from './shortcuts.js';
import { readCategories, categoryLabel } from '../data/store.js';
import { addDays, pendingPastDays, todayKey, dayInfo, weekSummary, monthSummary, recentItems, upcomingRecurring, backupAgeDays, hasData } from '../data/stats.js';

export { esc };
const BADGE = { worked: 'success', planned: 'info', off: 'neutral', leave: 'warning', swapped: 'info' };

/** @param {string} title @param {string} body */
const section = (title, body) => `<section class="stack" aria-label="${esc(title)}"><h2 class="t-label">${esc(title)}</h2>${body}</section>`;

/** The details of one day (same markup for the Today card and the week-strip panel). @param {any} i @param {string} L */
function dayBody(i, L) {
  const place = i.place ? `<p class="t-sub muted">${esc(i.place)}${i.time ? ' · ' + esc(i.time) : ''}</p>` : '';
  const hrs = i.status === 'worked' || i.status === 'planned' ? `<p class="t-sub muted num">${hours(i.hours)} ${esc(t('home.hours', L))}</p>` : '';
  const note = i.note ? `<p class="t-sub">${esc(i.note)}</p>` : '';
  return `${place}${hrs}${note}<div class="between"><span class="t-sub muted">${esc(t('home.tips', L))}</span><span class="t-headline num">${esc(money(i.tips))}</span></div>`;
}
/** @param {any} d @param {string} today @param {string} L */
function todayCard(d, today, L) {
  const i = dayInfo(d.work, d.rules, today);
  return `<div class="card stack" id="today-card"><div class="between"><span class="t-headline">${esc(dayLabel(today, L))}</span><span class="badge badge-${BADGE[i.status] || 'neutral'}">${esc(t('st.' + i.status, L))}</span></div>${dayBody(i, L)}
    ${i.status === 'planned' ? `<button class="btn btn-primary btn-block" id="confirm-today">${icon('check', 'i-sm')}${esc(t('cf.one', L))}</button>` : ''}
    <button class="btn btn-tonal btn-block" id="tip-today">${icon('plus', 'i-sm')}${esc(t('home.addtip', L))}</button></div>`;
}
/** Details of the day tapped in the week strip. @param {any} d @param {string} day @param {string} today @param {string} L */
function dayPanel(d, day, today, L) {
  const i = dayInfo(d.work, d.rules, day);
  return `<div class="card-flat stack" id="day-panel"><div class="between"><span class="t-headline">${esc(dayLabel(day, L))}</span><span class="badge badge-${BADGE[i.status] || 'neutral'}">${esc(t('st.' + i.status, L))}</span></div>${dayBody(i, L)}
    <div class="stack">${i.status === 'planned' && day < today ? `<button class="btn btn-primary btn-block" id="sel-confirm">${icon('check', 'i-sm')}${esc(t('cf.one', L))}</button>` : ''}<button class="btn btn-secondary btn-block" id="sel-edit">${icon('edit', 'i-sm')}${esc(t('ed.edit', L))}</button></div></div>`;
}
/** @param {any} d @param {string} today @param {string} L */
function pendingCard(d, today, L) {
  const p = pendingPastDays(d.work, d.rules, today, 14);
  if (!p.length) return '';
  return `<div class="card stack"><div class="between"><div class="row-main"><p class="t-headline">${esc(t('cf.pending', L).replace('{n}', String(p.length)))}</p><p class="t-sub muted">${esc(t('cf.pending.sub', L))}</p></div><span class="row-icon accent">${icon('calendar')}</span></div>
    <button class="btn btn-primary btn-block" id="confirm-all">${icon('check', 'i-sm')}${esc(t('cf.all', L))}</button>
    <a class="btn btn-ghost btn-block" href="#/work">${esc(t('cf.review', L))}</a></div>`;
}
/** @param {any} d @param {string} today @param {string} L */
function balanceCard(d, today, L) {
  const s = monthSummary(d.items, today.slice(0, 7));
  return `<div class="card-accent stack"><span class="t-label" style="color:inherit">${esc(t('home.balance', L))}</span>
    <span class="t-number" data-count="${s.balance}">${esc(money(s.balance))}</span>
    <div class="grid-2 t-footnote"><span>${esc(t('home.income', L))} <b class="num">${esc(money(s.income))}</b></span><span>${esc(t('home.expense', L))} <b class="num">${esc(money(s.expense))}</b></span></div>
    <span class="t-footnote">${esc(t('home.carry', L))} <span class="num">${esc(money(s.opening))}</span></span></div>`;
}
/** @param {any} d @param {string} today @param {string} L @param {number} off weeks away from this week @param {string} sel selected day or '' */
function weekCard(d, today, L, off, sel) {
  const w = weekSummary(d.work, d.rules, addDays(today, 7 * off));
  const cells = w.days.map((x) => {
    const mark = x.status === 'worked' ? '<i class="dot"></i>' : x.status === 'planned' ? '<i class="dot ring"></i>' : x.status === 'leave' ? '<i class="dot sq"></i>' : '';
    return `<button class="cal-d cal-w${x.day === today ? ' today' : ''}" data-day="${x.day}" aria-pressed="${x.day === sel}" aria-label="${esc(dayLabel(x.day, L) + ': ' + t('st.' + x.status, L))}"><span class="t-caption muted">${esc(weekdayShort(x.day, L))}</span><span class="t-footnote num">${Number(x.day.slice(8))}</span>${mark}</button>`;
  }).join('');
  const range = `${shortDate(w.days[0].day, L)} – ${shortDate(w.days[6].day, L)}`;
  const nav = `<div class="between"><button class="btn btn-secondary btn-icon" id="hw-prev" aria-label="${esc(t('wk.prev', L))}">${icon('back')}</button><button class="btn btn-ghost btn-sm" id="hw-now"${off === 0 ? ' aria-current="date"' : ''} aria-live="polite">${esc(off === 0 ? t('wk.thisweek', L) + ' · ' + range : range)}</button><button class="btn btn-secondary btn-icon" id="hw-next" aria-label="${esc(t('wk.next', L))}">${icon('chevron')}</button></div>`;
  return `<div class="card stack">${nav}<div class="grid-2">
    <div class="stat"><span class="t-label">${esc(t('home.worked', L))}</span><span class="t-title2 num">${hours(w.workedHours)} <span class="t-sub muted">${esc(t('home.hours', L))}</span></span><span class="t-footnote muted num">${esc(t('home.planned', L))} ${hours(w.plannedHours)}</span></div>
    <div class="stat"><span class="t-label">${esc(t('home.tips', L))}</span><span class="t-title2 num">${esc(money(w.tips))}</span><span class="t-footnote muted">${esc(t('home.tipsnote', L))}</span></div></div>
    <div class="cal" style="grid-template-columns:repeat(7,1fr)">${cells}</div>${sel && sel !== today && w.days.some((x) => x.day === sel) ? dayPanel(d, sel, today, L) : ''}</div>`;
}
/** @param {any} d @param {string} L */
function recentList(d, L) {
  const cats = readCategories(globalThis.localStorage);
  const rows = recentItems(d.items, 5);
  if (!rows.length) return `<div class="card"><p class="t-sub muted">${esc(t('home.nothing', L))}</p></div>`;
  return `<div class="list">${rows.map((r) => `<div class="row"><span class="row-icon">${icon(r.type === 'income' ? 'download' : 'upload')}</span><span class="row-main"><span class="row-title">${esc(categoryLabel(cats, r.type, r.category, L))}</span><br><span class="row-sub">${esc(dayLabel(r.date, L))}</span></span><span class="row-trail ${r.type === 'income' ? 'pos' : 'neg'}">${esc(money(r.type === 'income' ? r.amount : -r.amount, { sign: true }))}</span></div>`).join('')}</div>`;
}
/** @param {any} d @param {string} today @param {string} L */
function upcomingList(d, today, L) {
  const rows = upcomingRecurring(d.recurring, today, 14);
  if (!rows.length) return '';
  return section(t('home.upcoming', L), `<div class="list">${rows.map((r) => `<div class="row"><span class="row-icon">${icon('repeat')}</span><span class="row-main"><span class="row-title">${esc(categoryLabel(readCategories(globalThis.localStorage), 'expense', r.category, L))}</span><br><span class="row-sub">${esc(r.daysLeft === 0 ? t('home.todaydue', L) : t('home.in', L).replace('{n}', String(r.daysLeft)))} · ${esc(dayLabel(r.due, L))}</span></span><span class="row-trail num">${esc(money(r.amount))}</span></div>`).join('')}</div>`);
}
/** @param {any} d @param {string} L @param {Date} now */
function backupCard(d, L, now) {
  const age = backupAgeDays(d.lastBackup, now);
  if (age !== null && age < 7) return '';
  const msg = age === null ? t('bk.never', L) : t('bk.days', L).replace('{n}', String(age));
  return `<div class="card-flat"><div class="between"><div class="row-main"><p class="t-headline">${esc(t('bk.title', L))}</p><p class="t-sub muted">${esc(msg)}</p></div><span class="row-icon accent">${icon('shield')}</span></div></div>`;
}

/** The whole Home page body (below the header). @param {{data:any, demo:boolean, lang:string, now?:Date, weekOffset?:number, selectedDay?:string}} o */
export function renderHome({ data, demo, lang, now = new Date(), weekOffset = 0, selectedDay = '' }) {
  const L = lang, today = todayKey(now);
  if (!demo && !hasData(data)) {
    return `<div class="card state"><div class="state-icon">${icon('shield', 'i-lg')}</div><p class="t-headline">${esc(t('empty.title', L))}</p><p class="t-sub muted">${esc(t('empty.sub', L))}</p><button class="btn btn-primary" id="demo-on">${esc(t('empty.demo', L))}</button></div>`;
  }
  const banner = demo ? `<div class="card-flat between"><span class="t-sub">${esc(t('demo.banner', L))}</span><button class="btn btn-ghost btn-sm" id="demo-off">${esc(t('demo.exit', L))}</button></div>` : '';
  return `<div class="stack-lg">${banner}${section(t('home.today', L), todayCard(data, today, L))}${section(t('sc.title', L), shortcutGrid(data.shortcuts || [], L))}${pendingCard(data, today, L)}${balanceCard(data, today, L)}${section(t('home.week', L), weekCard(data, today, L, weekOffset, selectedDay))}${section(t('home.recent', L), recentList(data, L))}${upcomingList(data, today, L)}${backupCard(data, L, now)}</div>`;
}
