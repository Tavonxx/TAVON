// TAVON data schema.
// Rule: the v2 keys from PP Space 2.0 stay the source of truth, unchanged.
// TAVON only ADDS new keys (prefix "tavon-"). Rolling back to the old app therefore needs no conversion.

export const LEGACY_WORK_VERSION = 'excel-complete-v2';

/** Every key the old app (PP Space 2.0) reads or writes. */
export const LEGACY_KEYS = Object.freeze({
  work: 'pee-work-tracker',
  workVersion: 'pee-work-tracker-version',
  workplaces: 'pee-workplaces',
  finance: 'pee-finance-v1',
  categories: 'pee-finance-categories-v1',
  subcategories: 'pee-finance-subcategories-v1',
  recurring: 'pee-finance-recurring-v1',
  restoreFoodFlag: 'pee-finance-restore-food-v1',
  theme: 'pee-theme',
  language: 'pee-language',
  lastBackup: 'bk-last',
});

/** Keys added by TAVON. Never written by the old app. */
export const TAVON_KEYS = Object.freeze({
  meta: 'tavon-meta',                 // { schema, migrations: [{id, at}] }
  shiftSchedule: 'tavon-shift-schedule', // weekly shift rules (replaces the schedule hard-coded in the old app)
  snapshots: 'tavon-snapshots',       // automatic safety copies taken before imports/migrations
  shortcuts: 'tavon-shortcuts',       // the person's one-tap entries: [{id,label,type,category,amount|null,count,sort}]
});

export const SCHEMA_VERSION = 3;

/** Keys that belong in a backup file (everything except the snapshots themselves). */
export function isBackupKey(key) {
  return (key.startsWith('pee-') || key.startsWith('tavon-')) && key !== TAVON_KEYS.snapshots;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;
const WORK_STATUSES = ['worked', 'planned', 'off', 'leave', 'swapped'];
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

/**
 * Validators never change or drop data. They only report problems,
 * so the person decides what happens to a questionable record.
 * Each returns an array of problem strings (empty = OK).
 */
export const validators = {
  [LEGACY_KEYS.work](v) {
    if (!isObj(v)) return ['work data must be an object of dates'];
    const out = [];
    for (const [day, r] of Object.entries(v)) {
      if (!DATE.test(day)) out.push(`work: bad date key "${day}"`);
      if (!isObj(r)) { out.push(`work ${day}: record is not an object`); continue; }
      if (r.status !== undefined && !WORK_STATUSES.includes(r.status)) out.push(`work ${day}: unknown status "${r.status}"`);
      for (const f of ['hours', 'tips']) {
        if (r[f] !== undefined && !(Number.isFinite(Number(r[f])) && Number(r[f]) >= 0)) out.push(`work ${day}: ${f} is not a valid number`);
      }
    }
    return out;
  },
  [LEGACY_KEYS.workplaces](v) {
    if (!isObj(v)) return ['workplaces must be an object'];
    return Object.entries(v).filter(([, w]) => !isObj(w)).map(([n]) => `workplace "${n}" is not an object`);
  },
  [LEGACY_KEYS.finance](v) {
    if (!Array.isArray(v)) return ['finance must be a list'];
    const out = [];
    const ids = new Set();
    v.forEach((it, i) => {
      // Same rule as the old app's validItem(): the old app hides items that fail it.
      const ok = isObj(it) && ['income', 'expense'].includes(it.type) && DATE.test(it.date) && Number(it.amount) > 0;
      if (!ok) out.push(`finance #${i}: would be hidden by the app (type/date/amount)`);
      if (isObj(it) && it.id) { if (ids.has(it.id)) out.push(`finance #${i}: duplicate id ${it.id}`); ids.add(it.id); }
    });
    return out;
  },
  [LEGACY_KEYS.categories](v) {
    const ok = isObj(v) && ['income', 'expense'].every((t) => Array.isArray(v[t]) &&
      v[t].every((row) => Array.isArray(row) && row.slice(0, 3).every((x) => typeof x === 'string')));
    return ok ? [] : ['categories have an unexpected shape'];
  },
  [LEGACY_KEYS.subcategories](v) { return isObj(v) ? [] : ['subcategories must be an object']; },
  [LEGACY_KEYS.recurring](v) {
    if (!Array.isArray(v)) return ['recurring must be a list'];
    return v.flatMap((r, i) => (isObj(r) && typeof r.id === 'string' && Number(r.amount) > 0 &&
      Number(r.day) >= 1 && Number(r.day) <= 31 && MONTH.test(r.startMonth || '')) ? [] : [`recurring #${i}: invalid rule`]);
  },
  [TAVON_KEYS.shortcuts](v) {
    if (!Array.isArray(v)) return ['shortcuts must be a list'];
    return v.flatMap((r, i) => (isObj(r) && typeof r.id === 'string' && typeof r.label === 'string' && ['income', 'expense'].includes(r.type) && typeof r.category === 'string') ? [] : [`shortcut #${i}: invalid`]);
  },
  [TAVON_KEYS.shiftSchedule](v) {
    if (!Array.isArray(v)) return ['shift schedule must be a list'];
    return v.flatMap((r, i) => (isObj(r) && Number.isInteger(r.weekday) && r.weekday >= 0 && r.weekday <= 6 &&
      typeof r.place === 'string' && Number(r.hours) >= 0) ? [] : [`shift rule #${i}: invalid`]);
  },
};

/** Keys whose stored value is a plain string rather than JSON. */
export const STRING_KEYS = new Set([LEGACY_KEYS.workVersion, LEGACY_KEYS.restoreFoodFlag, LEGACY_KEYS.theme, LEGACY_KEYS.language]);

/** Read one key as the app sees it. Returns {value, raw, error}. */
export function readKey(storage, key) {
  const raw = storage.getItem(key);
  if (raw === null) return { value: undefined, raw };
  if (STRING_KEYS.has(key)) return { value: raw, raw };
  try { return { value: JSON.parse(raw), raw }; } catch { return { value: undefined, raw, error: 'not valid JSON' }; }
}
