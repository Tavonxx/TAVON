// @ts-check
// An original sleeping character for days off: a round cream-coloured kitten curled up on a blue duvet beside a
// little night light. Hand-drawn look (inked outlines, paper grain, warm glow). Decorative: the words "day off"
// beside it carry the meaning, so the picture is hidden from screen readers.
export function restArt() {
  const ink = '#1B2140';
  return `<svg class="rest-art" viewBox="-8 0 296 190" aria-hidden="true" focusable="false">
    <defs>
      <filter id="ra-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 -.34" result="g"/><feComposite in="g" in2="SourceAlpha" operator="in" result="gi"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="gi"/></feMerge></filter>
      <linearGradient id="ra-duvet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5877BE"/><stop offset="1" stop-color="#34508F"/></linearGradient>
      <radialGradient id="ra-glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD58A" stop-opacity=".7"/><stop offset=".55" stop-color="#FFB964" stop-opacity=".22"/><stop offset="1" stop-color="#FFB964" stop-opacity="0"/></radialGradient>
      <radialGradient id="ra-cat" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#EBD8BC"/></radialGradient>
    </defs>
    <g filter="url(#ra-grain)" stroke="${ink}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
      <!-- pillow and duvet -->
      <path d="M10 112c-2-26 14-44 44-46 30-2 58 10 62 34 3 20-6 30-26 32H34c-14 0-22-8-24-20z" fill="#7C98D6"/>
      <path d="M2 130c22-14 48-8 80-14s70-10 104 2 52 4 66 6c12 2 14 8 14 16v36c0 8-6 12-14 12H16c-8 0-14-4-14-12z" fill="url(#ra-duvet)"/>
      <g fill="none" stroke-width="2.4" opacity=".85"><path d="M18 150c24-6 40 4 66 0"/><path d="M120 160c30-10 54 2 86-4"/><path d="M44 172c30-6 50 4 82-2"/><path d="M168 142c20-4 40 2 60 0"/></g>
      <!-- tail -->
      <path d="M170 128c26 2 38-8 36-24-1-8-8-12-14-8" fill="none" stroke-width="15"/>
      <path d="M170 128c26 2 38-8 36-24-1-8-8-12-14-8" fill="none" stroke="#F4E6CE" stroke-width="10"/>
      <!-- body -->
      <ellipse cx="124" cy="124" rx="56" ry="27" fill="url(#ra-cat)"/>
      <path d="M96 106q10-7 22-5M140 100q12 2 20 10" fill="none" stroke="#D9C09A" stroke-width="2.2" opacity=".9"/>
      <!-- ears and head -->
      <path d="M52 100l-4-30 24 14z" fill="#F4E6CE"/><path d="M56 94l-2-14 11 7z" fill="#F4A5A8" stroke="none"/>
      <path d="M100 98l12-28 12 24z" fill="#F4E6CE" transform="translate(-14 0)"/><path d="M99 92l8-14 6 13z" fill="#F4A5A8" stroke="none"/>
      <ellipse cx="82" cy="110" rx="33" ry="28" fill="url(#ra-cat)"/>
      <!-- face -->
      <path d="M64 108q6 6 13 0M88 108q6 6 13 0" fill="none" stroke-width="2.6"/>
      <path d="M81 117l4 0-2 3z" fill="#E58C8C" stroke-width="1.8"/>
      <path d="M76 123q6 5 12 0" fill="none" stroke-width="2"/>
      <g stroke-width="1.6" opacity=".7" fill="none"><path d="M52 118l-12-2M52 123l-11 4M112 118l12-2M112 123l11 4"/></g>
      <ellipse cx="62" cy="119" rx="7" ry="4.5" fill="#FF9AA4" opacity=".55" stroke="none"/><ellipse cx="104" cy="119" rx="7" ry="4.5" fill="#FF9AA4" opacity=".55" stroke="none"/>
      <!-- paws -->
      <ellipse cx="96" cy="142" rx="11" ry="7" fill="#F4E6CE"/><ellipse cx="120" cy="145" rx="11" ry="7" fill="#F4E6CE"/>
      <!-- night light -->
      <rect x="208" y="136" width="26" height="9" rx="4.5" fill="#8A6A44"/>
      <path d="M212 136c-2-16 4-26 9-26s11 10 9 26z" fill="#FFE29A"/>
    </g>
    <circle class="glow" cx="221" cy="124" r="66" fill="url(#ra-glow)" style="mix-blend-mode:screen"/>
    <g fill="#FFF3C4"><path class="tw t1" d="M40 36l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/><path class="tw t2" d="M196 48l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6z"/><circle cx="150" cy="40" r="1.7"/><circle cx="18" cy="70" r="1.5"/></g>
    <g font-family="var(--font-display)" font-weight="800" fill="var(--text-2)">
      <text class="zz z1" x="96" y="62" font-size="15">z</text><text class="zz z2" x="114" y="44" font-size="20">z</text><text class="zz z3" x="136" y="22" font-size="25">Z</text>
    </g>
  </svg>`;
}
