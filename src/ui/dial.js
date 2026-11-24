// @ts-check
// Three concentric progress rings. Pure SVG string; colours come from CSS (.ring-1/2/3), so every theme and accent works.
const R = [100, 81, 62], C = 115, W = 11;
/** @param {number} done @param {number} total */
const frac = (done, total) => (total > 0 ? Math.max(0, Math.min(1, done / total)) : 0);

/** @param {{rings:Array<{done:number,total:number}>, center:string, sub:string, label:string}} o  center/sub must already be escaped */
export function ringDial({ rings, center, sub, label }) {
  const parts = rings.slice(0, 3).map((g, i) => {
    const p = frac(g.done, g.total), r = R[i];
    const track = `<circle class="ring-track" cx="${C}" cy="${C}" r="${r}" fill="none" stroke-width="${W}"/>`;
    const arc = p > 0 ? `<circle class="ring-arc ring-${i + 1}" cx="${C}" cy="${C}" r="${r}" fill="none" stroke-width="${W}" stroke-linecap="round" pathLength="100" stroke-dasharray="${(p * 100).toFixed(2)} 100" transform="rotate(-90 ${C} ${C})"/>` : '';
    return track + arc;
  }).join('');
  return `<svg class="dial" role="img" aria-label="${label.replace(/"/g, '&quot;')}" viewBox="0 0 ${C * 2} ${C * 2}">${parts}<text class="dial-n" x="${C}" y="${C + 9}" text-anchor="middle">${center}</text><text class="dial-s" x="${C}" y="${C + 29}" text-anchor="middle">${sub}</text></svg>`;
}
