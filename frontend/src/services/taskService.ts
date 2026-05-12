import api from './api';
import { Task, TaskFormData, TaskStats } from '../types';

export const taskService = {
  // Get all tasks with optional filters
  getAllTasks: async (status?: string, categoryId?: number): Promise<Task[]> => {
    const params: any = {};
    if (status) params.status = status;
    if (categoryId) params.categoryId = categoryId;
    
    const response = await api.get<Task[]>('/tasks', { params });
    return response.data;
  },

  // Get a single task by ID
  getTaskById: async (id: number): Promise<Task> => {
    const response = await api.get<Task>(`/tasks/${id}`);
    return response.data;
  },

  // Get overdue tasks
  getOverdueTasks: async (): Promise<Task[]> => {
    const response = await api.get<Task[]>('/tasks/overdue');
    return response.data;
  },

  // Get task statistics
  getTaskStats: async (): Promise<TaskStats> => {
    const response = await api.get<TaskStats>('/tasks/stats');
    return response.data;
  },

  // Create a new task
  createTask: async (taskData: TaskFormData): Promise<Task> => {
    const response = await api.post<Task>('/tasks', taskData);
    return response.data;
  },

  // Update an existing task
  updateTask: async (id: number, taskData: Partial<TaskFormData>): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, taskData);
    return response.data;
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Update task status (quick action)
  updateTaskStatus: async (id: number, status: string): Promise<Task> => {
    const response = await api.put<Task>(`/tasks/${id}`, { status });
    return response.data;
  },
};