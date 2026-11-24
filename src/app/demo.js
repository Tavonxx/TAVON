// @ts-check
// Sample data for "preview" mode. Lives in memory only and is never written to storage.
import { addDays, weekStartKey, todayKey } from '../data/stats.js';

/** @param {string} [today] */
export function demoData(today = todayKey()) {
  const mon = weekStartKey(today), month = today.slice(0, 7), prev = addDays(today.slice(0, 7) + '-01', -1).slice(0, 7);
  const rules = [1, 2, 5, 6].map((weekday) => ({ weekday, place: 'Sample Kitchen', time: '11:30 AM – 10:00 PM', hours: 10.5 }));
  return {
    work: { [mon]: { status: 'worked', hours: 10.5, tips: 62.5, place: 'Sample Kitchen' }, [addDays(mon, 1)]: { status: 'worked', hours: 10.5, tips: 48 } },
    rules,
    items: [
      { id: 'd1', type: 'income', date: `${prev}-28`, amount: 1840, category: 'salary' },
      { id: 'd2', type: 'expense', date: `${prev}-29`, amount: 640, category: 'bills' },
      { id: 'd3', type: 'income', date: `${month}-01`, amount: 520.4, category: 'salary' },
      { id: 'd4', type: 'expense', date: `${month}-02`, amount: 86.35, category: 'food' },
      { id: 'd5', type: 'expense', date: `${month}-03`, amount: 14.2, category: 'food' },
      { id: 'd6', type: 'expense', date: `${month}-04`, amount: 62, category: 'transport' },
    ],
    recurring: [{ id: 'r1', amount: 55, day: Number(addDays(today, 3).slice(8)), startMonth: '2026-01', category: 'bills' }],
    lastBackup: String(Date.now() - 9 * 86400000),
  };
}
