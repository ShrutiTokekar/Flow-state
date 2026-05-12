// Task Status
export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

export const TASK_STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
} as const;

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const TASK_PRIORITY_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
} as const;

// Colors
export const PRIORITY_COLORS = {
  LOW: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  MEDIUM: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200',
  },
  HIGH: {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-200',
  },
  URGENT: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200',
  },
} as const;

export const STATUS_COLORS = {
  TODO: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
  },
  IN_PROGRESS: {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-200',
  },
  DONE: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200',
  },
} as const;

// Category Icons
export const CATEGORY_ICONS = [
  { value: 'folder', label: 'Folder' },
  { value: 'briefcase', label: 'Briefcase' },
  { value: 'home', label: 'Home' },
  { value: 'shopping-cart', label: 'Shopping' },
  { value: 'heart', label: 'Health' },
  { value: 'book', label: 'Learning' },
  { value: 'code', label: 'Development' },
  { value: 'music', label: 'Music' },
  { value: 'camera', label: 'Photography' },
  { value: 'coffee', label: 'Leisure' },
];

// Category Colors
export const CATEGORY_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
  '#6366F1', // Indigo
];

// Date Formats
export const DATE_FORMATS = {
  FULL: 'MMMM dd, yyyy',
  SHORT: 'MMM dd, yyyy',
  TIME: 'hh:mm a',
  DATETIME: 'MMM dd, yyyy hh:mm a',
  ISO: "yyyy-MM-dd'T'HH:mm:ss",
  INPUT: 'yyyy-MM-dd',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://api.flowstatemanage.com/api',
  TIMEOUT: 30000, // 30 seconds
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  FILTERS: 'task_filters',
} as const;