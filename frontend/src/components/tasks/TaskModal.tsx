import React, { useState, useEffect } from 'react';
import { X, Bell } from 'lucide-react';
import api from '../../services/api';

interface Task {
  id?: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  dueTime?: string;
  category?: any;
}

interface TaskModalProps {
  isOpen: boolean;
  task: Task | null;
  categories: any[];
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const REMINDER_OPTIONS = [
  { label: '15 minutes before', value: 15 },
  { label: '30 minutes before', value: 30 },
  { label: '1 hour before', value: 60 },
  { label: '2 hours before', value: 120 },
  { label: '1 day before', value: 1440 },
];

export const TaskModal: React.FC<TaskModalProps> = ({ isOpen, task, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('TODO');
  const [priority, setPriority] = useState('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [categories, setCategories] = useState<any[]>([]);

  // Reminder
  const [reminderMinutes, setReminderMinutes] = useState<number | ''>('');
  const [reminderType, setReminderType] = useState<'IN_APP' | 'EMAIL' | 'BOTH'>('BOTH');
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/categories').then(r => setCategories(r.data)).catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'TODO');
      setPriority(task.priority || 'MEDIUM');
      if (task.dueDate) {
        if (task.dueDate.includes('T')) {
          const [date, time] = task.dueDate.split('T');
          setDueDate(date);
          setDueTime(time.slice(0, 5));
        } else {
          setDueDate(task.dueDate);
          setDueTime('');
        }
      } else {
        setDueDate('');
        setDueTime('');
      }
      setCategoryId(task.category?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('TODO');
      setPriority('MEDIUM');
      setDueDate('');
      setDueTime('');
      setCategoryId('');
    }
    setReminderMinutes('');
    setReminderType('BOTH');
    setShowReminder(false);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) return;

    // Build ISO dueDate with time
    let dueDateISO: string | undefined;
    if (dueDate) {
      dueDateISO = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDateISO,
      categoryId: categoryId || undefined,
    };

    // Store reminder in sessionStorage — Dashboard picks it up after task creation
    if (reminderMinutes && dueDate) {
      sessionStorage.setItem('pending_reminder', JSON.stringify({
        minutesBefore: reminderMinutes,
        reminderType,
      }));
    } else {
      sessionStorage.removeItem('pending_reminder');
    }

    onSubmit(payload);
  };

  const priorityColors: Record<string, string> = {
    LOW: 'bg-green-100 text-green-700 border-green-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
    URGENT: 'bg-red-100 text-red-700 border-red-300',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold font-heading text-gray-900">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              placeholder="What needs to be done?"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple resize-none"
              placeholder="Add details..."
              rows={3}
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple ${priorityColors[priority]}`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
          </div>

          {/* Due Date + Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date & Time</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); if (!e.target.value) { setShowReminder(false); setReminderMinutes(''); } }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              />
              <input
                type="time"
                value={dueTime}
                onChange={e => setDueTime(e.target.value)}
                disabled={!dueDate}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Optional time"
              />
            </div>
            {dueDate && (
              <p className="text-xs text-gray-400 mt-1">
                {dueTime ? `Task is due ${dueDate} at ${dueTime}` : `Task is due on ${dueDate} (no specific time)`}
              </p>
            )}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-flow-purple"
              >
                <option value="">No category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Reminder section — only shows when due date is set */}
          {dueDate && (
            <div className="bg-flow-yellow rounded-2xl p-4 border border-yellow-200">
              <button
                onClick={() => setShowReminder(!showReminder)}
                className="flex items-center gap-2 w-full text-left"
              >
                <Bell className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-semibold text-gray-800">
                  {showReminder ? 'Reminder set' : 'Add a reminder'}
                </span>
                <span className="ml-auto text-gray-400 text-xs">{showReminder ? '▲' : '▼'}</span>
              </button>

              {showReminder && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Notify me</label>
                    <div className="grid grid-cols-2 gap-2">
                      {REMINDER_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setReminderMinutes(opt.value)}
                          className={`text-xs py-2 px-3 rounded-xl border transition-all ${
                            reminderMinutes === opt.value
                              ? 'bg-flow-purple text-white border-flow-purple'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-flow-purple'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {reminderMinutes && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">How to notify</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['IN_APP', 'EMAIL', 'BOTH'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setReminderType(type)}
                            className={`text-xs py-2 px-2 rounded-xl border transition-all ${
                              reminderType === type
                                ? 'bg-flow-purple text-white border-flow-purple'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-flow-purple'
                            }`}
                          >
                            {type === 'IN_APP' ? '🔔 In-app' : type === 'EMAIL' ? '📧 Email' : '🔔📧 Both'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-6">
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-5 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-purple-600 font-medium disabled:opacity-50"
          >
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;