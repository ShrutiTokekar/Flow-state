import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { CategoryBadge } from '../components/categories/CategoryBadge';
import { CategoryModal } from '../components/categories/CategoryModal';
import { categoryService } from '../services/categoryService';
import { Category, CategoryFormData } from '../types';
import { Plus, Edit, Trash2, FolderOpen, AlertCircle } from 'lucide-react';

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsModalOpen(false);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsModalOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleSubmitCategory = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  return (
    <Layout>
      <div className= "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-flow-purple font-heading">Categories</h1>
            <p className="text-gray-600 mt-1 font-sans">Organize your tasks with custom categories</p>
          </div>
          <button
            onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-flow-purple text-flow-lavender rounded-lg hover:bg-purple-600 font-sans"
          >
            <Plus className="w-5 h-5" />
            New Category
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-flow-purple border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>Failed to load categories. Please try again.</p>
            </div>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && (
          categories.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-flow-lavender rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-flow-purple" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-heading">No categories yet</h3>
              <p className="text-gray-600 mb-6 font-sans">Create your first category to organize your tasks</p>
              <button
                onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-flow-purple text-white rounded-lg hover:bg-purple-600 mx-auto font-sans"
              >
                <Plus className="w-5 h-5" />
                Create Category
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 group hover:shadow-md transition-shadow"
                  style={{ borderLeftWidth: '4px', borderLeftColor: category.color }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <CategoryBadge category={category} size="lg" />
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                        className="p-2 hover:bg-flow-lavender rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this category? Tasks will not be deleted.'))
                            deleteCategoryMutation.mutate(category.id);
                        }}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 font-sans">Tasks</span>
                      <span className="font-semibold text-gray-900 font-heading">{category.taskCount || 0}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${Math.min((category.taskCount || 0) * 10, 100)}%`,
                          backgroundColor: category.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
          onSubmit={handleSubmitCategory}
          category={editingCategory}
        />
      </div>
    </Layout>
  );
};