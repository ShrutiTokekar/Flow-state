import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Bell, 
  ExternalLink, 
  Tag, 
  AlignLeft,
  X,
  Plus
} from 'lucide-react';

interface TaskFormProps {
  onClose: () => void;
  onSubmit: (task: TaskFormData) => void;
  initialData?: Partial<TaskFormData>;
}

interface TaskFormData {
  title: string;
  description: string;
  dueDate?: Date;
  dueTime?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  tags: string[];
  reminders: ReminderOption[];
  syncToGoogleCalendar: boolean;
}

interface ReminderOption {
  id: string;
  minutes: number;
  label: string;
}

const REMINDER_PRESETS: ReminderOption[] = [
  { id: '1', minutes: 15, label: '15 minutes before' },
  { id: '2', minutes: 30, label: '30 minutes before' },
  { id: '3', minutes: 60, label: '1 hour before' },
  { id: '4', minutes: 1440, label: '1 day before' },
  { id: '5', minutes: 10080, label: '1 week before' },
];

const TaskFormWithReminders: React.FC<TaskFormProps> = ({ 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    dueDate: initialData?.dueDate,
    dueTime: initialData?.dueTime || '',
    priority: initialData?.priority || 'MEDIUM',
    status: initialData?.status || 'TODO',
    tags: initialData?.tags || [],
    reminders: initialData?.reminders || [],
    syncToGoogleCalendar: initialData?.syncToGoogleCalendar || false,
  });

  const [newTag, setNewTag] = useState('');
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    });
  };

  const toggleReminder = (reminder: ReminderOption) => {
    const exists = formData.reminders.find(r => r.id === reminder.id);
    if (exists) {
      setFormData({
        ...formData,
        reminders: formData.reminders.filter(r => r.id !== reminder.id)
      });
    } else {
      setFormData({
        ...formData,
        reminders: [...formData.reminders, reminder]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {initialData ? 'Edit Task' : 'Create New Task'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              placeholder="Enter task title..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
              rows={4}
              placeholder="Add details about this task..."
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Due Time
              </label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium hover:bg-purple-200 transition-all"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gradient-to-r from-purple-100 to-green-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-2"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="hover:text-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Reminders
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowReminderDropdown(!showReminderDropdown)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-purple-400 transition-all"
              >
                <span className="text-gray-700">
                  {formData.reminders.length === 0
                    ? 'Add reminders'
                    : `${formData.reminders.length} reminder${formData.reminders.length > 1 ? 's' : ''} set`}
                </span>
                <Bell className="w-4 h-4 text-gray-400" />
              </button>

              {showReminderDropdown && (
                <div className="absolute z-10 mt-2 w-full bg-white border-2 border-purple-200 rounded-lg shadow-lg">
                  {REMINDER_PRESETS.map((reminder) => (
                    <label
                      key={reminder.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 cursor-pointer transition-all"
                    >
                      <input
                        type="checkbox"
                        checked={formData.reminders.some(r => r.id === reminder.id)}
                        onChange={() => toggleReminder(reminder)}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">{reminder.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Reminders */}
            {formData.reminders.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.reminders.map((reminder) => (
                  <span
                    key={reminder.id}
                    className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium flex items-center gap-2"
                  >
                    <Bell className="w-3 h-3" />
                    {reminder.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Google Calendar Sync */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-green-50 rounded-lg border-2 border-purple-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.syncToGoogleCalendar}
                onChange={(e) => setFormData({ ...formData, syncToGoogleCalendar: e.target.checked })}
                className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-gray-800">Sync to Google Calendar</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  This task will automatically appear in your Google Calendar
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-green-600 text-white rounded-lg font-medium hover:shadow-lg transform hover:scale-105 transition-all"
            >
              {initialData ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskFormWithReminders;