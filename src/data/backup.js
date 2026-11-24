// Backup, import, snapshots and rollback for TAVON.
// Works with any Storage-like object (window.localStorage, or a fake one in tests).
import { LEGACY_KEYS, LEGACY_WORK_VERSION, SCHEMA_VERSION, TAVON_KEYS, isBackupKey, readKey, validators } from './schema.js';

const MAX_SNAPSHOTS = 3;
const FORMAT = 'tavon-backup';

function keysOf(storage) {
  const out = [];
  for (let i = 0; i < storage.length; i++) out.push(storage.key(i));
  return out;
}

/** Collect every app key exactly as stored (raw strings: nothing is re-encoded or lost). */
function collect(storage) {
  const data = {};
  for (const k of keysOf(storage)) if (isBackupKey(k)) data[k] = storage.getItem(k);
  return data;
}

/** Simple counts, used to compare before/after and shown to the person. */
export function summarize(rawData) {
  const parse = (k) => { try { return JSON.parse(rawData[k]); } catch { return undefined; } };
  const work = parse(LEGACY_KEYS.work);
  const fin = parse(LEGACY_KEYS.finance);
  const rec = parse(LEGACY_KEYS.recurring);
  const wp = parse(LEGACY_KEYS.workplaces);
  return {
    keys: Object.keys(rawData).length,
    workDays: work && typeof work === 'object' ? Object.keys(work).length : 0,
    workplaces: wp && typeof wp === 'object' ? Object.keys(wp).length : 0,
    transactions: Array.isArray(fin) ? fin.length : 0,
    recurringRules: Array.isArray(rec) ? rec.length : 0,
  };
}

/** Build a backup file (JSON string). */
export function createBackup(storage, now = new Date()) {
  const data = collect(storage);
  return JSON.stringify({ format: FORMAT, schema: SCHEMA_VERSION, exportedAt: now.toISOString(), summary: summarize(data), data }, null, 2);
}

/**
 * Read a backup file. Accepts:
 *  - TAVON format: { format: 'tavon-backup', data: { key: rawString } }
 *  - PP Space 2.0 format (the old "Export backup" text): { 'pee-…': rawString, … }
 * Returns { ok, data, summary, problems[], warnings[], source }.
 */
export function parseBackup(text) {
  let obj;
  try { obj = JSON.parse(String(text).trim()); } catch { return { ok: false, problems: ['This is not valid backup text (JSON).'] }; }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, problems: ['Backup must be a JSON object.'] };

  const source = obj.format === FORMAT ? 'tavon' : 'pp-space-2';
  const input = source === 'tavon' ? obj.data : obj;
  if (!input || typeof input !== 'object') return { ok: false, problems: ['Backup has no data.'] };

  const data = {};
  const ignored = [];
  for (const [k, v] of Object.entries(input)) {
    if (!isBackupKey(k)) { ignored.push(k); continue; }
    data[k] = typeof v === 'string' ? v : JSON.stringify(v); // old app also accepted already-parsed values
  }
  if (!Object.keys(data).length) return { ok: false, problems: ['No TAVON / PP Space data found in this backup.'] };

  const problems = [];
  const warnings = ignored.length ? [`Ignored unknown keys: ${ignored.join(', ')}`] : [];
  const fake = { getItem: (k) => (k in data ? data[k] : null) };
  for (const [k, check] of Object.entries(validators)) {
    if (!(k in data)) continue;
    const { value, error } = readKey(fake, k);
    if (error) { problems.push(`${k}: ${error}`); continue; }
    warnings.push(...check(value)); // record-level issues are warnings: data is kept as-is, never dropped
  }
  return { ok: problems.length === 0, data, summary: summarize(data), problems, warnings, source };
}

/* ---------- snapshots (automatic safety copies) ---------- */

export function listSnapshots(storage) {
  try { const s = JSON.parse(storage.getItem(TAVON_KEYS.snapshots) || '[]'); return Array.isArray(s) ? s : []; } catch { return []; }
}

/** Save the current data as a snapshot. Keeps the newest MAX_SNAPSHOTS. */
export function takeSnapshot(storage, reason, now = new Date()) {
  const data = collect(storage);
  const snap = { id: `snap-${now.getTime()}`, at: now.toISOString(), reason, summary: summarize(data), data };
  const list = [snap, ...listSnapshots(storage)].slice(0, MAX_SNAPSHOTS);
  storage.setItem(TAVON_KEYS.snapshots, JSON.stringify(list)); // throws if storage is full: caller must stop then
  return snap;
}

/** Replace all app keys with exactly `data` (removes app keys not present in it). */
function writeAll(storage, data) {
  for (const k of keysOf(storage)) if (isBackupKey(k) && !(k in data)) storage.removeItem(k);
  for (const [k, v] of Object.entries(data)) storage.setItem(k, v);
  // Keep the old app safe: it re-seeds work data whenever this marker is missing or different.
  if (LEGACY_KEYS.work in data) storage.setItem(LEGACY_KEYS.workVersion, LEGACY_WORK_VERSION);
}

/**
 * Import a parsed backup. Always takes a snapshot first; if writing fails
 * half-way, the snapshot is restored automatically.
 * Import REPLACES current data (no merge), so it can never create duplicates.
 */
export function importBackup(storage, parsed, now = new Date()) {
  if (!parsed || !parsed.ok) throw new Error('Backup is not valid; nothing was changed.');
  const snap = takeSnapshot(storage, 'before-import', now);
  try {
    writeAll(storage, parsed.data);
  } catch (err) {
    writeAll(storage, snap.data);
    throw new Error(`Import failed and was rolled back: ${err.message}`);
  }
  const after = summarize(collect(storage));
  return { snapshotId: snap.id, before: snap.summary, after };
}

/** Roll back to a snapshot (itself snapshotting the current state first, so this is undoable too). */
export function restoreSnapshot(storage, id, now = new Date()) {
  const snap = listSnapshots(storage).find((s) => s.id === id);
  if (!snap) throw new Error('Snapshot not found.');
  const undo = takeSnapshot(storage, 'before-restore', now);
  writeAll(storage, snap.data);
  return { restored: snap.id, undoSnapshotId: undo.id };
}
