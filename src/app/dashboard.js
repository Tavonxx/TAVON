// @ts-check
// Home dashboard. Pure rendering: takes data in, returns HTML out. Never writes anything.
import { icon } from '../ui/icons.js';
import { t } from './i18n.js';
import { money, hours, dayLabel, weekdayShort, shortDate, periodLabel, esc } from './format.js';
import { shortcutGrid } from './shortcuts.js';
import { ringDial } from '../ui/dial.js';
import { readCategories, categoryLabel } from '../data/store.js';
import { addDays, pendingPastDays, todayKey, dayInfo, weekSummary, monthSummary, recentItems, upcomingRecurring, backupAgeDays, hasData, ringStats, nextWorkDay } from '../data/stats.js';

export { esc };
const BADGE = { worked: 'success', planned: 'info', off: 'neutral', leave: 'warning', swapped: 'info' };

/** @param {string} title @param {string} body */
const section = (title, body) => `<section class="stack" aria-label="${esc(title)}"><h2 class="t-label">${esc(title)}</h2>${body}</section>`;

/** The details of one day (same markup for the Today card and the week-strip panel). @param {any} i @param {string} L */
function dayBody(i, L, withHours = true) {
  const place = i.place ? `<p class="t-sub muted">${esc(i.place)}${i.time ? ' · ' + esc(i.time) : ''}</p>` : '';
  const hrs = !withHours ? '' : i.status === 'worked' || i.status === 'planned' ? `<p class="t-sub muted num">${hours(i.hours)} ${esc(t('home.hours', L))}</p>` : '';
  const note = i.note ? `<p class="t-sub">${esc(i.note)}</p>` : '';
  return `${place}${hrs}${note}<div class="between"><span class="t-sub muted">${esc(t('home.tips', L))}</span><span class="t-headline num">${esc(money(i.tips))}</span></div>`;
}
/** Today as a dial: rings + the three numbers written out + place/tips + the two actions. @param {any} d @param {string} today @param {string} L */
function todayCard(d, today, L) {
  const i = dayInfo(d.work, d.rules, today), r = ringStats(d.work, d.rules, today);
  const h = (n) => hours(n), plabel = periodLabel(r.period.start, r.period.end, L);
  const center = i.status === 'off' || i.status === 'leave' || i.status === 'swapped' ? '–' : h(r.today.done || r.today.target);
  const sub = i.status === 'worked' ? t('dial.done', L) : i.status === 'planned' ? t('dial.plan', L) : t('st.' + i.status, L);
  const aria = t('dial.aria', L).replace('{a}', h(r.today.done)).replace('{b}', h(r.today.target)).replace('{p}', plabel).replace('{c}', h(r.hours.done)).replace('{d}', h(r.hours.total)).replace('{e}', String(r.days.done)).replace('{f}', String(r.days.total));
  const dial = ringDial({ rings: [{ done: r.today.done, total: r.today.target }, { done: r.hours.done, total: r.hours.total }, { done: r.days.done, total: r.days.total }], center: esc(center), sub: esc(sub), label: aria });
  const leg = (k, label, a, b, unit) => `<div><span class="v num">${esc(a)} / ${esc(b)}</span><span class="l"><i class="k ${k}"></i>${esc(label)} ${esc(unit)}</span></div>`;
  const legend = `<div class="legend">${leg('k1', t('dial.today', L), h(r.today.done), h(r.today.target), t('home.hours', L))}${leg('k2', plabel, h(r.hours.done), h(r.hours.total), t('home.hours', L))}${leg('k3', t('dial.days', L), String(r.days.done), String(r.days.total), t('dial.unit.d', L))}</div>`;
  const rest = i.status === 'off' || i.status === 'leave' || i.status === 'swapped';
  const nx = rest ? nextWorkDay(d.work, d.rules, today) : null;
  const next = !rest ? '' : `<div class="card-flat stack" id="next-work"><span class="t-label">${esc(t('dial.next', L))}</span>${nx ? `<p class="t-headline">${esc(dayLabel(nx.day, L))}</p><p class="t-sub muted">${esc(nx.place)}${nx.time ? ' · ' + esc(nx.time) : ''} · <span class="num">${hours(nx.hours)}</span> ${esc(t('home.hours', L))}</p>` : `<p class="t-sub muted">${esc(t('dial.nonext', L))}</p>`}</div>`;
  return `<div class="card stack" id="today-card"><div class="between"><span class="t-headline">${esc(dayLabel(today, L))}</span><span class="badge badge-${BADGE[i.status] || 'neutral'}">${esc(t('st.' + i.status, L))}</span></div>${dial}${legend}${next}${dayBody(i, L, false)}
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
  return `<div class="card bal"><div class="stack" style="gap:var(--s-1)"><span class="t-label">${esc(t('home.balance', L))}</span>
    <span class="t-footnote muted">${esc(t('home.income', L))} <b class="num">${esc(money(s.income))}</b> · ${esc(t('home.expense', L))} <b class="num">${esc(money(s.expense))}</b></span></div>
    <span class="t-title2 num" data-count="${s.balance}">${esc(money(s.balance))}</span></div>`;
}
/** @param {any} d @param {string} today @param {string} L @param {number} off weeks away from this week @param {string} sel selected day or '' */
function weekCard(d, today, L, off, sel) {
  const w = weekSummary(d.work, d.rules, addDays(today, 7 * off));
  const cells = w.days.map((x) => {
    const mark = x.status === 'worked' ? '<i class="dot"></i>' : x.status === 'planned' ? '<i class="dot ring"></i>' : x.status === 'leave' ? '<i class="dot sq"></i>' : '';
    return `<button class="cal-d cal-w${x.day === today ? ' today' : ''}" data-day="${x.day}" aria-pressed="${x.day === sel}" aria-label="${esc(dayLabel(x.day, L) + ': ' + t('st.' + x.status, L))}"><span class="t-caption muted">${esc(weekdayShort(x.day, L))}</span><span class="t-footnote num">${Number(x.day.slice(8))}</span>${mark}</button>`;
  }).join('');
  const range = `${shortDate(w.days[0].day, L)} – ${shortDate(w.days[6].day, L)}`;
  const nav = `<div class="between"><button class="btn btn-secondary btn-icon" id="hw-prev" aria-label="${esc(t('wk.prev', L))}">${icon('back')}</button><button class="btn btn-ghost btn-sm" id="hw-now"${off === 0 ? ' aria-current="date" aria-haspopup="dialog"' : ''} aria-label="${esc((off === 0 ? t('dial.open', L) : t('wk.thisweek', L)) + ': ' + range)}">${esc(range)}</button><button class="btn btn-secondary btn-icon" id="hw-next" aria-label="${esc(t('wk.next', L))}">${icon('chevron')}</button></div>`;
  const sum = `<p class="t-footnote muted num">${hours(w.workedHours)} ${esc(t('home.hours', L))} ${esc(t('home.worked', L))} · ${esc(t('home.planned', L))} ${hours(w.plannedHours)} · ${esc(t('home.tips', L))} ${esc(money(w.tips))}</p>`;
  return `<div class="card stack">${nav}
    <div class="cal" style="grid-template-columns:repeat(7,1fr)">${cells}</div>${sum}${sel && sel !== today && w.days.some((x) => x.day === sel) ? dayPanel(d, sel, today, L) : ''}</div>`;
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
  return `<a class="card-flat" href="#/settings/data" style="display:block;text-decoration:none;color:inherit"><div class="between"><div class="row-main"><p class="t-headline">${esc(t('bk.title', L))}</p><p class="t-sub muted">${esc(msg)}</p></div><span class="row-icon accent">${icon('shield')}</span></div></a>`;
}

/** The whole Home page body (below the header). @param {{data:any, demo:boolean, lang:string, now?:Date, weekOffset?:number, selectedDay?:string}} o */
export function renderHome({ data, demo, lang, now = new Date(), weekOffset = 0, selectedDay = '' }) {
  const L = lang, today = todayKey(now);
  if (!demo && !hasData(data)) {
    return `<div class="card state"><div class="state-icon">${icon('shield', 'i-lg')}</div><p class="t-headline">${esc(t('empty.title', L))}</p><p class="t-sub muted">${esc(t('empty.sub', L))}</p><button class="btn btn-primary" id="demo-on">${esc(t('empty.demo', L))}</button></div>`;
  }
  const banner = demo ? `<div class="card-flat between"><span class="t-sub">${esc(t('demo.banner', L))}</span><button class="btn btn-ghost btn-sm" id="demo-off">${esc(t('demo.exit', L))}</button></div>` : '';
  return `<div class="stack-lg">${banner}${pendingCard(data, today, L)}${backupCard(data, L, now)}${section(t('home.today', L), todayCard(data, today, L))}${section(t('sc.title', L), shortcutGrid(data.shortcuts || [], L))}${balanceCard(data, today, L)}${section(t('home.week', L), weekCard(data, today, L, weekOffset, selectedDay))}<details class="more"><summary>${icon('chevron', 'i-sm')}${esc(t('home.more', L))}</summary><div class="stack-lg" style="padding-top:var(--s-2)">${section(t('home.recent', L), recentList(data, L))}${upcomingList(data, today, L)}</div></details></div>`;
}

/** Body of the "this week" sheet opened from the dial. @param {any} d @param {string} today @param {string} L */
export function weekSheetHtml(d, shown, today, L) {
  const w = weekSummary(d.work, d.rules, shown);
  const rows = w.days.map((x) => `<div class="row"><span class="row-main"><span class="row-title">${esc(dayLabel(x.day, L))}${x.day === today ? ' · ' + esc(t('dial.today', L)) : ''}</span><br><span class="t-sub muted">${esc(x.place || '')}${x.time ? ' · ' + esc(x.time) : ''}</span></span><span class="stack" style="gap:2px;text-align:right"><span class="badge badge-${BADGE[x.status] || 'neutral'}">${esc(t('st.' + x.status, L))}</span>${x.status === 'worked' || x.status === 'planned' ? `<span class="t-sub num">${hours(x.hours)} ${esc(t('home.hours', L))}</span>` : ''}</span></div>`).join('');
  return `<div class="between"><h2 class="t-title3" id="wk-t">${esc(shown === today ? t('wk.thisweek', L) : shortDate(w.days[0].day, L) + ' – ' + shortDate(w.days[6].day, L))}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close', L))}">${icon('close')}</button></div>
    <p class="t-footnote muted num">${hours(w.workedHours)} ${esc(t('home.hours', L))} ${esc(t('home.worked', L))} · ${esc(t('home.planned', L))} ${hours(w.plannedHours)} · ${esc(t('home.tips', L))} ${esc(money(w.tips))}</p>
    <div class="list">${rows}</div>`;
}
