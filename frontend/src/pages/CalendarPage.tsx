import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Plus, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'reminder';
  color?: string;
  taskId?: number;
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

interface EventModalProps {
  event: Partial<CalendarEvent> | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: number) => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [startTime, setStartTime] = useState(event?.startTime ? event.startTime.slice(0, 16) : '');
  const [endTime, setEndTime] = useState(event?.endTime ? event.endTime.slice(0, 16) : '');
  const [type, setType] = useState<string>(event?.type || 'event');

  const handleSubmit = () => {
    if (!title.trim() || !startTime || !endTime) return;
    onSave({ title, description, startTime, endTime, type });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold font-heading text-gray-900">
            {event?.id ? 'Edit Event' : 'Add Event'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              placeholder="Event title"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              placeholder="Optional"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Start *</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-flow-purple text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">End *</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-flow-purple text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-flow-purple"
            >
              <option value="event">Event 📅</option>
              <option value="reminder">Reminder 🔔</option>
            </select>
          </div>
        </div>
        <div className="flex justify-between items-center px-6 pb-6">
          {event?.id && onDelete ? (
            <button
              onClick={() => onDelete(event.id!)}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium text-sm"
            >
              Delete
            </button>
          ) : <div />}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !startTime || !endTime}
              className="px-4 py-2 bg-flow-purple text-white rounded-xl hover:bg-purple-600 font-medium text-sm disabled:opacity-50"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Partial<CalendarEvent> | null>(null);
  const [defaultStart, setDefaultStart] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [eventsRes, tasksRes] = await Promise.all([
        api.get('/calendar/events'),
        api.get('/tasks'),
      ]);
      setEvents(eventsRes.data);
      setTasks(tasksRes.data);
    } catch (e) {
      console.error('Failed to load calendar data:', e);
    }
  };

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

  const allItems = [...events.map(e => ({ ...e, color: e.color || typeColor[e.type] || '#dfa4c6' })), ...taskItems];

  // ── Helpers ──────────────────────────────────────────────────────────────

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const getWeekDays = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
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

  const itemsForHour = (date: Date, hour: number) =>
    allItems.filter(e => {
      const s = new Date(e.startTime);
      return isSameDay(s, date) && s.getHours() === hour;
    });

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
      return `${MONTHS[days[0].getMonth()].slice(0,3)} ${days[0].getDate()} – ${MONTHS[days[6].getMonth()].slice(0,3)} ${days[6].getDate()}, ${days[6].getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ── CRUD ─────────────────────────────────────────────────────────────────

  const openNew = (startStr?: string) => {
    setSelectedEvent(null);
    setDefaultStart(startStr || '');
    setShowModal(true);
  };

  const openEdit = (item: CalendarEvent) => {
    if (item.id < 0) return; // task — don't edit here
    setSelectedEvent(item);
    setShowModal(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedEvent?.id) {
        await api.put(`/calendar/events/${selectedEvent.id}`, data);
      } else {
        await api.post('/calendar/events', data);
      }
      await loadData();
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/calendar/events/${id}`);
      await loadData();
      setShowModal(false);
    } catch (e) { console.error(e); }
  };

  const handleExport = async () => {
    try {
      // Get current month's date range
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Format as ISO strings (YYYY-MM-DDTHH:mm:ss)
      const startStr = start.toISOString().split('.')[0];
      const endStr = end.toISOString().split('.')[0];
      
      const response = await api.get(`/calendar/export/ics?start=${startStr}&end=${endStr}`, { 
        responseType: 'blob' 
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flowstate-calendar.ics';
      a.click();
    } catch (e) { 
      console.error('Export failed:', e); 
    }
  };

  // ── Event pill ────────────────────────────────────────────────────────────

  const EventPill = ({ item }: { item: typeof allItems[0] }) => (
    <div
      onClick={() => item.id > 0 && openEdit(item as CalendarEvent)}
      className="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 text-white font-medium"
      style={{ backgroundColor: item.color }}
      title={item.title}
    >
      {item.title}
    </div>
  );

  // ── Views ─────────────────────────────────────────────────────────────────

  const MonthView = () => (
    <div className="flex-1 overflow-auto">
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAYS.map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 flex-1">
        {getMonthDays().map((date, i) => {
          const isToday = date && isSameDay(date, new Date());
          const dayItems = date ? itemsForDay(date) : [];
          return (
            <div
              key={i}
              onClick={() => date && openNew(`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}T09:00`)}
              className={`min-h-[100px] border-r border-b border-gray-100 p-1 cursor-pointer hover:bg-gray-50 ${!date ? 'bg-gray-50' : ''}`}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-flow-purple text-white' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
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

  const TimeGrid = ({ days }: { days: Date[] }) => (
    <div className="flex-1 overflow-auto">
      {/* Day headers */}
      <div className={`grid border-b border-gray-200 sticky top-0 bg-white z-10`} style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)` }}>
        <div className="py-2" />
        {days.map((d, i) => {
          const isToday = isSameDay(d, new Date());
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
      {/* Hour rows */}
      {HOURS.map(hour => (
        <div key={hour} className="grid" style={{ gridTemplateColumns: `64px repeat(${days.length}, 1fr)`, minHeight: '60px' }}>
          <div className="text-right pr-2 pt-1 text-xs text-gray-400 border-r border-gray-100">
            {hour === 0 ? '' : `${hour % 12 || 12}${hour < 12 ? 'a' : 'p'}`}
          </div>
          {days.map((d, i) => {
            const hourItems = itemsForHour(d, hour);
            return (
              <div
                key={i}
                onClick={() => {
                  const dt = new Date(d);
                  dt.setHours(hour, 0);
                  const str = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}T${String(hour).padStart(2,'0')}:00`;
                  openNew(str);
                }}
                className="border-r border-b border-gray-100 p-0.5 cursor-pointer hover:bg-gray-50 relative"
              >
                {hourItems.map((item, j) => <EventPill key={j} item={item} />)}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="flex flex-col h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-lg font-bold font-heading text-gray-900 min-w-[200px] text-center">{headerLabel()}</h2>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight className="h-5 w-5" /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm bg-flow-lavender text-gray-700 rounded-lg hover:bg-purple-200">Today</button>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['month','week','day'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  className={`px-3 py-1 text-sm rounded-md capitalize transition-all ${viewMode === v ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {v}
                </button>
              ))}
            </div>
            <button onClick={handleExport} className="flex items-center gap-1.5 px-3 py-2 bg-flow-lavender text-gray-700 rounded-lg hover:bg-purple-200 text-sm">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button onClick={() => openNew()} className="flex items-center gap-1.5 px-3 py-2 bg-flow-purple text-white rounded-lg hover:bg-purple-600 text-sm">
              <Plus className="h-4 w-4" />
              Add Event
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-600">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#8894d1'}} /> To Do task</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#87ceeb'}} /> In Progress</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#dfa4c6'}} /> Event</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{background:'#fde68a'}} /> Reminder</span>
          <span className="text-gray-400">📌 = from Tasks</span>
        </div>

        {/* Calendar body */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
          {viewMode === 'month' && <MonthView />}
          {viewMode === 'week' && <TimeGrid days={getWeekDays(currentDate)} />}
          {viewMode === 'day' && <TimeGrid days={[currentDate]} />}
        </div>
      </div>

      {showModal && (
        <EventModal
          event={selectedEvent ?? (defaultStart ? { startTime: defaultStart, endTime: defaultStart ? defaultStart.slice(0,13) + ':30' : '' } : {})}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          onDelete={selectedEvent?.id ? handleDelete : undefined}
        />
      )}
    </Layout>
  );
};

export default CalendarPage;