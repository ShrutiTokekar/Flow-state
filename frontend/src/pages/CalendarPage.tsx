import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Plus, Download, ChevronLeft, ChevronRight, Share2, Sparkles, Users } from 'lucide-react';
import api from '../services/api';
import {
  sharedCalendarService,
  SharedCalendarSummary,
  SharedCalendarDetail,
  FreeSlot,
  errorMessage,
} from '../services/sharedCalendarService';
import { NewCalendarModal, ShareCalendarModal } from '../components/calendar/SharedCalendarModals';
import { FreeTimePanel } from '../components/calendar/FreeTimePanel';
import { PageHeader } from '../components/ui/PageHeader';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'reminder';
  color?: string;
  taskId?: number;
  completed?: boolean;
  createdByName?: string;
}

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  category?: any;
}

type ViewMode = 'month' | 'week' | 'day';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const statusColor: Record<string, string> = {
  TODO: '#8894d1',
  IN_PROGRESS: '#87ceeb',
  DONE: '#cae892',
};

const typeColor: Record<string, string> = {
  task: '#8894d1',
  event: '#dfa4c6',
  reminder: '#fde68a',
};

const pad = (n: number) => String(n).padStart(2, '0');
const toInputValue = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const isSmallScreen = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;

interface EventModalProps {
  event: Partial<CalendarEvent> | null;
  shared: boolean;
  readOnly: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: number) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, shared, readOnly, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startTime, setStartTime] = useState(event?.startTime ? event.startTime.slice(0, 16) : '');
  const [endTime, setEndTime] = useState(event?.endTime ? event.endTime.slice(0, 16) : '');
  const [type, setType] = useState<string>(event?.type || 'event');
  const [completed, setCompleted] = useState(!!event?.completed);

  const endBeforeStart = !!startTime && !!endTime && endTime < startTime;
  const canSave = !readOnly && title.trim() && startTime && endTime && !endBeforeStart;

  const handleSubmit = () => {
    if (!canSave) return;
    onSave({ title, description, startTime, endTime, type, ...(shared ? { completed } : {}) });
  };

  const heading = readOnly ? 'Details' : event?.id ? 'Edit' : 'Add to calendar';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4" role="dialog" aria-modal="true" aria-label={heading} onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto pb-[env(safe-area-inset-bottom)]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold font-heading text-gray-900">{heading}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1">×</button>
        </div>
        <fieldset disabled={readOnly} className="p-5 space-y-4">
          <div>
            <label htmlFor="ev-title" className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              id="ev-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-flow-purple"
              placeholder={type === 'task' ? 'What needs doing?' : 'Event title'}
            />
          </div>
          <div>
            <label htmlFor="ev-desc" className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              id="ev-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-flow-purple"
              placeholder="Optional"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ev-start" className="block text-sm font-semibold text-gray-700 mb-1">Start *</label>
              <input
                id="ev-start"
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple text-sm"
              />
            </div>
            <div>
              <label htmlFor="ev-end" className="block text-sm font-semibold text-gray-700 mb-1">End *</label>
              <input
                id="ev-end"
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple text-sm"
              />
            </div>
          </div>
          {endBeforeStart && <p className="text-sm text-red-600" role="alert">End time must be after the start.</p>}
          <div>
            <label htmlFor="ev-type" className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
            <select
              id="ev-type"
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple bg-white"
            >
              <option value="event">Event 📅</option>
              {(shared || event?.type === 'task') && <option value="task">{shared ? 'Shared task ✅' : 'Task ✅'}</option>}
              <option value="reminder">Reminder 🔔</option>
            </select>
          </div>
          {shared && type === 'task' && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={completed} onChange={e => setCompleted(e.target.checked)} className="h-4 w-4 accent-flow-purple" />
              Done
            </label>
          )}
          {event?.createdByName && shared && (
            <p className="text-xs text-gray-500">Added by {event.createdByName}</p>
          )}
        </fieldset>
        {!readOnly && (
          <div className="flex justify-between items-center px-5 pb-5">
            {event?.id && onDelete ? (
              <button
                onClick={() => onDelete(event.id!)}
                className="px-4 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium text-sm"
              >
                Delete
              </button>
            ) : <div />}
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm">Cancel</button>
              <button
                onClick={handleSubmit}
                disabled={!canSave}
                className="px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium text-sm disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CalendarPage: React.FC = () => {
  const routerNavigate = useNavigate();
  const params = useParams<{ calendarId?: string }>();
  const calendarId = params.calendarId ? Number(params.calendarId) : undefined;
  const shared = calendarId !== undefined;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(() => (isSmallScreen() ? 'day' : 'month'));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendars, setCalendars] = useState<SharedCalendarSummary[]>([]);
  const [detail, setDetail] = useState<SharedCalendarDetail | null>(null);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [draft, setDraft] = useState<Partial<CalendarEvent> | null>(null);
  const [showNewCalendar, setShowNewCalendar] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showFreeTime, setShowFreeTime] = useState(false);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);
  const [dataVersion, setDataVersion] = useState(0); // bumps after each load so free time refreshes

  const readOnly = shared && detail?.role === 'VIEWER';
  const timeGridRef = useRef<HTMLDivElement>(null);
  const HOUR_HEIGHT = 56;

  // Start the day/week grid at 7am instead of midnight.
  useEffect(() => {
    if (viewMode !== 'month' && timeGridRef.current) timeGridRef.current.scrollTop = 7 * HOUR_HEIGHT;
  }, [viewMode]);

  const loadCalendars = useCallback(() => {
    sharedCalendarService.list().then(setCalendars).catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setError('');
    try {
      if (calendarId !== undefined) {
        const [d, evs] = await Promise.all([
          sharedCalendarService.get(calendarId),
          sharedCalendarService.events(calendarId),
        ]);
        setDetail(d);
        setEvents(evs);
        setTasks([]);
      } else {
        const [eventsRes, tasksRes] = await Promise.all([
          api.get('/calendar/events'),
          api.get('/tasks'),
        ]);
        setDetail(null);
        setEvents(eventsRes.data);
        setTasks(tasksRes.data);
      }
      setDataVersion(v => v + 1);
    } catch (e) {
      console.error('Failed to load calendar data:', e);
      setError(errorMessage(e, 'Could not load this calendar.'));
    }
  }, [calendarId]);

  useEffect(() => { loadCalendars(); }, [loadCalendars]);

  // Deep links from the sidebar and dashboard: ?new=1 opens "New shared calendar", ?freeTime=1 opens free time.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (searchParams.get('new')) setShowNewCalendar(true);
    if (searchParams.get('freeTime')) {
      setShowFreeTime(true);
      setViewMode(v => (v === 'month' ? (isSmallScreen() ? 'day' : 'week') : v));
    }
    if (searchParams.get('new') || searchParams.get('freeTime')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  useEffect(() => { loadData(); }, [loadData]);

  // Convert tasks with due dates into calendar-renderable items
  const taskItems = tasks
    .filter(t => t.dueDate && t.status !== 'DONE')
    .map(t => ({
      id: -t.id,
      title: '📌 ' + t.title,
      startTime: t.dueDate!.includes('T') ? t.dueDate! : t.dueDate + 'T09:00:00',
      endTime: t.dueDate!.includes('T') ? t.dueDate! : t.dueDate + 'T10:00:00',
      type: 'task' as const,
      color: statusColor[t.status] || '#8894d1',
      taskId: t.id,
    }));

  const allItems: CalendarEvent[] = [
    ...events.map(e => ({
      ...e,
      title: shared && e.type === 'task' ? `${e.completed ? '✓' : '○'} ${e.title}` : e.title,
      color: e.color || typeColor[e.type] || '#dfa4c6',
    })),
    ...taskItems,
  ];

  // ── Helpers ──────────────────────────────────────────────────────────────

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const itemsForDay = (date: Date) =>
    allItems.filter(e => isSameDay(new Date(e.startTime), date));

  // True if any free slot covers part of this hour — used to shade the grid.
  const isFreeHour = (date: Date, hour: number) => {
    if (!freeSlots.length) return false;
    const hStart = new Date(date);
    hStart.setHours(hour, 0, 0, 0);
    const hEnd = new Date(hStart.getTime() + 3600_000);
    return freeSlots.some(s => new Date(s.start) < hEnd && new Date(s.end) > hStart);
  };

  // Navigation
  const navigate = (dir: 1 | -1) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const headerLabel = () => {
    if (viewMode === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (viewMode === 'week') {
      const days = getWeekDays(currentDate);
      return `${MONTHS[days[0].getMonth()].slice(0,3)} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()].slice(0,3)} ${days[6].getDate()}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const openNew = (start?: Date, end?: Date) => {
    if (readOnly) return;
    setSelectedEvent(null);
    if (start) {
      const e = end || new Date(start.getTime() + 30 * 60_000);
      setDraft({ startTime: toInputValue(start), endTime: toInputValue(e) });
    } else {
      setDraft({});
    }
    setShowModal(true);
  };

  const openEdit = (item: CalendarEvent) => {
    if (item.id < 0) return; // personal task from the Kanban board — edit it there
    const original = events.find(e => e.id === item.id) || item;
    setSelectedEvent(original);
    setShowModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (calendarId !== undefined) {
        if (selectedEvent?.id) await sharedCalendarService.updateEvent(calendarId, selectedEvent.id, data);
        else await sharedCalendarService.createEvent(calendarId, data);
      } else if (selectedEvent?.id) {
        await api.put(`/calendar/events/${selectedEvent.id}`, data);
      } else {
        await api.post('/calendar/events', data);
      }
      await loadData();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      setError(errorMessage(e, 'Could not save. Please try again.'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      if (calendarId !== undefined) await sharedCalendarService.deleteEvent(calendarId, id);
      else await api.delete(`/calendar/events/${id}`);
      await loadData();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      setError(errorMessage(e, 'Could not delete. Please try again.'));
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/calendar/export/ics', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/calendar' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowstate-calendar.ics';
      a.click();
    } catch (e) {
      console.error('Export failed:', e);
    }
  };

  const toggleFreeTime = () => {
    if (!showFreeTime && viewMode === 'month') setViewMode(isSmallScreen() ? 'day' : 'week');
    setShowFreeTime(v => !v);
  };

  const pickFreeSlot = (slot: FreeSlot) => {
    const start = new Date(slot.start);
    const end = new Date(Math.min(new Date(slot.end).getTime(), start.getTime() + 60 * 60_000));
    setCurrentDate(start);
    openNew(start, end);
  };

  // ── Event pill ────────────────────────────────────────────────────────────

  const EventPill = ({ item }: { item: CalendarEvent }) => (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); item.id > 0 && openEdit(item); }}
      className={`block w-full text-left text-[11px] sm:text-xs px-1.5 py-0.5 rounded truncate hover:opacity-80 text-white font-medium ${item.completed ? 'line-through opacity-60' : ''}`}
      style={{ backgroundColor: item.color }}
      title={item.createdByName ? `${item.title} — added by ${item.createdByName}` : item.title}
    >
      {item.title}
    </button>
  );

  // ── Views ─────────────────────────────────────────────────────────────────

  // Plain render functions (not components) so re-renders don't remount the grid and lose scroll position.
  const renderMonth = () => (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[11px] sm:text-xs font-semibold text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {getMonthDays().map((date, i) => {
          const isToday = date && isSameDay(date, new Date());
          const dayItems = date ? itemsForDay(date) : [];
          return (
            <div
              key={i}
              onClick={() => {
                if (!date) return;
                if (isSmallScreen()) { setCurrentDate(date); setViewMode('day'); return; }
                const s = new Date(date); s.setHours(9, 0, 0, 0);
                openNew(s);
              }}
              className={`min-h-[64px] sm:min-h-[100px] border-r border-b border-gray-100 p-0.5 sm:p-1 cursor-pointer hover:bg-gray-50 ${!date ? 'bg-gray-50' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-xs sm:text-sm font-medium w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-flow-purple text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  {/* Phones: colored dots. Larger screens: titled pills. */}
                  <div className="flex flex-wrap gap-0.5 sm:hidden px-0.5">
                    {dayItems.slice(0, 4).map((item, j) => (
                      <span key={j} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    ))}
                  </div>
                  <div className="space-y-0.5 hidden sm:block">
                    {dayItems.slice(0, 3).map((item, j) => <EventPill key={j} item={item} />)}
                    {dayItems.length > 3 && <div className="text-xs text-gray-400 pl-1">+{dayItems.length - 3} more</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Position a day's items by their real start/end, putting overlapping items side by side.
  const layoutDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const items = itemsForDay(date)
      .map(item => {
        const start = Math.max(0, (new Date(item.startTime).getTime() - dayStart.getTime()) / 60_000);
        const rawEnd = (new Date(item.endTime).getTime() - dayStart.getTime()) / 60_000;
        // Deadlines have no length; give every block enough height to read.
        const end = Math.min(24 * 60, Math.max(rawEnd, start + 30));
        return { item, start, end, col: 0, cols: 1 };
      })
      .sort((a, b) => a.start - b.start || b.end - a.end);

    let cluster: typeof items = [];
    let clusterEnd = -1;
    const colEnds: number[] = [];
    const closeCluster = () => {
      const n = Math.max(1, ...cluster.map(c => c.col + 1));
      cluster.forEach(c => { c.cols = n; });
      cluster = [];
      colEnds.length = 0;
    };
    items.forEach(it => {
      if (it.start >= clusterEnd) closeCluster();
      let col = colEnds.findIndex(e => e <= it.start);
      if (col === -1) col = colEnds.length;
      colEnds[col] = it.end;
      it.col = col;
      cluster.push(it);
      clusterEnd = Math.max(clusterEnd, it.end);
    });
    closeCluster();
    return items;
  };

  const minutesLabel = (m: number) => {
    const h = Math.floor(m / 60) % 24, mm = Math.round(m % 60);
    return `${h % 12 || 12}${mm ? ':' + String(mm).padStart(2, '0') : ''}${h < 12 ? 'am' : 'pm'}`;
  };

  const renderTimeGrid = (days: Date[]) => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return (
      <div ref={timeGridRef} className="flex-1 min-h-0 overflow-auto">
        <div className={days.length > 1 ? 'min-w-[640px]' : ''}>
          {/* Day headers */}
          <div className="grid border-b border-gray-200 sticky top-0 bg-white z-20" style={{ gridTemplateColumns: `52px repeat(${days.length}, 1fr)` }}>
            <div className="py-2" />
            {days.map((d, i) => {
              const isToday = isSameDay(d, now);
              return (
                <div key={i} className="py-2 text-center">
                  <div className="text-xs text-gray-500 font-medium">{DAYS[d.getDay()]}</div>
                  <div className={`text-lg font-bold mx-auto w-9 h-9 flex items-center justify-center rounded-full ${isToday ? 'bg-flow-purple text-white' : 'text-gray-800'}`}>
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid" style={{ gridTemplateColumns: `52px repeat(${days.length}, 1fr)` }}>
            {/* Hour labels */}
            <div className="border-r border-gray-100">
              {HOURS.map(hour => (
                <div key={hour} className="text-right pr-2 pt-1 text-xs text-gray-400" style={{ height: HOUR_HEIGHT }}>
                  {hour === 0 ? '' : `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}`}
                </div>
              ))}
            </div>

            {days.map((d, i) => (
              <div key={i} className="relative border-r border-gray-100" style={{ height: 24 * HOUR_HEIGHT }}>
                {/* Hour cells: click to add, shaded when free */}
                {HOURS.map(hour => {
                  const free = isFreeHour(d, hour);
                  return (
                    <div
                      key={hour}
                      onClick={() => {
                        const dt = new Date(d);
                        dt.setHours(hour, 0, 0, 0);
                        openNew(dt);
                      }}
                      className={`relative border-b border-gray-100 ${readOnly ? '' : 'cursor-pointer hover:bg-gray-50'} ${free ? 'bg-green-50' : ''}`}
                      style={{ height: HOUR_HEIGHT }}
                    >
                      {free && <span className="absolute inset-y-0 left-0 w-1 bg-green-300" aria-hidden />}
                    </div>
                  );
                })}

                {/* Current time */}
                {isSameDay(d, now) && (
                  <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }} aria-hidden>
                    <div className="h-0.5 bg-red-500" />
                    <div className="absolute -left-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Events */}
                {layoutDay(d).map(({ item, start, end, col, cols }, j) => {
                  const height = ((end - start) / 60) * HOUR_HEIGHT;
                  return (
                    <button
                      key={`${item.id}-${j}`}
                      type="button"
                      onClick={e => { e.stopPropagation(); item.id > 0 && openEdit(item); }}
                      title={item.createdByName ? `${item.title} — added by ${item.createdByName}` : item.title}
                      className={`absolute z-[5] rounded-md px-1.5 py-0.5 text-left text-white text-[11px] sm:text-xs leading-tight overflow-hidden shadow-sm ring-1 ring-white hover:brightness-95 ${item.completed ? 'opacity-60 line-through' : ''}`}
                      style={{
                        top: (start / 60) * HOUR_HEIGHT + 1,
                        height: Math.max(height - 2, 18),
                        left: `calc(${(col / cols) * 100}% + 2px)`,
                        width: `calc(${100 / cols}% - 4px)`,
                        backgroundColor: item.color,
                      }}
                    >
                      <div className="font-semibold truncate">{item.title}</div>
                      {height >= 36 && (
                        <div className="opacity-90 truncate">
                          {minutesLabel(start)}{end - start > 30 || new Date(item.endTime) > new Date(item.startTime) ? `–${minutesLabel(end)}` : ''}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const chipClass = (active: boolean) =>
    `flex items-center gap-2 shrink-0 px-3 py-2 rounded-full text-sm border transition-colors ${
      active ? 'bg-flow-purple border-flow-purple text-white shadow-sm font-medium' : 'bg-white/70 border-transparent text-gray-700 hover:bg-white'
    }`;

  return (
    <Layout>
      <div className="flex flex-col lg:h-full max-w-7xl mx-auto [&>*]:shrink-0">
        <PageHeader
          title={shared ? (detail?.name ?? 'Shared calendar') : 'Calendar'}
          subtitle={shared ? 'Shared calendar · everyone here can see these items' : 'Your events, reminders and task due dates'}
          actions={
            <>
              {shared ? (
                <button onClick={() => setShowShare(true)} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 text-sm font-medium">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              ) : (
                <button onClick={handleExport} className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl hover:bg-gray-50 text-sm font-medium" title="Download an .ics file you can open in Apple Calendar">
                  <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export to Apple Calendar</span><span className="sm:hidden">Export</span>
                </button>
              )}
              {!readOnly && (
                <button onClick={() => openNew()} className="hidden md:flex items-center gap-1.5 px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 text-sm font-medium shadow-sm">
                  <Plus className="h-4 w-4" /> Add
                </button>
              )}
            </>
          }
        />

        {/* Calendar switcher */}
        <nav aria-label="Calendars" className="-mx-3 sm:mx-0 px-3 sm:px-0 mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button onClick={() => routerNavigate('/calendar')} className={chipClass(!shared)} aria-current={!shared ? 'page' : undefined}>
            <span className={`h-2.5 w-2.5 rounded-full ${!shared ? 'bg-white' : 'bg-flow-purple'}`} /> My calendar
          </button>
          {calendars.map(c => (
            <button
              key={c.id}
              onClick={() => routerNavigate(`/calendars/${c.id}`)}
              className={chipClass(c.id === calendarId)}
              aria-current={c.id === calendarId ? 'page' : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ backgroundColor: c.color }} />
              {c.name}
              <span className="flex items-center gap-0.5 text-xs opacity-70"><Users className="h-3 w-3" />{c.memberCount}</span>
            </button>
          ))}
          <button onClick={() => setShowNewCalendar(true)} className="flex items-center gap-1 shrink-0 px-3 py-2 rounded-full text-sm text-flow-purple border border-dashed border-flow-purple hover:bg-white">
            <Plus className="h-4 w-4" /> New shared calendar
          </button>
        </nav>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-flow-lavender rounded-2xl p-1.5 sm:p-2">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button onClick={() => navigate(-1)} aria-label="Previous" className="p-2 hover:bg-white/70 rounded-lg"><ChevronLeft className="h-5 w-5" /></button>
            <button onClick={() => navigate(1)} aria-label="Next" className="p-2 hover:bg-white/70 rounded-lg"><ChevronRight className="h-5 w-5" /></button>
            <h2 className="text-base sm:text-lg font-semibold font-sans text-gray-900 px-1 sm:px-2 whitespace-nowrap" aria-live="polite">{headerLabel()}</h2>
            <button onClick={() => setCurrentDate(new Date())} className="ml-1 px-3 py-1.5 text-sm bg-white text-gray-800 rounded-lg hover:bg-flow-yellow">Today</button>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-white/70 rounded-lg p-1" role="group" aria-label="View">
              {(['month','week','day'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  aria-pressed={viewMode === v}
                  className={`px-2.5 sm:px-3 py-1 text-sm rounded-md capitalize transition-all ${viewMode === v ? 'bg-flow-purple shadow text-white font-medium' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button
              onClick={toggleFreeTime}
              aria-pressed={showFreeTime}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${showFreeTime ? 'bg-green-600 text-white' : 'bg-flow-green text-gray-800 hover:bg-green-200'}`}
            >
              <Sparkles className="h-4 w-4" /> Free time
            </button>
          </div>
        </div>

        {/* Legend / context line */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
          {shared && detail ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: detail.color }} />
                Shared by {detail.ownerName} · {detail.members.length} member{detail.members.length === 1 ? '' : 's'}
              </span>
              {readOnly && <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">View only</span>}
              <span className="text-gray-400">○ = shared task · ✓ = done</span>
            </>
          ) : (
            <>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#8894d1'}} /> To Do task</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#87ceeb'}} /> In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#dfa4c6'}} /> Event</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#fde68a'}} /> Reminder</span>
              <span className="text-gray-400">📌 = from Tasks</span>
            </>
          )}
          {freeSlots.length > 0 && <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-green-200" /> Free</span>}
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700" role="alert">{error}</div>
        )}

        {/* Calendar body + free-time panel */}
        <div className="flex-1 min-h-0 !shrink flex flex-col-reverse lg:flex-row gap-3">
          <div className="shrink-0 h-[68dvh] min-h-[420px] lg:shrink lg:flex-1 lg:h-auto bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            {viewMode === 'month' && renderMonth()}
            {viewMode === 'week' && renderTimeGrid(getWeekDays(currentDate))}
            {viewMode === 'day' && renderTimeGrid([currentDate])}
          </div>
          {showFreeTime && (
            <FreeTimePanel
              weekStart={getWeekDays(currentDate)[0]}
              calendarId={calendarId}
              memberCount={detail?.members.length}
              refreshKey={dataVersion}
              onSlotsChange={setFreeSlots}
              onPick={pickFreeSlot}
              onClose={() => setShowFreeTime(false)}
            />
          )}
        </div>
      </div>

      {showModal && (
        <EventModal
          event={selectedEvent ?? draft ?? {}}
          shared={shared}
          readOnly={!!readOnly}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onDelete={selectedEvent?.id ? handleDelete : undefined}
        />
      )}

      {showNewCalendar && (
        <NewCalendarModal
          onClose={() => setShowNewCalendar(false)}
          onCreated={cal => {
            setShowNewCalendar(false);
            loadCalendars();
            routerNavigate(`/calendars/${cal.id}`);
            setShowShare(true);
          }}
        />
      )}

      {showShare && calendarId !== undefined && (
        <ShareCalendarModal
          calendarId={calendarId}
          onClose={() => setShowShare(false)}
          onChanged={() => { loadCalendars(); loadData(); }}
          onGone={() => { setShowShare(false); loadCalendars(); routerNavigate('/calendar'); }}
        />
      )}
      {/* Phones: floating Add button above the tab bar */}
      {!readOnly && (
        <button
          onClick={() => openNew()}
          aria-label="Add to calendar"
          className="md:hidden fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 h-14 w-14 rounded-full bg-flow-purple text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </Layout>
  );
};

export default CalendarPage;
