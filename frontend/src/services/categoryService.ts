import api from './api';
import { Category, CategoryFormData } from '../types';

export const categoryService = {
  // Get all categories
  getAllCategories: async (): Promise<Category[]> => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  // Create a new category
  createCategory: async (categoryData: CategoryFormData): Promise<Category> => {
    const response = await api.post<Category>('/categories', categoryData);
    return response.data;
  },

  // Update an existing category
  updateCategory: async (id: number, categoryData: Partial<CategoryFormData>): Promise<Category> => {
    const response = await api.put<Category>(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete a category
  deleteCategory: async (id: number): Promise<void> => {
    await api.delete(`/categories/${id}`);
  },
};