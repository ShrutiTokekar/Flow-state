import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, RefreshCw, Upload, Download } from 'lucide-react';
import api from '../../services/api';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  type: 'task' | 'event' | 'reminder';
  taskId?: string;
  color?: string;
  isSyncedToGoogle?: boolean;
}

interface CalendarViewProps {
  showMiniView?: boolean;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ showMiniView = false }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleSyncEnabled, setGoogleSyncEnabled] = useState(false);

  useEffect(() => {
    loadEvents();
    checkGoogleSync();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      // Load calendar events
      const eventsResponse = await api.get('/calendar/events/range', {
        params: {
          start: startOfMonth.toISOString(),
          end: endOfMonth.toISOString()
        }
      });

      // Load tasks as events
      const tasksResponse = await api.get('/tasks');
      const taskEvents = tasksResponse.data
        .filter((task: any) => task.dueDate)
        .map((task: any) => ({
          id: `task-${task.id}`,
          title: task.title,
          description: task.description,
          startTime: new Date(task.dueDate),
          endTime: new Date(task.dueDate),
          type: 'task',
          taskId: task.id,
          color: getPriorityColor(task.priority)
        }));

      setEvents([...eventsResponse.data, ...taskEvents]);
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  };

  const checkGoogleSync = async () => {
    try {
      const response = await api.get('/calendar/google-sync-status');
      setGoogleSyncEnabled(response.data.enabled);
    } catch (error) {
      console.error('Failed to check Google sync:', error);
    }
  };

  const syncWithGoogle = async () => {
    try {
      setIsSyncing(true);
      await api.post('/calendar/sync-google');
      await loadEvents();
      alert('Successfully synced with Google Calendar!');
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync with Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const exportToGoogleCalendar = async () => {
    try {
      await api.post('/calendar/export-to-google');
      alert('Calendar exported to Google Calendar!');
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export to Google Calendar');
    }
  };

  const importFromGoogleCalendar = async () => {
    try {
      setIsSyncing(true);
      await api.post('/calendar/import-from-google');
      await loadEvents();
      alert('Successfully imported from Google Calendar!');
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import from Google Calendar');
    } finally {
      setIsSyncing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: any = {
      URGENT: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#eab308',
      LOW: '#3b82f6'
    };
    return colors[priority] || '#6b7280';
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startTime);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  if (showMiniView) {
    // Mini widget for dashboard
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Calendar Preview
          </h3>
          <a href="/calendar" className="text-sm text-blue-600 hover:text-blue-700">
            View Full →
          </a>
        </div>
        
        <div className="text-sm text-gray-600 mb-2">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-500 py-1">
              {day}
            </div>
          ))}
          {getDaysInMonth().slice(0, 14).map((date, i) => (
            <div key={i} className={`text-center py-1 ${date ? 'hover:bg-gray-100 rounded cursor-pointer' : ''}`}>
              {date ? (
                <>
                  <div className={`${getEventsForDate(date).length > 0 ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  {getEventsForDate(date).length > 0 && (
                    <div className="h-1 w-1 bg-blue-600 rounded-full mx-auto mt-1"></div>
                  )}
                </>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-gray-500">
          {events.length} events this month
        </div>
      </div>
    );
  }

  // Full calendar view
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Calendar</h2>
          
          <div className="flex items-center gap-2">
            {/* Google Sync Controls */}
            {googleSyncEnabled && (
              <>
                <button
                  onClick={importFromGoogleCalendar}
                  disabled={isSyncing}
                  className="btn btn-secondary text-sm"
                  title="Import from Google Calendar"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </button>
                <button
                  onClick={exportToGoogleCalendar}
                  disabled={isSyncing}
                  className="btn btn-secondary text-sm"
                  title="Export to Google Calendar"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
                <button
                  onClick={syncWithGoogle}
                  disabled={isSyncing}
                  className="btn btn-secondary text-sm"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  Sync
                </button>
              </>
            )}

            <button
              onClick={() => setShowEventModal(true)}
              className="btn btn-primary text-sm"
            >
              <Plus className="h-4 w-4" />
              New Event
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-semibold min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded text-sm ${view === 'month' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded text-sm ${view === 'week' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded text-sm ${view === 'day' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-700 text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {getDaysInMonth().map((date, i) => {
            const dayEvents = date ? getEventsForDate(date) : [];
            const isToday = date && date.toDateString() === new Date().toDateString();

            return (
              <div
                key={i}
                className={`min-h-[120px] border rounded-lg p-2 ${
                  date ? 'bg-white hover:bg-gray-50 cursor-pointer' : 'bg-gray-50'
                } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                onClick={() => date && setSelectedDate(date)}
              >
                {date && (
                  <>
                    <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className="text-xs p-1 rounded truncate"
                          style={{
                            backgroundColor: event.color ? `${event.color}20` : '#e0e7ff',
                            borderLeft: `3px solid ${event.color || '#6366f1'}`
                          }}
                          title={event.title}
                        >
                          {event.type === 'task' && '✓ '}
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;