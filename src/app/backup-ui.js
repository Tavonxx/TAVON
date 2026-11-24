// @ts-check
// Settings > Data & backup: save a backup file (to iCloud via the share sheet) and import one.
import { icon } from '../ui/icons.js';
import { openSheet, closeSheet, toast } from '../ui/ui.js';
import { t } from './i18n.js';
import { esc } from './format.js';
import { todayKey, backupAgeDays } from '../data/stats.js';
import { LEGACY_KEYS } from '../data/schema.js';
import { createBackup, parseBackup, importBackup, restoreSnapshot, summarize } from '../data/backup.js';

/** Every app key as stored, for counting what is on the device right now. @param {Storage} st */
function currentSummary(st) {
  /** @type {Record<string,string>} */ const data = {};
  for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k && /^(pee|tavon)-/.test(k) && k !== 'tavon-snapshots') data[k] = st.getItem(k) || ''; }
  return summarize(data);
}
/** Remember when the person last made a backup (milliseconds, same as the old app). */
function markBackedUp() { try { localStorage.setItem(LEGACY_KEYS.lastBackup, String(Date.now())); } catch { /* not critical */ } }

/** @param {{lang:string}} c */
export function renderBackupPage({ lang }) {
  const age = backupAgeDays(localStorage.getItem(LEGACY_KEYS.lastBackup));
  const when = age === null ? t('bk.never', lang) : age === 0 ? t('bk.last', lang) + ': ' + (lang === 'en' ? 'today' : 'วันนี้') : t('bk.days', lang).replace('{n}', String(age));
  return `<div class="stack-lg">
    <div class="card stack"><p class="t-sub">${esc(t('bk.where', lang))}</p><p class="t-headline" id="bk-when">${esc(when)}</p></div>
    <div class="stack"><button class="btn btn-primary btn-block" id="bk-now">${icon('shield', 'i-sm')}${esc(t('bk.now', lang))}</button><p class="t-footnote muted">${esc(t('bk.now.sub', lang))}</p><p class="t-footnote muted">${esc(t('bk.tip', lang))}</p></div>
    <div class="stack"><button class="btn btn-secondary btn-block" id="bk-import">${icon('download', 'i-sm')}${esc(t('bk.import', lang))}</button><p class="t-footnote muted">${esc(t('bk.import.sub', lang))}</p>
    <input type="file" id="bk-file" accept=".json,application/json,text/plain" hidden></div></div>`;
}

/** @param {{demo:boolean, rerender:()=>void}} c */
export function wireBackupPage({ demo, rerender }) {
  document.getElementById('bk-now')?.addEventListener('click', async () => {
    const text = createBackup(localStorage), name = `tavon-backup-${todayKey()}.json`;
    const file = new File([text], name, { type: 'application/json' });
    try {
      if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: name }); // iPhone share sheet: "Save to Files"
      else { const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
    } catch (e) { if (/** @type {any} */ (e)?.name === 'AbortError') { toast(t('bk.cancelled')); return; } toast(t('bk.cancelled')); return; }
    markBackedUp(); toast(t('bk.done')); rerender();
  });

  const input = /** @type {HTMLInputElement|null} */ (document.getElementById('bk-file'));
  document.getElementById('bk-import')?.addEventListener('click', () => { if (demo) { toast(t('ed.demo')); return; } input?.click(); });
  input?.addEventListener('change', async () => {
    const f = input.files?.[0]; input.value = ''; if (!f) return;
    const parsed = parseBackup(await f.text());
    if (!parsed.ok) { toast(t('bk.import.bad')); return; }
    const now = currentSummary(localStorage), inFile = parsed.summary;
    let d = /** @type {HTMLDialogElement|null} */ (document.getElementById('bk-sheet'));
    if (!d) { d = document.createElement('dialog'); d.id = 'bk-sheet'; d.className = 'sheet center'; d.setAttribute('aria-labelledby', 'bk-t'); document.body.append(d); }
    const line = (k, a, b) => `<div class="row"><span class="row-main"><span class="row-title">${esc(t(k))}</span></span><span class="num">${a} → <b>${b}</b></span></div>`;
    d.innerHTML = `<div class="stack"><div class="between"><h2 class="t-title3" id="bk-t">${esc(t('bk.import.title'))}</h2><button class="btn btn-ghost btn-icon" data-close aria-label="${esc(t('close'))}">${icon('close')}</button></div>
      <p class="t-sub">${esc(t('bk.import.warn'))}</p>
      <div class="list">${line('bk.n.work', now.workDays, inFile.workDays)}${line('bk.n.tx', now.transactions, inFile.transactions)}${line('bk.n.rec', now.recurringRules, inFile.recurringRules)}</div>
      <button class="btn btn-primary btn-block" id="bk-go">${esc(t('bk.import.go'))}</button></div>`;
    d.querySelector('#bk-go')?.addEventListener('click', () => {
      try {
        const { snapshotId } = importBackup(localStorage, parsed);
        closeSheet(/** @type {HTMLDialogElement} */ (d)); rerender();
        toast(t('bk.import.ok'), { action: t('ap.undo'), ms: 8000, onAction: () => { try { restoreSnapshot(localStorage, snapshotId); rerender(); toast(t('ed.restored')); } catch { toast(t('bk.import.fail')); } } });
      } catch { toast(t('bk.import.fail')); }
    });
    openSheet(d);
  });
}
