// @ts-check
// An original little sleeping character for days off: a plump round-faced plush with soft ears under a star blanket,
// a sleepy moon and Zzz. Drawn in a soft, glossy, storybook style. Decorative: the words "day off" beside it carry the
// meaning, so the picture is hidden from screen readers.
export function restArt() {
  return `<svg class="rest-art" viewBox="0 0 260 190" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="ra-head" cx="38%" cy="30%" r="75%"><stop offset="0" stop-color="#FFEBDC"/><stop offset=".6" stop-color="#F8CDAE"/><stop offset="1" stop-color="#EAAA85"/></radialGradient>
      <radialGradient id="ra-cheek"><stop offset="0" stop-color="#FF8F9C" stop-opacity=".85"/><stop offset="1" stop-color="#FF8F9C" stop-opacity="0"/></radialGradient>
      <linearGradient id="ra-blanket" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B3B8F7"/><stop offset="1" stop-color="#7A80D8"/></linearGradient>
      <linearGradient id="ra-pillow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#CFD3EE"/></linearGradient>
      <radialGradient id="ra-moon" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#FFF6CC"/><stop offset="1" stop-color="#F2D77E"/></radialGradient>
      <filter id="ra-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <!-- sleepy moon with a tiny face -->
    <g class="ra-moon">
      <path d="M214 22a28 28 0 1 0 14 50a22 22 0 1 1-14-50z" fill="url(#ra-moon)"/>
      <path d="M205 46q3 3 6 0" fill="none" stroke="#B8903A" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="203" cy="53" rx="3.5" ry="2.2" fill="#FF9AA6" opacity=".6"/>
    </g>
    <g fill="#FFF3C4"><path class="tw t1" d="M40 30l2.2 5.4 5.4 2.2-5.4 2.2L40 45l-2.2-5.2-5.4-2.2 5.4-2.2z"/><path class="tw t2" d="M176 40l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/><circle cx="72" cy="64" r="1.8"/><circle cx="240" cy="108" r="1.6"/><circle cx="20" cy="86" r="1.5"/></g>
    <!-- bed and soft shadow -->
    <ellipse cx="130" cy="166" rx="112" ry="10" fill="#000" opacity=".28" filter="url(#ra-soft)"/>
    <rect x="12" y="138" width="236" height="26" rx="13" fill="var(--surface-2)"/>
    <rect x="12" y="138" width="236" height="8" rx="4" fill="#fff" opacity=".07"/>
    <!-- pillow -->
    <rect x="20" y="104" width="96" height="42" rx="21" fill="url(#ra-pillow)"/>
    <path d="M36 112q22-5 66 0" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8" fill="none"/>
    <!-- ears, head -->
    <circle cx="44" cy="86" r="13" fill="#EFB895"/><circle cx="44" cy="86" r="7" fill="#FF9FAB" opacity=".75"/>
    <circle cx="94" cy="86" r="13" fill="#EFB895"/><circle cx="94" cy="86" r="7" fill="#FF9FAB" opacity=".75"/>
    <circle cx="69" cy="108" r="40" fill="url(#ra-head)"/>
    <path d="M66 68c-6-9 4-15 10-9" fill="none" stroke="#B9794F" stroke-width="3.2" stroke-linecap="round"/>
    <ellipse cx="55" cy="87" rx="12" ry="6" fill="#fff" opacity=".35" transform="rotate(-18 55 87)"/>
    <!-- closed eyes with lashes, cheeks, nose, smile -->
    <path d="M47 108q7 7 15 0M76 108q7 7 15 0" fill="none" stroke="#5A3A2E" stroke-width="3" stroke-linecap="round"/>
    <path d="M46 105l-4-3M91 105l4-3M49 111l-4 2M89 111l4 2" fill="none" stroke="#5A3A2E" stroke-width="2" stroke-linecap="round"/>
    <circle cx="46" cy="121" r="10" fill="url(#ra-cheek)"/><circle cx="92" cy="121" r="10" fill="url(#ra-cheek)"/>
    <ellipse cx="69" cy="116" rx="4.2" ry="3" fill="#C9805E"/>
    <path d="M62 123q7 6 14 0" fill="none" stroke="#5A3A2E" stroke-width="2.4" stroke-linecap="round"/>
    <!-- sleepy nose bubble -->
    <circle class="bub" cx="82" cy="116" r="6" fill="#DDF1FF" opacity=".85" stroke="#fff" stroke-width="1.4"/>
    <!-- blanket with stars, scalloped top edge -->
    <path d="M100 112c8-14 26-20 52-20h46c26 0 40 16 40 38v22H100z" fill="url(#ra-blanket)"/>
    <path d="M100 112c8-14 26-20 52-20h46c26 0 40 16 40 38" fill="none" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>
    <path d="M106 126h124" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4"/>
    <g fill="#FFF3C4" opacity=".95"><path d="M140 108l2 4.6 4.8.4-3.7 3.2 1.2 4.7-4.3-2.6-4.3 2.6 1.2-4.7-3.7-3.2 4.8-.4z"/><path d="M186 104l1.6 3.8 4 .3-3 2.6 1 3.9-3.6-2.2-3.6 2.2 1-3.9-3-2.6 4-.3z"/><path d="M214 124l1.4 3.2 3.4.3-2.6 2.2.8 3.3-3-1.8-3 1.8.8-3.3-2.6-2.2 3.4-.3z"/></g>
    <rect x="100" y="150" width="148" height="12" rx="6" fill="#6C72CC"/>
    <!-- little hand holding the blanket -->
    <ellipse cx="116" cy="112" rx="11" ry="9" fill="#F3C4A2"/><ellipse cx="112" cy="109" rx="4" ry="2.6" fill="#fff" opacity=".4"/>
    <!-- Zzz -->
    <g font-family="var(--font-display)" font-weight="800" fill="var(--text-2)">
      <text class="zz z1" x="116" y="74" font-size="15">z</text><text class="zz z2" x="134" y="54" font-size="20">z</text><text class="zz z3" x="156" y="30" font-size="25">Z</text>
    </g>
  </svg>`;
}
