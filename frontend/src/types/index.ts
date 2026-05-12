// User types
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  emailNotifications?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Task types
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  categoryId?: number;
  categoryName?: string;
  categoryColor?: string;
  categoryIcon?: string;
}

export interface TaskFormData {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  categoryId?: number;
}

// Category types
export interface Category {
  id: number;
  name: string;
  color: string;
  icon: string;
  taskCount?: number;
}

export interface CategoryFormData {
  name: string;
  color?: string;
  icon?: string;
}

// Stats types
export interface TaskStats {
  TODO: number;
  IN_PROGRESS: number;
  DONE: number;
}

// API Error type
export interface ApiError {
  message: string;
  status?: number;
}