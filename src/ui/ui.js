// @ts-check
// Small UI behaviours: sheet, confirm alert, toast with undo, segmented control, switch, animated number.
const reduced = () => document.documentElement.dataset.motion === 'off' || matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Bottom sheet from a <dialog class="sheet">. Closes on backdrop tap, Esc, or [data-close]. @param {HTMLDialogElement} d */
export function openSheet(d) {
  if (!d.open) d.showModal();
  const close = () => closeSheet(d);
  d.onclick = (e) => { if (e.target === d || /** @type {HTMLElement} */ (e.target).closest('[data-close]')) close(); };
  d.oncancel = (e) => { e.preventDefault(); close(); };
}
/** @param {HTMLDialogElement} d */
export function closeSheet(d) {
  if (reduced()) { d.close(); return; }
  d.classList.add('closing');
  setTimeout(() => { d.classList.remove('closing'); d.close(); }, 200);
}

/** Confirm dialog. Resolves true/false. Destructive actions use danger style. 
 * @param {{title:string,message?:string,confirm:string,cancel?:string,danger?:boolean}} o */
export function confirmDialog(o) {
  return new Promise((resolve) => {
    const d = document.createElement('dialog');
    d.className = 'alert'; d.setAttribute('aria-labelledby', 'al-t');
    const t = document.createElement('h2'); t.id = 'al-t'; t.className = 't-headline'; t.textContent = o.title;
    d.append(t);
    if (o.message) { const p = document.createElement('p'); p.className = 't-sub muted'; p.style.marginTop = '.5rem'; p.textContent = o.message; d.append(p); }
    const a = document.createElement('div'); a.className = 'alert-actions';
    const ok = document.createElement('button'); ok.className = 'btn ' + (o.danger ? 'btn-danger' : 'btn-primary'); ok.textContent = o.confirm;
    const no = document.createElement('button'); no.className = 'btn btn-secondary'; no.textContent = o.cancel || 'Cancel';
    a.append(ok, no); d.append(a); document.body.append(d);
    const done = (v) => { d.close(); d.remove(); resolve(v); };
    ok.onclick = () => done(true); no.onclick = () => done(false); d.oncancel = () => done(false);
    d.showModal(); no.focus();
  });
}

/** Toast with optional Undo. Announced politely to screen readers. 
 * @param {string} msg @param {{action?:string,onAction?:()=>void,ms?:number}} [o] */
export function toast(msg, o = {}) {
  let host = document.querySelector('.toasts');
  if (!host) { host = document.createElement('div'); host.className = 'toasts'; host.setAttribute('role', 'status'); host.setAttribute('aria-live', 'polite'); document.body.append(host); }
  const el = document.createElement('div'); el.className = 'toast';
  const m = document.createElement('span'); m.className = 'toast-msg'; m.textContent = msg; el.append(m);
  const remove = () => { el.classList.add('out'); setTimeout(() => el.remove(), reduced() ? 0 : 200); };
  if (o.action) { const b = document.createElement('button'); b.textContent = o.action; b.onclick = () => { o.onAction?.(); remove(); }; el.append(b); }
  host.append(el);
  setTimeout(remove, o.ms ?? (o.action ? 7000 : 3500));
  return remove;
}

/** Segmented control: moves the sliding indicator. @param {HTMLElement} seg @param {(value:string)=>void} [onChange] */
export function segmented(seg, onChange) {
  const btns = /** @type {HTMLButtonElement[]} */ ([...seg.querySelectorAll('button')]);
  seg.style.setProperty('--n', String(btns.length));
  const select = (i) => { btns.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j))); seg.style.setProperty('--i', String(i)); };
  const cur = btns.findIndex((b) => b.getAttribute('aria-pressed') === 'true');
  select(cur < 0 ? 0 : cur);
  btns.forEach((b, i) => b.addEventListener('click', () => { select(i); onChange?.(b.dataset.value || String(i)); }));
}

/** role="switch" button toggling aria-checked. @param {HTMLElement} sw @param {(on:boolean)=>void} [onChange] */
export function switchControl(sw, onChange) {
  sw.setAttribute('role', 'switch');
  if (!sw.hasAttribute('aria-checked')) sw.setAttribute('aria-checked', 'false');
  sw.addEventListener('click', () => { const on = sw.getAttribute('aria-checked') !== 'true'; sw.setAttribute('aria-checked', String(on)); onChange?.(on); });
}

/** Count a number up/down. Instant when motion is off. @param {HTMLElement} el @param {number} to @param {(n:number)=>string} [fmt] */
export function animateNumber(el, to, fmt = (n) => String(Math.round(n))) {
  const from = Number(el.dataset.v ?? 0); el.dataset.v = String(to);
  if (reduced() || from === to) { el.textContent = fmt(to); return; }
  const t0 = performance.now(), dur = 600;
  const step = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - (1 - p) ** 3; el.textContent = fmt(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
