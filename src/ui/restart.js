// @ts-check
// An original little sleeping character for days off (a round-faced bun under a blanket, with a moon and Zzz).
// Decorative: the words "day off" next to it carry the meaning, so the picture is hidden from screen readers.
export function restArt() {
  return `<svg class="rest-art" viewBox="0 0 240 170" aria-hidden="true" focusable="false">
    <path d="M198 24a24 24 0 1 0 16 42a19 19 0 1 1-16-42z" fill="#F3E3A9"/>
    <g fill="#F3E3A9" opacity=".85"><circle cx="36" cy="30" r="2"/><circle cx="62" cy="52" r="1.6"/><circle cx="170" cy="46" r="1.8"/><circle cx="214" cy="96" r="1.5"/></g>
    <rect x="14" y="128" width="212" height="18" rx="9" fill="var(--surface-2)"/>
    <rect x="26" y="98" width="78" height="34" rx="17" fill="#E7E9F6"/>
    <circle cx="66" cy="96" r="29" fill="#F6D7BF"/>
    <path d="M56 70q2-9 9-8q-1 7-5 10z" fill="#C98F6B"/>
    <path d="M55 96q5 5 10 0M73 96q5 5 10 0" fill="none" stroke="#5A3F32" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="54" cy="105" rx="5" ry="3" fill="#EDA79A" opacity=".7"/><ellipse cx="86" cy="105" rx="5" ry="3" fill="#EDA79A" opacity=".7"/>
    <path d="M70 106q4 3 8 0" fill="none" stroke="#5A3F32" stroke-width="2" stroke-linecap="round"/>
    <path d="M84 100q6-14 30-14h74q28 0 28 26v20H84z" fill="#8E93D6"/>
    <path d="M84 120h132" stroke="#7479C4" stroke-width="3" stroke-linecap="round"/>
    <path d="M112 90v40M150 88v42M188 90v40" stroke="#7479C4" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>
    <rect x="84" y="126" width="144" height="8" rx="4" fill="#7479C4"/>
    <g font-family="var(--font-display)" font-weight="700" fill="var(--text-2)">
      <text class="zz z1" x="108" y="70" font-size="15">z</text><text class="zz z2" x="124" y="52" font-size="19">z</text><text class="zz z3" x="144" y="32" font-size="23">Z</text>
    </g>
  </svg>`;
}
