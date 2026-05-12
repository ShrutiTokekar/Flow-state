import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { TaskCard } from '../components/tasks/TaskCard';
import { TaskModal } from '../components/tasks/TaskModal';
import { StatsCard } from '../components/tasks/StatsCard';
import { EventModal } from '../components/calendar/EventModal';
import api from '../services/api';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  category?: any;
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

export const Dashboard: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    loadTasks();
    loadCalendarEvents();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data);
      setFilteredTasks(response.data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const response = await api.get('/calendar/events');
      setCalendarEvents(response.data);
    } catch (error) {
      console.error('Failed to load calendar events:', error);
      setCalendarEvents([]);
    }
  };

  const handleCreateTask = async (taskData: any) => {
    try {
      const response = await api.post('/tasks', taskData);
      const newTask = response.data;
      setTasks(prev => [...prev, newTask]);
      setFilteredTasks(prev => [...prev, newTask]);
      setIsModalOpen(false);

      // Pick up pending reminder set in TaskModal
      const pending = sessionStorage.getItem('pending_reminder');
      if (pending && newTask.id) {
        try {
          const { minutesBefore, reminderType } = JSON.parse(pending);
          await api.post('/reminders', { taskId: newTask.id, minutesBefore, reminderType });
        } catch (e) {
          console.error('Failed to set reminder:', e);
        } finally {
          sessionStorage.removeItem('pending_reminder');
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateTask = async (taskData: any) => {
    if (!selectedTask) return;
    try {
      const response = await api.put(`/tasks/${selectedTask.id}`, taskData);
      const updatedTask = response.data;
      setTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setFilteredTasks(prev => prev.map(t => t.id === selectedTask.id ? updatedTask : t));
      setIsModalOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    setDeleteConfirmId(taskId);
  };

  const confirmDelete = async (taskId: number) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setFilteredTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (taskId: number, status: string) => {
    try {
      const existingTask = tasks.find(t => t.id === taskId);
      if (!existingTask) return;
      const payload = {
        title: existingTask.title,
        description: existingTask.description || '',
        status,
        priority: existingTask.priority,
        dueDate: existingTask.dueDate || null,
        categoryId: existingTask.category?.id || null,
      };
      const response = await api.put(`/tasks/${taskId}`, payload);
      const updatedTask = response.data;
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      setFilteredTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (error) {
      console.error('Failed to update task status:', error);
    }
  };

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (selectedEvent) {
        await api.put(`/calendar/events/${selectedEvent.id}`, eventData);
      } else {
        await api.post('/calendar/events', eventData);
      }
      await loadCalendarEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      await api.delete(`/calendar/events/${eventId}`);
      await loadCalendarEvents();
      setIsEventModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  // Calendar widget helpers
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toDateString();
    const calEvts = calendarEvents.filter(e => new Date(e.startTime).toDateString() === dateStr);
    const taskEvts = tasks.filter(t => {
      if (!t.dueDate) return false;
      const due = new Date(t.dueDate.includes('T') ? t.dueDate : t.dueDate + 'T00:00:00');
      return due.toDateString() === dateStr;
    });
    return [...calEvts, ...taskEvts];
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'DONE').length,
    pending: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
  };

  const upcomingEvents = [
    ...calendarEvents.map(e => ({ ...e, isTask: false })),
    ...tasks.filter(t => t.dueDate).map(t => ({ 
      id: t.id, 
      title: t.title, 
      startTime: t.dueDate!, 
      endTime: t.dueDate!,
      type: 'task' as const,
      isTask: true, 
      status: t.status 
    })),
  ]
    .filter(e => new Date(e.startTime) >= new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-heading">Task Dashboard</h1>
            <p className="text-gray-600 font-sans mt-1">Manage and track your tasks efficiently</p>
          </div>
          <button
            onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
            className="bg-flow-purple text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            New Task
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard title="Total Tasks" value={stats.total} color="blue" />
          <StatsCard title="Completed" value={stats.completed} color="green" />
          <StatsCard title="Pending" value={stats.pending} color="yellow" />
          <StatsCard title="In Progress" value={stats.inProgress} color="purple" />
        </div>

        {/* Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Mini Calendar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-flow-purple font-heading">Calendar</h3>
              <Link to="/calendar" className="text-sm text-flow-purple hover:text-purple-600">View Full →</Link>
            </div>
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="h-5 w-5" /></button>
              <h4 className="text-md font-semibold font-heading">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h4>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S','M','T','W','T','F','S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-semibold text-gray-600 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth().map((date, i) => {
                const isToday = date && date.toDateString() === new Date().toDateString();
                const dayEvents = date ? getEventsForDate(date) : [];
                return (
                  <div key={i} className={`aspect-square p-1 text-center text-sm rounded ${date ? 'bg-gray-50 hover:bg-gray-100' : ''} ${isToday ? 'bg-flow-purple text-white font-bold' : ''}`}>
                    {date && (
                      <>
                        <div className={isToday ? 'text-flow-pink' : 'text-gray-900'}>{date.getDate()}</div>
                        {dayEvents.length > 0 && (
                          <div className={`text-xs mt-0.5 ${isToday ? 'text-white' : 'text-flow-purple'}`}>•</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={goToToday} className="w-full mt-4 px-4 py-2 bg-flow-lavender text-gray-700 rounded-lg hover:bg-purple-200 text-sm">Today</button>
          </div>

          {/* Upcoming */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-flow-purple font-heading">Upcoming</h3>
              <Link to="/calendar" className="text-sm text-flow-purple hover:text-purple-600">View All →</Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No upcoming events or tasks</p>
              ) : (
                upcomingEvents.map((event, i) => {
                  const eventDate = new Date(event.startTime);
                  const isTask = (event as any).isTask;
                  return (
                    <div 
                      key={i} 
                      onClick={() => !isTask && handleEventClick(event as CalendarEvent)}
                      className={`p-3 bg-flow-lavender rounded-lg flex items-center justify-between ${!isTask ? 'cursor-pointer hover:bg-purple-200' : ''}`}
                    >
                      <div>
                        <div className="font-medium text-sm text-gray-900 flex items-center gap-1">
                          {isTask && <span className="text-xs">📌</span>}
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                      {isTask && (event as any).status && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          (event as any).status === 'DONE' ? 'bg-green-100 text-green-700' :
                          (event as any).status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {(event as any).status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Task Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 font-heading">
                To Do <span className="bg-blue-100 text-blue-700 text-sm px-2 py-1 rounded-full">{todoTasks.length}</span>
              </h3>
            </div>
            <div className="space-y-3">
              {todoTasks.length > 0 ? todoTasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
              )) : <p className="text-center text-gray-500 py-8">No tasks</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 font-heading">
                In Progress <span className="bg-yellow-100 text-yellow-700 text-sm px-2 py-1 rounded-full">{inProgressTasks.length}</span>
              </h3>
            </div>
            <div className="space-y-3">
              {inProgressTasks.length > 0 ? inProgressTasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
              )) : <p className="text-center text-gray-500 py-8">No tasks</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2 font-heading">
                Completed <span className="bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">{doneTasks.length}</span>
              </h3>
            </div>
            <div className="space-y-3">
              {doneTasks.length > 0 ? doneTasks.map(task => (
                <TaskCard key={task.id} task={task} onEdit={handleEditTask} onDelete={handleDeleteTask} onStatusChange={handleStatusChange} />
              )) : <p className="text-center text-gray-500 py-8">No tasks</p>}
            </div>
          </div>
        </div>

        {/* Task Modal */}
        <TaskModal
          isOpen={isModalOpen}
          task={selectedTask}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this task?</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300">Cancel</button>
                <button onClick={() => confirmDelete(deleteConfirmId)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;