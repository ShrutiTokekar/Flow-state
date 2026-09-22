import React from 'react';
import { Calendar, Check, Pencil, Play, Trash2 } from 'lucide-react';
import { dueLabel, DueTone } from '../../utils/dueDate';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface TaskCardProps {
  task: any;
  onEdit: (task: any) => void;
  onDelete: (taskId: number) => void;
  onStatusChange: (taskId: number, status: string) => void;
}

const priorityConfig: Record<string, { label: string; dot: string; chip: string }> = {
  LOW:    { label: 'Low',    dot: 'bg-gray-300',   chip: 'text-gray-500' },
  MEDIUM: { label: 'Medium', dot: 'bg-yellow-400', chip: 'text-gray-600' },
  HIGH:   { label: 'High',   dot: 'bg-orange-500', chip: 'text-orange-700 bg-orange-50' },
  URGENT: { label: 'Urgent', dot: 'bg-red-500',    chip: 'text-red-700 bg-red-50' },
};

const dueToneClass: Record<DueTone, string> = {
  overdue: 'text-red-700 bg-red-50',
  today: 'text-flow-purple bg-flow-lavender/60',
  soon: 'text-gray-700 bg-gray-100',
  later: 'text-gray-500 bg-gray-50',
  done: 'text-gray-400',
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onStatusChange }) => {
  const priority = priorityConfig[task.priority] || priorityConfig.MEDIUM;
  const isDone = task.status === 'DONE';
  const isTodo = task.status === 'TODO';
  const due = task.dueDate ? dueLabel(task.dueDate, isDone) : null;
  // The API sends category fields flat (categoryName/Color/Icon), not as a nested object.
  const CategoryIcon = getCategoryIcon(task.categoryIcon);

  return (
    <div
      className={`group relative bg-white rounded-xl border p-3 sm:p-3.5 shadow-sm hover:shadow-md transition-shadow ${
        due?.tone === 'overdue' ? 'border-red-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Complete / reopen */}
        <button
          onClick={() => onStatusChange(task.id, isDone ? 'TODO' : 'DONE')}
          aria-label={isDone ? `Reopen “${task.title}”` : `Mark “${task.title}” done`}
          aria-pressed={isDone}
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
            isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-500 hover:bg-green-50'
          }`}
        >
          {isDone && <Check className="h-3 w-3" strokeWidth={3} />}
        </button>

        <div className="flex-1 min-w-0">
          <button
            onClick={() => onEdit(task)}
            className={`block text-left w-full font-sans font-semibold text-sm leading-snug break-words ${
              isDone ? 'line-through text-gray-400' : 'text-gray-900 hover:text-flow-purple'
            }`}
          >
            {task.title}
          </button>

          {task.description && !isDone && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            {due && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${dueToneClass[due.tone]}`}>
                <Calendar className="h-3 w-3" aria-hidden />
                {due.label}
              </span>
            )}
            {!isDone && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md ${priority.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${priority.dot}`} aria-hidden />
                {priority.label}
              </span>
            )}
            {task.categoryName && (
              <span
                className="inline-flex items-center gap-1 text-[11px] font-medium px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: `${task.categoryColor || '#8894d1'}1f`, color: task.categoryColor || '#8894d1' }}
              >
                <CategoryIcon className="h-3 w-3" aria-hidden />
                {task.categoryName}
              </span>
            )}
          </div>
        </div>

        {/* Actions: always visible on touch screens, on hover/focus with a mouse */}
        <div className="flex items-center gap-0.5 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
          {isTodo && (
            <button
              onClick={() => onStatusChange(task.id, 'IN_PROGRESS')}
              aria-label={`Start “${task.title}”`}
              title="Start"
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Play className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => onEdit(task)}
            aria-label={`Edit “${task.title}”`}
            title="Edit"
            className="p-1.5 text-gray-400 hover:text-flow-purple hover:bg-flow-lavender/60 rounded-lg"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            aria-label={`Delete “${task.title}”`}
            title="Delete"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
