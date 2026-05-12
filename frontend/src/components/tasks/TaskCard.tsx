import React from 'react';
import { Calendar, Clock, Edit2, Trash2 } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  category?: any;
  createdAt?: string;
  updatedAt?: string;
}

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
}

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW:    { label: 'LOW',    className: 'bg-green-100 text-green-700' },
  MEDIUM: { label: 'MEDIUM', className: 'bg-yellow-100 text-yellow-700' },
  HIGH:   { label: 'HIGH',   className: 'bg-orange-100 text-orange-700' },
  URGENT: { label: 'URGENT', className: 'bg-red-100 text-red-700' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;

  const formatDate = (dateStr: string) => {
    const date = dateStr.includes('T') ? new Date(dateStr) : new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    const isOverdue = due < today && task.status !== 'DONE';
    const formatted = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { formatted, isOverdue };
  };

  const { formatted: dueDateStr, isOverdue } = task.dueDate ? formatDate(task.dueDate) : { formatted: '', isOverdue: false };

  const isDone = task.status === 'DONE';
  const isInProgress = task.status === 'IN_PROGRESS';
  const isTodo = task.status === 'TODO';

  return (
    <div className={`bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md transition-all ${isDone ? 'opacity-75' : ''} ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className={`font-bold text-gray-900 font-heading text-sm leading-snug ${isDone ? 'line-through text-gray-400' : ''}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); onEdit(task); }}
            className="p-1.5 text-gray-400 hover:text-flow-purple hover:bg-flow-lavender rounded-lg transition-all"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priority.className}`}>
          {priority.label}
        </span>
        {task.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-flow-lavender text-gray-700 font-medium">
            {task.category.icon} {task.category.name}
          </span>
        )}
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 text-xs mb-3 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
          <Calendar className="h-3 w-3" />
          <span>{dueDateStr}{isOverdue ? ' (Overdue)' : ''}</span>
        </div>
      )}

      {/* Completed time */}
      {isDone && task.updatedAt && (
        <div className="flex items-center gap-1 text-xs text-green-600 mb-3">
          <Clock className="h-3 w-3" />
          <span>Done {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {isTodo && (
          <>
            <button
              onClick={e => { e.stopPropagation(); onStatusChange(task.id, 'IN_PROGRESS'); }}
              className="flex-1 text-xs py-1.5 px-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium transition-all"
            >
              ▶ Start
            </button>
            <button
              onClick={e => { e.stopPropagation(); onStatusChange(task.id, 'DONE'); }}
              className="flex-1 text-xs py-1.5 px-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-all"
            >
              ✓ Complete
            </button>
          </>
        )}
        {isInProgress && (
          <button
            onClick={e => { e.stopPropagation(); onStatusChange(task.id, 'DONE'); }}
            className="w-full text-xs py-1.5 px-2 rounded-xl border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-all"
          >
            ✓ Mark Complete
          </button>
        )}
        {isDone && (
          <button
            onClick={e => { e.stopPropagation(); onStatusChange(task.id, 'TODO'); }}
            className="w-full text-xs py-1.5 px-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium transition-all"
          >
            ↩ Reopen
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCard;