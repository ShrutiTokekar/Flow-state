import React, { useEffect, useState } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';
import { sharedCalendarService, FreeSlot, errorMessage } from '../../services/sharedCalendarService';

const pad = (n: number) => String(n).padStart(2, '0');
export const toDateParam = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h: number) => (h === 0 || h === 24 ? '12am' : h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`);
const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(':00', '').replace(' ', '').toLowerCase();
const durationLabel = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  return h && m ? `${h}h ${m}m` : h ? `${h}h` : `${m}m`;
};

interface Props {
  weekStart: Date;           // first day (Sunday) of the week being shown
  calendarId?: number;       // set → "when is everyone free" on a shared calendar
  memberCount?: number;
  refreshKey?: number;       // changes when calendar data changes
  onSlotsChange: (slots: FreeSlot[]) => void;
  onPick: (slot: FreeSlot) => void;
  onClose: () => void;
}

export const FreeTimePanel: React.FC<Props> = ({ weekStart, calendarId, memberCount, refreshKey, onSlotsChange, onPick, onClose }) => {
  const [dayStart, setDayStart] = useState(8);
  const [dayEnd, setDayEnd] = useState(22);
  const [minMinutes, setMinMinutes] = useState(60);
  const [slots, setSlots] = useState<FreeSlot[] | null>(null);
  const [error, setError] = useState('');

  const from = toDateParam(weekStart);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const to = toDateParam(weekEnd);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setError('');
    sharedCalendarService
      .freeTime({ from, to, dayStart: `${pad(dayStart)}:00`, dayEnd: dayEnd === 24 ? '00:00' : `${pad(dayEnd)}:00`, minMinutes }, calendarId)
      .then(s => { if (!cancelled) { setSlots(s); onSlotsChange(s); } })
      .catch(e => { if (!cancelled) setError(errorMessage(e, 'Could not load free time.')); });
    return () => { cancelled = true; };
  }, [from, to, dayStart, dayEnd, minMinutes, calendarId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => onSlotsChange([]), []); // eslint-disable-line react-hooks/exhaustive-deps

  const byDay = new Map<string, FreeSlot[]>();
  (slots || []).forEach(s => {
    const key = s.start.slice(0, 10);
    byDay.set(key, [...(byDay.get(key) || []), s]);
  });
  const totalMinutes = (slots || []).reduce((sum, s) => sum + s.minutes, 0);
  const shared = calendarId !== undefined;

  return (
    <aside className="bg-white rounded-2xl border border-gray-200 flex flex-col overflow-hidden lg:w-80 shrink-0 max-h-[70vh] lg:max-h-none" aria-label="Free time">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <div>
          <h3 className="font-heading text-xl text-gray-900 flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-flow-purple" /> {shared ? 'When everyone’s free' : 'Your free time'}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {!shared
              ? 'Open slots this week, around your events and shared calendars'
              : memberCount
                ? `Open for all ${memberCount} members this week`
                : 'Open for every member this week'}
          </p>
        </div>
        <button onClick={onClose} aria-label="Close free time" className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 px-4 py-3 text-xs">
        <label className="flex flex-col gap-1 text-gray-600">
          From
          <select value={dayStart} onChange={e => setDayStart(+e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800">
            {HOUR_OPTIONS.slice(0, 24).map(h => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-gray-600">
          Until
          <select value={dayEnd} onChange={e => setDayEnd(+e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800">
            {HOUR_OPTIONS.filter(h => h > dayStart).map(h => <option key={h} value={h}>{hourLabel(h)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-gray-600">
          At least
          <select value={minMinutes} onChange={e => setMinMinutes(+e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-800">
            {[15, 30, 60, 90, 120, 180].map(m => <option key={m} value={m}>{durationLabel(m)}</option>)}
          </select>
        </label>
      </div>

      <div className="px-4 pb-2">
        {slots && (
          <div className="rounded-xl bg-flow-green/60 px-3 py-2 text-sm text-gray-800">
            <strong>{durationLabel(totalMinutes)}</strong> free across {slots.length} slot{slots.length === 1 ? '' : 's'}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        {!slots && !error && <p className="text-sm text-gray-500">Finding open time…</p>}
        {slots && slots.length === 0 && (
          <p className="text-sm text-gray-500">No open slots that long this week. Try a shorter length or wider hours.</p>
        )}
        {Array.from(byDay.entries()).map(([day, daySlots]) => (
          <div key={day}>
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
              {new Date(day + 'T00:00').toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
            <ul className="space-y-1.5">
              {daySlots.map(s => (
                <li key={s.start}>
                  <button
                    onClick={() => onPick(s)}
                    className="group w-full flex items-center justify-between gap-2 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 px-3 py-2 text-left"
                  >
                    <span className="text-sm text-gray-800">
                      {timeLabel(s.start)} – {timeLabel(s.end)}
                      <span className="text-gray-500"> · {durationLabel(s.minutes)}</span>
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-700 opacity-70 group-hover:opacity-100">
                      <Plus className="h-3.5 w-3.5" /> Plan
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
};
