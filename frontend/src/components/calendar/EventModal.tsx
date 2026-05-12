import React, { useState } from 'react';

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'reminder';
}

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (data: any) => void;
  onDelete?: (id: number) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onSave, onDelete }) => {
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
            {event ? 'Edit Event' : 'Add Event'}
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
          {event && onDelete ? (
            <button
              onClick={() => onDelete(event.id)}
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