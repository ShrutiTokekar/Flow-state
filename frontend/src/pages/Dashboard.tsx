import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, Sparkles, Users, CalendarDays, AlertTriangle, CheckCircle2, Circle, Loader2, X } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { EventModal } from '../components/calendar/EventModal';
import { useAuthStore } from '../store/authStore';
import { sharedCalendarService, SharedCalendarSummary } from '../services/sharedCalendarService';
import { parseDue, daysFromToday, isOverdue } from '../utils/dueDate';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  categoryId?: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'reminder';
}

interface Category {
  id: number;
  name: string;
  color: string;
}

type Status = Task['status'];
type StatusFilter = Status | 'OVERDUE' | null;

const COLUMNS: { status: Status; label: string; accent: string; tint: string }[] = [
  { status: 'TODO', label: 'To do', accent: 'bg-flow-purple', tint: 'bg-flow-lavender/60' },
  { status: 'IN_PROGRESS', label: 'In progress', accent: 'bg-flow-pink', tint: 'bg-flow-pink/25' },
  { status: 'DONE', label: 'Done', accent: 'bg-green-500', tint: 'bg-flow-green/50' },
];

const PRIORITY_RANK: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const DONE_PREVIEW = 8;

// Overdue and soonest-due first, then by priority; undated tasks last.
const byUrgency = (a: Task, b: Task) => {
  const ad = a.dueDate ? parseDue(a.dueDate).getTime() : Infinity;
  const bd = b.dueDate ? parseDue(b.dueDate).getTime() : Infinity;
  if (ad !== bd) return ad - bd;
  return (PRIORITY_RANK[a.priority] ?? 2) - (PRIORITY_RANK[b.priority] ?? 2);
};

const byRecentlyDone = (a: Task, b: Task) =>
  new Date(b.completedAt || b.updatedAt || 0).getTime() - new Date(a.completedAt || a.updatedAt || 0).getTime();

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const Dashboard: React.FC = () => {
  const user = useAuthStore(s => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sharedCalendars, setSharedCalendars] = useState<SharedCalendarSummary[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const categoryFilter = searchParams.get('category') || '';
  const [mobileColumn, setMobileColumn] = useState<Status>('TODO');
  const [showAllDone, setShowAllDone] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAdding, setQuickAdding] = useState(false);

  useEffect(() => {
    loadTasks();
    loadCalendarEvents();
    api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    sharedCalendarService.list().then(setSharedCalendars).catch(() => setSharedCalendars(null));
  }, []);

  // "View tasks" links from Categories point at #task-board — scroll there once tasks load.
  const location = useLocation();
  useEffect(() => {
    if (!isLoading && location.hash === '#task-board') {
      document.getElementById('task-board')?.scrollIntoView({ block: 'start' });
    }
  }, [isLoading, location.hash]);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data);
      setError('');
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Could not load your tasks. Check your connection and refresh.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const response = await api.get('/calendar/events');
      setCalendarEvents(response.data);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setCalendarEvents([]);
    }
  };

  // ── Task actions ─────────────────────────────────────────────────────────

  const attachPendingReminder = async (taskId: number) => {
    // Pick up pending reminder set in TaskModal
    const pending = sessionStorage.getItem('pending_reminder');
    if (!pending) return;
    try {
      const { minutesBefore, reminderType } = JSON.parse(pending);
      await api.post('/reminders', { taskId, minutesBefore, reminderType });
    } catch (e) {
      console.error('Failed to set reminder:', e);
    } finally {
      sessionStorage.removeItem('pending_reminder');
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await api.post('/tasks', taskData);
      const newTask = response.data;
      setTasks(prev => [...prev, newTask]);
      setIsModalOpen(false);
      if (newTask.id) await attachPendingReminder(newTask.id);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Could not create the task. Please try again.');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title) return;
    setQuickAdding(true);
    try {
      const response = await api.post('/tasks', {
        title,
        status: 'TODO',
        priority: 'MEDIUM',
        ...(categoryFilter ? { categoryId: Number(categoryFilter) } : {}),
      });
      setTasks(prev => [...prev, response.data]);
      setQuickTitle('');
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Could not add the task. Please try again.');
    } finally {
      setQuickAdding(false);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!selectedTask) return;
    try {
      const response = await api.put(`/tasks/${selectedTask.id}`, taskData);
      const updatedTask = response.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setIsModalOpen(false);
      setSelectedTask(null);
      await attachPendingReminder(selectedTask.id);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError('Could not save the task. Please try again.');
    }
  };

  const confirmDelete = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError('Could not delete the task. Please try again.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, status: string) => {
    const existingTask = tasks.find(t => t.id === taskId);
    if (!existingTask) return;
    // Update the card right away; roll back if the request fails.
    setTasks(prev => prev.map(t => (t.id === taskId ? { ...t, status: status as Status } : t)));
    try {
      const payload = {
        title: existingTask.title,
        description: existingTask.description || '',
        status,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate || null,
        // Tasks carry categoryId directly; sending null here would remove the category.
        categoryId: existingTask.categoryId ?? null,
      };
      const response = await api.put(`/tasks/${taskId}`, payload);
      setTasks(prev => prev.map(t => (t.id === taskId ? response.data : t)));
    } catch (err) {
      console.error('Failed to update task status:', err);
      setTasks(prev => prev.map(t => (t.id === taskId ? existingTask : t)));
      setError('Could not update the task. Please try again.');
    }
  };

  // ── Event actions ────────────────────────────────────────────────────────

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) await api.put(`/calendar/events/${selectedEvent.id}`, eventData);
      else await api.post('/calendar/events', eventData);
      await loadCalendarEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to save event:', err);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      await loadCalendarEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.status === 'DONE').length;
    return {
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done,
      overdue: tasks.filter(t => isOverdue(t.dueDate, t.status)).length,
      dueToday: tasks.filter(t => t.status !== 'DONE' && t.dueDate && daysFromToday(parseDue(t.dueDate)) === 0).length,
      percent: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter(t =>
      (!q || t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) &&
      (!priorityFilter || t.priority === priorityFilter) &&
      (!categoryFilter || String(t.categoryId ?? '') === categoryFilter) &&
      (statusFilter !== 'OVERDUE' || isOverdue(t.dueDate, t.status))
    );
  }, [tasks, search, priorityFilter, categoryFilter, statusFilter]);

  const columnTasks = (status: Status) => {
    const list = filteredTasks.filter(t => t.status === status);
    return status === 'DONE' ? list.sort(byRecentlyDone) : list.sort(byUrgency);
  };

  // Today: events today + unfinished tasks due today or overdue
  const todayItems = useMemo(() => {
    const events = calendarEvents
      .filter(e => daysFromToday(new Date(e.startTime)) === 0)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(e => ({ kind: 'event' as const, key: `e${e.id}`, event: e }));
    const due = tasks
      .filter(t => t.status !== 'DONE' && t.dueDate && daysFromToday(parseDue(t.dueDate)) <= 0)
      .sort(byUrgency)
      .map(t => ({ kind: 'task' as const, key: `t${t.id}`, task: t }));
    return [...events, ...due];
  }, [calendarEvents, tasks]);

  // Next 7 days (excluding today)
  const upcoming = useMemo(() => {
    const events = calendarEvents
      .map(e => ({ key: `e${e.id}`, title: e.title, date: new Date(e.startTime), isTask: false as const, event: e }))
      .filter(x => { const d = daysFromToday(x.date); return d >= 1 && d <= 7; });
    const due = tasks
      .filter(t => t.status !== 'DONE' && t.dueDate)
      .map(t => ({ key: `t${t.id}`, title: t.title, date: parseDue(t.dueDate!), isTask: true as const, task: t }))
      .filter(x => { const d = daysFromToday(x.date); return d >= 1 && d <= 7; });
    return [...events, ...due].sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 6);
  }, [calendarEvents, tasks]);

  const hasFilters = !!(search || priorityFilter || categoryFilter || statusFilter);
  const clearFilters = () => {
    setSearch('');
    setPriorityFilter('');
    setStatusFilter(null);
    searchParams.delete('category');
    setSearchParams(searchParams, { replace: true });
  };

  const setCategoryFilter = (value: string) => {
    if (value) searchParams.set('category', value);
    else searchParams.delete('category');
    setSearchParams(searchParams, { replace: true });
  };

  const applyStatFilter = (f: StatusFilter) => {
    const next = statusFilter === f ? null : f;
    setStatusFilter(next);
    if (next && next !== 'OVERDUE') setMobileColumn(next);
    if (next === 'OVERDUE') setMobileColumn('TODO');
    document.getElementById('task-board')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleColumns = statusFilter && statusFilter !== 'OVERDUE'
    ? COLUMNS.filter(c => c.status === statusFilter)
    : statusFilter === 'OVERDUE' ? COLUMNS.filter(c => c.status !== 'DONE') : COLUMNS;

  const firstName = user?.name?.split(' ')[0];
  const summary = stats.dueToday || stats.overdue
    ? [stats.dueToday && `${stats.dueToday} due today`, stats.overdue && `${stats.overdue} overdue`].filter(Boolean).join(' · ')
    : 'Nothing due today';

  const openNewTask = () => { setSelectedTask(null); setIsModalOpen(true); };
  const openEvent = (event: CalendarEvent) => { setSelectedEvent(event); setIsEventModalOpen(true); };

  // ── Render ───────────────────────────────────────────────────────────────

  const StatTile = ({ label, value, filter, tone, bg, icon: Icon }: {
    label: string; value: number; filter: StatusFilter; tone: string; bg: string; icon: React.ElementType;
  }) => (
    <button
      onClick={() => applyStatFilter(filter)}
      aria-pressed={statusFilter === filter}
      className={`text-left rounded-2xl border p-3 sm:p-4 transition-all hover:shadow-md ${bg} ${
        statusFilter === filter ? 'border-flow-purple ring-2 ring-flow-purple/40' : 'border-transparent'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs sm:text-sm text-gray-700 font-medium">{label}</span>
        <Icon className={`h-4 w-4 ${tone}`} aria-hidden />
      </div>
      <div className={`mt-1 text-2xl sm:text-3xl font-semibold tabular-nums ${value && filter === 'OVERDUE' ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </div>
    </button>
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
          subtitle={
            <>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              {!isLoading && <> · <span className={stats.overdue ? 'text-red-600' : ''}>{summary}</span></>}
            </>
          }
          actions={
            <button
              onClick={openNewTask}
              className="bg-flow-purple text-white px-4 py-2.5 rounded-xl hover:bg-primary-500 flex items-center gap-2 font-medium shadow-sm"
            >
              <Plus className="h-5 w-5" /> New task
            </button>
          }
        />

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700 flex items-center justify-between gap-3" role="alert">
            {error}
            <button onClick={() => setError('')} aria-label="Dismiss" className="p-1"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Stats — each tile filters the board */}
        <section aria-label="Task summary" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <StatTile label="To do" value={stats.todo} filter="TODO" tone="text-flow-purple" bg="bg-flow-lavender" icon={Circle} />
          <StatTile label="In progress" value={stats.inProgress} filter="IN_PROGRESS" tone="text-pink-600" bg="bg-flow-pink/40" icon={Loader2} />
          <StatTile label="Done" value={stats.done} filter="DONE" tone="text-green-700" bg="bg-flow-green" icon={CheckCircle2} />
          <StatTile label="Overdue" value={stats.overdue} filter="OVERDUE" tone="text-red-500" bg="bg-white" icon={AlertTriangle} />
        </section>
        {tasks.length > 0 && (
          <div className="mb-6 flex items-center gap-3 text-xs text-gray-500">
            <div className="flex-1 h-2 rounded-full bg-white overflow-hidden" role="progressbar" aria-valuenow={stats.percent} aria-valuemin={0} aria-valuemax={100} aria-label="Tasks completed">
              <div className="h-full bg-flow-purple rounded-full transition-all" style={{ width: `${stats.percent}%` }} />
            </div>
            <span className="tabular-nums text-gray-600">{stats.percent}% complete</span>
          </div>
        )}

        {/* Today / Coming up / Plan together */}
        <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border-t-4 border-flow-purple shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-2xl text-flow-purple">Today</h2>
              <Link to="/calendar" className="text-sm text-flow-purple hover:underline">Calendar</Link>
            </div>
            {todayItems.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nothing scheduled or due today. Enjoy the open time.</p>
            ) : (
              <ul className="space-y-2">
                {todayItems.slice(0, 6).map(item =>
                  item.kind === 'event' ? (
                    <li key={item.key}>
                      <button
                        onClick={() => openEvent(item.event)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2 bg-flow-lavender/40 hover:bg-flow-lavender/70 text-left"
                      >
                        <span className="text-xs font-semibold text-flow-purple w-16 shrink-0 tabular-nums">{timeLabel(item.event.startTime)}</span>
                        <span className="text-sm text-gray-900 truncate">{item.event.title}</span>
                      </button>
                    </li>
                  ) : (
                    <li key={item.key}>
                      <button
                        onClick={() => handleEditTask(item.task)}
                        className="w-full flex items-center gap-3 rounded-xl px-3 py-2 bg-flow-yellow/70 hover:bg-flow-yellow text-left"
                      >
                        <span className={`text-xs font-semibold w-16 shrink-0 ${isOverdue(item.task.dueDate, item.task.status) ? 'text-red-600' : 'text-gray-500'}`}>
                          {isOverdue(item.task.dueDate, item.task.status) ? 'Overdue' : 'Due'}
                        </span>
                        <span className="text-sm text-gray-900 truncate">{item.task.title}</span>
                      </button>
                    </li>
                  )
                )}
                {todayItems.length > 6 && <li className="text-xs text-gray-500 px-3">+{todayItems.length - 6} more</li>}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-2xl border-t-4 border-flow-pink shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-2xl text-flow-purple">Coming up</h2>
              <span className="text-xs text-gray-400">Next 7 days</span>
            </div>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Nothing on the calendar this week yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {upcoming.map(item => (
                  <li key={item.key}>
                    <button
                      onClick={() => (item.isTask ? handleEditTask(item.task) : openEvent(item.event))}
                      className="w-full flex items-center gap-3 py-2 text-left hover:bg-gray-50 rounded-lg px-1"
                    >
                      <div className="w-11 shrink-0 text-center">
                        <div className="text-[10px] uppercase text-gray-400 font-semibold">{item.date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-lg font-semibold text-gray-800 leading-none">{item.date.getDate()}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">{item.title}</div>
                        <div className="text-xs text-gray-500">{item.isTask ? 'Task due' : timeLabel(item.date.toISOString())}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-flow-purple text-white rounded-2xl p-4 sm:p-5 md:col-span-2 xl:col-span-1 flex flex-col">
            <h2 className="font-heading text-2xl text-flow-green">Plan together</h2>
            <p className="text-sm text-white/90 mt-1 mb-4">
              {sharedCalendars && sharedCalendars.length > 0
                ? `You're in ${sharedCalendars.length} shared calendar${sharedCalendars.length === 1 ? '' : 's'}.`
                : 'Share a calendar with roommates, classmates or your team, and find times everyone is free.'}
            </p>
            {sharedCalendars && sharedCalendars.length > 0 && (
              <ul className="mb-4 space-y-1">
                {sharedCalendars.slice(0, 3).map(c => (
                  <li key={c.id}>
                    <Link to={`/calendars/${c.id}`} className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-white/10 hover:bg-white/20 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="truncate flex-1">{c.name}</span>
                      <span className="flex items-center gap-1 text-xs text-white/70"><Users className="h-3 w-3" />{c.memberCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-auto flex flex-wrap gap-2">
              <Link to="/calendar?freeTime=1" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-flow-green text-gray-900 text-sm font-medium hover:bg-white">
                <Sparkles className="h-4 w-4" /> Find free time
              </Link>
              <Link to="/calendar?new=1" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 text-white text-sm font-medium hover:bg-white/25">
                <CalendarDays className="h-4 w-4" /> New shared calendar
              </Link>
            </div>
          </div>
        </section>

        {/* Task board */}
        <section id="task-board" aria-label="Tasks" className="scroll-mt-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="font-heading text-3xl text-flow-purple">Tasks</h2>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <label className="relative flex-1 sm:flex-none">
                <span className="sr-only">Search tasks</span>
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks"
                  className="w-full sm:w-56 pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-flow-purple"
                />
              </label>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                aria-label="Filter by category"
                className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select
                value={priorityFilter}
                onChange={e => setPriorityFilter(e.target.value)}
                aria-label="Filter by priority"
                className="py-2 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-sm"
              >
                <option value="">Any priority</option>
                <option value="URGENT">Urgent</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="text-sm text-flow-purple hover:underline px-1">Clear filters</button>
              )}
            </div>
          </div>

          {/* Phones/tablets: one column at a time */}
          <div className="lg:hidden flex bg-flow-lavender rounded-xl p-1 mb-3" role="tablist" aria-label="Task status">
            {COLUMNS.map(c => (
              <button
                key={c.status}
                role="tab"
                aria-selected={mobileColumn === c.status}
                onClick={() => setMobileColumn(c.status)}
                className={`flex-1 py-2 text-sm rounded-lg transition-all ${mobileColumn === c.status ? 'bg-flow-purple shadow-sm font-medium text-white' : 'text-gray-600'}`}
              >
                {c.label} <span className="opacity-70 tabular-nums">{columnTasks(c.status).length}</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid lg:grid-cols-3 gap-4">
              {[0, 1, 2].map(i => (
                <div key={i} className={`bg-gray-100 rounded-2xl p-3 space-y-3 ${i > 0 ? 'hidden lg:block' : ''}`}>
                  {[0, 1, 2].map(j => <div key={j} className="h-20 bg-white/80 rounded-xl animate-pulse" />)}
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 py-12 px-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-flow-lavender mx-auto flex items-center justify-center mb-4">
                <CheckCircle2 className="h-7 w-7 text-flow-purple" />
              </div>
              <h3 className="font-heading text-2xl text-gray-900 mb-1">Your list is empty</h3>
              <p className="text-gray-500 mb-5">Add your first task and Flow State will keep track of what's due.</p>
              <button onClick={openNewTask} className="inline-flex items-center gap-2 px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium">
                <Plus className="h-5 w-5" /> Add a task
              </button>
            </div>
          ) : (
            <div className={`grid gap-4 ${visibleColumns.length === 3 ? 'lg:grid-cols-3' : visibleColumns.length === 2 ? 'lg:grid-cols-2' : ''}`}>
              {visibleColumns.map(col => {
                const list = columnTasks(col.status);
                const shown = col.status === 'DONE' && !showAllDone ? list.slice(0, DONE_PREVIEW) : list;
                return (
                  <div
                    key={col.status}
                    className={`${col.tint} rounded-2xl p-2.5 sm:p-3 ${mobileColumn === col.status ? '' : 'hidden lg:block'}`}
                  >
                    <div className="hidden lg:flex items-center gap-2 px-1 pb-2.5">
                      <span className={`h-2 w-2 rounded-full ${col.accent}`} aria-hidden />
                      <h3 className="font-sans font-semibold text-sm text-gray-800">{col.label}</h3>
                      <span className="text-xs text-gray-500 tabular-nums">{list.length}</span>
                    </div>

                    {col.status === 'TODO' && (
                      <form onSubmit={handleQuickAdd} className="mb-2">
                        <label className="sr-only" htmlFor="quick-add">Add a task</label>
                        <div className="flex items-center gap-2 bg-white rounded-xl border border-dashed border-gray-300 focus-within:border-flow-purple px-3">
                          <Plus className="h-4 w-4 text-gray-400 shrink-0" aria-hidden />
                          <input
                            id="quick-add"
                            value={quickTitle}
                            onChange={e => setQuickTitle(e.target.value)}
                            placeholder="Add a task and press Enter"
                            disabled={quickAdding}
                            className="flex-1 py-2.5 text-sm bg-transparent focus:outline-none"
                          />
                        </div>
                      </form>
                    )}

                    <div className="space-y-2">
                      {shown.length > 0 ? shown.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onEdit={handleEditTask}
                          onDelete={setDeleteConfirmId}
                          onStatusChange={handleStatusChange}
                        />
                      )) : (
                        <p className="text-center text-sm text-gray-500 py-8">
                          {hasFilters ? 'No tasks match these filters' : col.status === 'DONE' ? 'Finished tasks show up here' : col.status === 'IN_PROGRESS' ? 'Press ▶ on a task to start it' : 'All clear'}
                        </p>
                      )}
                    </div>
                    {col.status === 'DONE' && list.length > DONE_PREVIEW && (
                      <button onClick={() => setShowAllDone(v => !v)} className="w-full mt-2 py-2 text-sm text-flow-purple hover:underline">
                        {showAllDone ? 'Show fewer' : `Show all ${list.length}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          task={selectedTask as any}
          categories={categories}
          onClose={() => { setIsModalOpen(false); setSelectedTask(null); }}
          onSubmit={selectedTask ? handleUpdateTask : handleCreateTask}
        />

        {/* Event Modal */}
        {isEventModalOpen && (
          <EventModal
            event={selectedEvent}
            onClose={() => { setIsEventModalOpen(false); setSelectedEvent(null); }}
            onSave={handleSaveEvent}
            onDelete={selectedEvent ? handleDeleteEvent : undefined}
          />
        )}

        {/* Delete Confirmation */}
        {deleteConfirmId && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
              <h3 id="delete-title" className="font-heading text-2xl text-gray-900 mb-1">Delete this task?</h3>
              <p className="text-gray-600 mb-6 text-sm">
                “{tasks.find(t => t.id === deleteConfirmId)?.title}” will be permanently deleted.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
                <button onClick={() => confirmDelete(deleteConfirmId)} className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
