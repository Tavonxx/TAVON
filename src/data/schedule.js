// Weekly shift schedule.
// The old app had the schedule hard-coded in its source. TAVON keeps it as data
// (tavon-shift-schedule) that the person edits in Settings. To avoid retyping,
// it can be suggested from the person's own past work records.

/**
 * Suggest a weekly schedule from work records.
 * Looks at the last `weeks` weeks before `today`; for each weekday picks the
 * place/time/hours seen most often on days that were worked or planned.
 * A weekday is only suggested if it was a work day in at least `minShare` of those weeks.
 * Returns rules [{weekday, place, time, hours, seen, of}] for the person to confirm. Nothing is saved.
 */
export function suggestWeeklySchedule(work, { today = new Date(), weeks = 8, minShare = 0.5 } = {}) {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end); start.setDate(start.getDate() - weeks * 7);
  const tally = Array.from({ length: 7 }, () => new Map());
  const counts = Array(7).fill(0);

  for (const [day, r] of Object.entries(work || {})) {
    const [y, m, d] = day.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    if (!(date >= start && date < end) || !r || !['worked', 'planned'].includes(r.status) || !r.place) continue;
    const wd = date.getDay();
    const sig = JSON.stringify([r.place, r.time || '', Number(r.hours) || 0]);
    tally[wd].set(sig, (tally[wd].get(sig) || 0) + 1);
    counts[wd]++;
  }

  const rules = [];
  tally.forEach((map, weekday) => {
    if (counts[weekday] < weeks * minShare) return;
    const [sig, seen] = [...map.entries()].sort((a, b) => b[1] - a[1])[0];
    const [place, time, hours] = JSON.parse(sig);
    rules.push({ weekday, place, time, hours, seen, of: weeks });
  });
  return rules;
}

/** Which shift applies on a date, from saved rules (same role as the old scheduleForDate()). */
export function shiftForDate(rules, date) {
  const wd = date.getDay();
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return (rules || []).find((r) => r.weekday === wd && (!r.from || key >= r.from) && (!r.to || key <= r.to)) || null;
}
