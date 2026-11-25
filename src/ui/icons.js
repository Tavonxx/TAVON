// @ts-check
// TAVON icon set: one SVG sprite, 24px grid, 1.75 stroke, round caps. Colour follows the text (currentColor).
const P = {
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  work: '<rect x="3.5" y="7" width="17" height="12" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3.5 12.5h17"/>',
  money: '<rect x="3" y="6" width="18" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/>',
  future: '<path d="M4 17l5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  back: '<path d="M15 6l-6 6 6 6"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  trash: '<path d="M5 7h14M10 7V4.5h4V7M7 7l1 12.5h8L17 7"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  download: '<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14"/>',
  upload: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 19h14"/>',
  undo: '<path d="M9 8L4.5 12.5 9 17"/><path d="M5 12.5h9a5 5 0 0 1 0 10"/>',
  shield: '<path d="M12 3.5l7 2.5v5.5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V6z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>',
  moon: '<path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/>',
  alert: '<path d="M12 4l9 15.5H3z"/><path d="M12 10v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>',
  up: '<path d="M6 15l6-6 6 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  tag: '<path d="M3.5 12.5V4.5a1 1 0 011-1h8l8 8-9 9z"/><circle cx="8" cy="8" r="1.3"/>',
  bolt: '<path d="M13 3L5 13.5h6L10 21l8-10.5h-6z"/>',
  grip: '<path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01"/>',
  more: '<path d="M6 12h.01M12 12h.01M18 12h.01"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
  repeat: '<path d="M4 11V9a3 3 0 0 1 3-3h11M15 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H6M9 21l-3-3 3-3"/>',
  lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
};
export const ICON_NAMES = Object.keys(P);

/** Sprite markup to inject once (hidden). */
export function spriteMarkup() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">' +
    ICON_NAMES.map((n) => `<symbol id="i-${n}" viewBox="0 0 24 24">${P[n]}</symbol>`).join('') + '</svg>';
}
/** Inline icon markup. Decorative by default (aria-hidden). @param {string} name @param {string} [cls] */
export function icon(name, cls = '') {
  if (!P[name]) throw new Error('unknown icon ' + name);
  return `<svg class="i ${cls}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}
