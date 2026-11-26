// @ts-check
import { spriteMarkup, icon } from '../ui/icons.js';
import { load, save, apply, applyRest, watchSystem, DEFAULTS } from '../ui/appearance.js';
import { openSheet, closeSheet, toast, segmented, switchControl, runFlash } from '../ui/ui.js';
import { parseRoute } from './router.js';
import { money } from './format.js';
import { t, getLang, setLang } from './i18n.js';
import { renderHome, weekSheetHtml } from './dashboard.js';
import { readDashboardData } from '../data/stats.js';
import { demoData } from './demo.js';
import { renderWork, wireWork, renderMoney, wireMoney, openWorkEditor, openMoneyEditor } from './datapages.js';
import { confirmDays } from './editors.js';
import { wireShortcuts, renderShortcutManage, wireShortcutManage } from './shortcuts.js';
import { renderPay, wirePay } from './pay-ui.js';
import { renderPlaces, wirePlaces } from './places-ui.js';
import { renderHomeLayout, wireHomeLayout } from './home-ui.js';
import { dismissInstallHint } from './install.js';
import { TAVON_KEYS } from '../data/schema.js';
import { renderCache, wireCache, registerOffline } from './cache-ui.js';
import { renderBackupPage, wireBackupPage } from './backup-ui.js';
import { renderSchedule, wireSchedule, renderRecurring, wireRecurring, openSwap, renderCategories, wireCategories } from './plans.js';
import { todayKey, dayInfo, pendingPastDays, hasData } from '../data/stats.js';
import { animateNumber } from '../ui/ui.js';

let homeSel = ''; // day tapped in the Home week strip (details shown under it)
let homeWeek = 0; // which week the Home strip shows (0 = this week)
let demo = false; // preview with sample data: memory only, never saved
const getData = () => (demo ? demoData() : readDashboardData(localStorage));
const rerender = () => render(false, false);

let settings = load();
const app = /** @type {HTMLElement} */ (document.getElementById('app'));
const reducedMotion = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;

/** @param {string} s */
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c));

function chrome() {
  const L = getLang();
  document.documentElement.lang = L;
  const tab = (name, ic) => `<a class="tab" href="#/${name === 'home' ? '' : name}" data-tab="${name}">${icon(ic)}<span>${esc(t('nav.' + name))}</span></a>`;
  document.body.insertAdjacentHTML('afterbegin', spriteMarkup());
  document.body.insertAdjacentHTML('beforeend', `
    <nav class="tabbar" aria-label="${esc(t('nav.main'))}"><div class="tabbar-inner">
      ${tab('home', 'home')}${tab('work', 'work')}
      <button class="tab-plus" id="plus" aria-label="${esc(t('nav.add'))}" aria-haspopup="dialog">${icon('plus')}</button>
      ${tab('money', 'money')}${tab('settings', 'settings')}
    </div></nav>
    <dialog class="sheet center" id="qa" aria-labelledby="qa-t"></dialog>`);
  document.getElementById('plus')?.addEventListener('click', openQuick);
  document.querySelectorAll('.tab').forEach((a) => a.addEventListener('click', () => {
    if (a.getAttribute('aria-current') === 'page') window.scrollTo({ top: 0, behavior: reducedMotion() ? 'auto' : 'smooth' }); // tap current tab = back to top
  }));
}
function relabel() {
  document.documentElement.lang = getLang();
  document.querySelectorAll('.tab').forEach((a) => { const s = a.querySelector('span'); if (s) s.textContent = t('nav.' + /** @type {HTMLElement} */ (a).dataset.tab); });
  document.querySelector('.tabbar')?.setAttribute('aria-label', t('nav.main'));
  document.getElementById('plus')?.setAttribute('aria-label', t('nav.add'));
}

function openQuick() {
  const d = /** @type {HTMLDialogElement} */ (document.getElementById('qa'));
  const items = [['qa.tip', 'money', 'tip'], ['qa.expense', 'upload', 'expense'], ['qa.income', 'download', 'income'], ['qa.today', 'calendar', 'today'], ['qa.swap', 'repeat', 'swap']];
  d.innerHTML = `<div class="stack"><div class="between"><h2 class="t-title3" id="qa-t">${esc(t('qa.title'))}</h2>
    <button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>
    <div class="list">${items.map(([k, ic, a]) => `<button class="row" data-act="${a}"><span class="row-icon accent">${icon(ic)}</span><span class="row-main"><span class="row-title">${esc(t(k))}</span></span>${a ? '' : `<span class="badge badge-neutral">${esc(t('soon'))}</span>`}</button>`).join('')}</div></div>`;
  d.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
    const a = /** @type {HTMLElement} */ (b).dataset.act;
    if (!a) { toast(t('soon.msg')); return; }
    closeSheet(d);
    setTimeout(() => {
      if (a === 'tip') openWorkEditor({ day: todayKey(), data: getData(), demo, focus: 'tips', onDone: rerender });
      else if (a === 'swap') openSwap({ data: getData(), demo, onDone: rerender });
      else if (a === 'today') openWorkEditor({ day: todayKey(), data: getData(), demo, onDone: rerender });
      else openMoneyEditor({ type: a, items: getData().items, demo, onDone: rerender });
    }, 220);
  }));
  openSheet(d);
}

/** @param {string} title @param {string} sub @param {string|null} back */
const header = (title, sub, back) => `<header class="navbar">${back ? `<a class="btn btn-ghost btn-sm" style="margin-left:calc(var(--s-4)*-1)" href="#/${back}">${icon('back', 'i-sm')}${esc(t('nav.back'))}</a>` : `<img class="logo logo-ink" src="assets/brand/tavon-logo-ink.svg" alt="TAVON"><img class="logo logo-paper" src="assets/brand/tavon-logo-paper.svg" alt="TAVON">`}<h1 class="t-large" id="page-title" tabindex="-1">${esc(title)}</h1>${sub ? `<p class="t-sub muted">${esc(sub)}</p>` : ''}</header>`;
/** @param {string} ic @param {string} title @param {string} sub */
const stateCard = (ic, title, sub) => `<div class="card state">${`<div class="state-icon">${icon(ic, 'i-lg')}</div>`}<p class="t-headline">${esc(title)}</p><p class="t-sub muted">${esc(sub)}</p></div>`;
/** @param {string} ic @param {string} title @param {string} sub @param {string} [href] */
const row = (ic, title, sub, href) => {
  const inner = `<span class="row-icon${href ? ' accent' : ''}">${icon(ic)}</span><span class="row-main"><span class="row-title">${esc(title)}</span><br><span class="row-sub">${esc(sub)}</span></span>${href ? `<span class="row-trail">${icon('chevron', 'i-sm')}</span>` : `<span class="badge badge-neutral">${esc(t('soon'))}</span>`}`;
  return href ? `<a class="row" href="${href}">${inner}</a>` : `<div class="row" aria-disabled="true">${inner}</div>`;
};
const seg = (id, labelKey, opts) => `<div class="field"><span class="label" id="l-${id}">${esc(t(labelKey))}</span><div class="seg" id="${id}" role="group" aria-labelledby="l-${id}">${opts.map(([v, k]) => `<button data-value="${v}" aria-pressed="false">${esc(t(k))}</button>`).join('')}</div></div>`;

const VIEWS = {
  home: () => header(t('nav.home'), '', null) + renderHome({ data: getData(), demo, lang: getLang(), weekOffset: homeWeek, selectedDay: homeSel }),
  work: () => header(t('nav.work'), t('work.sub'), null) + renderWork({ data: getData(), lang: getLang() }),
  money: () => header(t('nav.money'), t('money.sub'), null) + renderMoney({ data: getData(), lang: getLang() }),
  settings: () => header(t('nav.settings'), t('settings.sub'), null) + `<div class="list">
    ${row('home', t('hl.title'), t('hl.sub'), '#/settings/home')}
    ${row('bolt', t('settings.shortcuts'), t('settings.shortcuts.sub'), '#/settings/shortcuts')}
    ${row('sun', t('settings.appearance'), t('settings.appearance.sub'), '#/settings/appearance')}
    ${row('search', t('settings.language'), getLang() === 'th' ? 'ไทย' : 'English', '#/settings/language')}
    ${row('work', t('settings.work'), t('settings.work.sub'), '#/settings/schedule')}
    ${row('shield', t('cache.title'), t('cache.sub'), '#/settings/cache')}
    ${row('money', t('pay.title'), t('pay.sub'), '#/settings/pay')}
    ${row('tag', t('pl.title'), t('pl.sub'), '#/settings/places')}
    ${row('tag', t('cat.title'), t('cat.sub'), '#/settings/categories')}
    ${row('money', t('settings.money'), t('settings.money.sub'), '#/settings/recurring')}
    ${row('shield', t('settings.data'), t('settings.data.sub'), '#/settings/data')}</div>`,
  'settings/appearance': () => header(t('settings.appearance'), '', 'settings') + `<div class="card stack">
    ${seg('s-theme', 'ap.theme', [['auto', 'ap.auto'], ['light', 'ap.light'], ['dark', 'ap.dark']])}
    <div class="field"><span class="label" id="l-acc">${esc(t('ap.accent'))}</span><div class="cluster" id="accents" role="group" aria-labelledby="l-acc">
      ${[['terracotta', '#9F4019'], ['forest', '#2A634D'], ['ocean', '#2C5F8F'], ['mono', '#141414']].map(([v, c]) => `<button class="chip" data-value="${v}" aria-pressed="false"><i class="swatch" style="background:${c}"></i>${esc(t('ap.' + v))}</button>`).join('')}</div></div>
    ${seg('s-size', 'ap.size', [['small', 'S'], ['default', 'M'], ['large', 'L'], ['xlarge', 'XL']].map(([v, k]) => [v, k]))}
    ${seg('s-den', 'ap.density', [['compact', 'ap.compact'], ['comfortable', 'ap.normal'], ['spacious', 'ap.spacious']])}
    <div class="between"><span class="row-main"><span id="l-rest">${esc(t('ap.rest'))}</span><br><span class="t-footnote muted">${esc(t('ap.rest.sub'))}</span></span><button class="switch" id="sw-rest" aria-labelledby="l-rest"></button></div>
    <div class="between"><span id="l-mo">${esc(t('ap.motion'))}</span><button class="switch" id="sw-motion" aria-labelledby="l-mo"></button></div>
    <button class="btn btn-secondary btn-block" id="reset">${esc(t('ap.reset'))}</button></div>`,
  'settings/home': () => header(t('hl.title'), '', 'settings') + renderHomeLayout({ data: getData(), lang: getLang() }),
  'settings/shortcuts': () => header(t('settings.shortcuts'), '', 'settings') + renderShortcutManage({ data: getData(), lang: getLang() }),
  'settings/schedule': () => header(t('pl.sched'), t('pl.sched.sub'), 'settings') + renderSchedule({ data: getData(), lang: getLang() }),
  'settings/recurring': () => header(t('pl.rec'), t('pl.rec.sub'), 'settings') + renderRecurring({ data: getData(), lang: getLang() }),
  'settings/categories': () => header(t('cat.title'), t('cat.sub'), 'settings') + renderCategories({ lang: getLang() }),
  'settings/data': () => header(t('bk.page'), '', 'settings') + renderBackupPage({ lang: getLang() }),
  'settings/cache': () => header(t('cache.title'), t('cache.sub'), 'settings') + renderCache({ lang: getLang() }),
  'settings/places': () => header(t('pl.title'), t('pl.sub'), 'settings') + renderPlaces(),
  'settings/pay': () => header(t('pay.title'), t('pay.sub'), 'settings') + renderPay({ data: getData(), lang: getLang() }),
  'settings/language': () => header(t('settings.language'), '', 'settings') + `<div class="card stack">${seg('s-lang', 'settings.language', [['th', 'ไทย'], ['en', 'English']])}</div>`,
  notfound: () => header(t('nf.title'), '', null) + `<div class="card state"><div class="state-icon">${icon("alert", "i-lg")}</div><a class="btn btn-primary" href="#/">${esc(t('nf.btn'))}</a></div>`,
};

/** Day-off rest tone: on when the setting is on, there is a schedule or data (so a brand-new user is not put to bed), and today is a day off. */
function syncRest() {
  const d = /** @type {any} */ (readDashboardData(localStorage)); let on = false;
  if (settings.rest === 'on' && !demo && ((Array.isArray(d.rules) && d.rules.length > 0) || hasData(d))) on = ['off', 'leave', 'swapped'].includes(dayInfo(d.work, d.rules, todayKey()).status);
  applyRest(on);
  try { localStorage.setItem(TAVON_KEYS.restLast, JSON.stringify({ day: todayKey(), on })); } catch { /* private mode */ }
}

/** Wire up controls after a view renders. */
function wire(name) {
  const set = (k, v) => { settings = { ...settings, [k]: v }; save(settings); apply(settings); };
  const pick = (id, key) => { const el = document.getElementById(id); if (!el) return; el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.value === settings[key]))); segmented(el, (v) => set(key, v)); };
  if (name === 'settings/appearance') {
    pick('s-theme', 'theme'); pick('s-size', 'fontSize'); pick('s-den', 'density');
    const acc = document.getElementById('accents');
    const mark = () => acc?.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.value === settings.accent)));
    mark(); acc?.addEventListener('click', (e) => { const b = /** @type {HTMLElement} */ (e.target).closest('button'); if (b) { set('accent', b.dataset.value); mark(); } });
    const swr = /** @type {HTMLElement} */ (document.getElementById('sw-rest'));
    swr.setAttribute('aria-checked', String(settings.rest === 'on')); switchControl(swr, (on) => { set('rest', on ? 'on' : 'off'); syncRest(); });
    const sw = /** @type {HTMLElement} */ (document.getElementById('sw-motion'));
    sw.setAttribute('aria-checked', String(settings.motion === 'off')); switchControl(sw, (on) => set('motion', on ? 'off' : 'system'));
    document.getElementById('reset')?.addEventListener('click', () => {
      const before = { ...settings };
      settings = { ...DEFAULTS }; save(settings); apply(settings); render();
      toast(t('ap.reset.done'), { action: t('ap.undo'), onAction: () => { settings = before; save(settings); apply(settings); render(); } });
    });
  }
  if (name === 'home') {
    document.getElementById('demo-on')?.addEventListener('click', () => { demo = true; render(false); });
    document.getElementById('demo-off')?.addEventListener('click', () => { demo = false; render(false); });
    wireShortcuts({ data: getData(), demo, rerender });
    document.getElementById('hw-prev')?.addEventListener('click', () => { homeWeek--; homeSel = ''; rerender(); });
    document.getElementById('hw-next')?.addEventListener('click', () => { homeWeek++; homeSel = ''; rerender(); });
    document.getElementById('hw-now')?.addEventListener('click', () => {
      if (homeWeek !== 0) { homeWeek = 0; homeSel = ''; rerender(); return; }
      let dlg = /** @type {HTMLDialogElement|null} */ (document.getElementById('wk-sheet'));
      if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'wk-sheet'; dlg.className = 'sheet'; dlg.setAttribute('aria-labelledby', 'wk-t'); document.body.append(dlg); }
      dlg.innerHTML = weekSheetHtml(getData(), todayKey(), todayKey(), getLang()); openSheet(dlg);
    });
    document.querySelectorAll('.cal-d[data-day]').forEach((b) => b.addEventListener('click', () => {
      const day = /** @type {HTMLElement} */ (b).dataset.day || '';
      if (day === todayKey()) { homeSel = ''; rerender(); document.getElementById('today-card')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' }); return; } // today is already shown above
      homeSel = homeSel === day ? '' : day; rerender();
    }));
    document.getElementById('sel-edit')?.addEventListener('click', () => openWorkEditor({ day: homeSel, data: getData(), demo, onDone: rerender }));
    document.getElementById('sel-confirm')?.addEventListener('click', () => { const d = getData(); confirmDays({ days: [dayInfo(d.work, d.rules, homeSel)], data: d, demo, onDone: rerender }); });
    document.getElementById('install-dismiss')?.addEventListener('click', () => { dismissInstallHint(); rerender(); });
    document.getElementById('confirm-today')?.addEventListener('click', () => { const d = getData(); confirmDays({ days: [dayInfo(d.work, d.rules, todayKey())], data: d, demo, onDone: rerender }); });
    document.getElementById('confirm-all')?.addEventListener('click', () => { const d = getData(); confirmDays({ days: pendingPastDays(d.work, d.rules, todayKey(), 14), data: d, demo, onDone: rerender }); });
    document.getElementById('tip-today')?.addEventListener('click', () => openWorkEditor({ day: todayKey(), data: getData(), demo, focus: 'tips', onDone: rerender }));
    document.querySelectorAll('[data-count]').forEach((el) => { const v = Number(/** @type {HTMLElement} */ (el).dataset.count); animateNumber(/** @type {HTMLElement} */ (el), v, (n) => money(n)); });
  }
  if (name === 'settings/schedule') wireSchedule({ data: getData(), demo, rerender });
  if (name === 'settings/recurring') wireRecurring({ data: getData(), demo, rerender });
  if (name === 'settings/categories') wireCategories({ demo, rerender });
  if (name === 'settings/cache') wireCache({ lang: getLang() });
  if (name === 'settings/pay') wirePay({ data: getData(), demo, rerender });
  if (name === 'settings/places') wirePlaces({ demo, rerender });
  if (name === 'settings/data') wireBackupPage({ demo, rerender });
  if (name === 'settings/home') wireHomeLayout({ demo, rerender });
  if (name === 'settings/shortcuts') wireShortcutManage({ data: getData(), demo, rerender });
  if (name === 'work') wireWork({ data: getData(), demo, rerender });
  if (name === 'money') wireMoney({ data: getData(), demo, rerender });
  if (name === 'settings/language') {
    const el = document.getElementById('s-lang');
    if (el) { el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (b).dataset.value === getLang()))); segmented(el, (v) => { setLang(v); relabel(); render(false); }); }
  }
}

/** @param {boolean} [moveFocus] @param {boolean} [animate] */
function render(moveFocus = true, animate = moveFocus) {
  const r = parseRoute(location.hash);
  const view = VIEWS[r.name] || VIEWS.notfound;
  app.innerHTML = `<div class="${reducedMotion() || !animate ? '' : 'rise'}">${view()}</div>`;
  runFlash(app); syncRest();
  document.querySelectorAll('.tab').forEach((a) => { if (/** @type {HTMLElement} */ (a).dataset.tab === r.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.title = `${t(r.tab === 'home' && r.name === 'notfound' ? 'nf.title' : 'nav.' + r.tab)} · TAVON`;
  wire(r.name);
  if (moveFocus) { window.scrollTo(0, 0); document.getElementById('page-title')?.focus({ preventScroll: true }); } // screen readers announce the new page
}

// Swipe from the left edge = back (sub-pages only)
let sx = 0, sy = 0, edge = false;
addEventListener('touchstart', (e) => { const p = e.touches[0]; sx = p.clientX; sy = p.clientY; edge = sx < 24; }, { passive: true });
addEventListener('touchend', (e) => { if (!edge) return; const p = e.changedTouches[0]; if (p.clientX - sx > 70 && Math.abs(p.clientY - sy) < 50 && parseRoute(location.hash).parent) history.back(); edge = false; }, { passive: true });

chrome();
apply(settings); watchSystem(() => settings);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncRest(); }); // a new day may have started
addEventListener('hashchange', () => render());
render(false);
registerOffline();
// Launch screen: fade the logo away once the first screen is on the page.
{
  const sp = document.getElementById('splash');
  // Stays at least ~1.3 s from page start so the logo is seen as a moment, not a flicker.
  if (sp) setTimeout(() => { sp.classList.add('done'); setTimeout(() => sp.remove(), 400); }, Math.max(0, 1300 - performance.now()));
}
