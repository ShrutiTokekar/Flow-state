import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { CategoryModal } from '../components/categories/CategoryModal';
import { categoryService } from '../services/categoryService';
import { getCategoryIcon } from '../utils/categoryIcons';
import { isOverdue } from '../utils/dueDate';
import { Category, CategoryFormData } from '../types';
import api from '../services/api';
import { Plus, Pencil, Trash2, FolderOpen, AlertCircle, ArrowRight } from 'lucide-react';

interface TaskLite {
  id: number;
  title: string;
  status: string;
  dueDate?: string;
  categoryId?: number;
}

export const Categories: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const { data: categories = [], isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  });

  const { data: tasks = [] } = useQuery<TaskLite[]>({
    queryKey: ['tasks'],
    queryFn: () => api.get('/tasks').then(r => r.data),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: () => { invalidate(); setIsModalOpen(false); },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CategoryFormData> }) =>
      categoryService.updateCategory(id, data),
    onSuccess: () => { invalidate(); setIsModalOpen(false); setEditingCategory(null); },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: categoryService.deleteCategory,
    onSuccess: () => { invalidate(); setDeleting(null); },
  });

  const handleSubmitCategory = (data: CategoryFormData) => {
    if (editingCategory) updateCategoryMutation.mutate({ id: editingCategory.id, data });
    else createCategoryMutation.mutate(data);
  };

  // Per-category task breakdown, computed from the task list
  const breakdown = useMemo(() => {
    const map = new Map<number, { total: number; done: number; overdue: number; open: TaskLite[] }>();
    tasks.forEach(t => {
      if (t.categoryId == null) return;
      const b = map.get(t.categoryId) || { total: 0, done: 0, overdue: 0, open: [] };
      b.total++;
      if (t.status === 'DONE') b.done++;
      else b.open.push(t);
      if (isOverdue(t.dueDate, t.status)) b.overdue++;
      map.set(t.categoryId, b);
    });
    return map;
  }, [tasks]);

  const uncategorized = tasks.filter(t => t.categoryId == null && t.status !== 'DONE').length;

  const openNew = () => { setEditingCategory(null); setIsModalOpen(true); };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Categories"
          subtitle="Group your tasks by class, project or part of life."
          actions={
            <button
              onClick={openNew}
              className="flex items-center gap-2 px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium shadow-sm"
            >
              <Plus className="w-5 h-5" /> New category
            </button>
          }
        />

        {isLoading && (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => <div key={i} className="h-44 bg-white rounded-2xl border border-gray-200 animate-pulse" />)}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-800" role="alert">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>Failed to load categories. Please refresh to try again.</p>
          </div>
        )}

        {!isLoading && !error && (
          categories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 text-center py-14 px-6">
              <div className="w-14 h-14 bg-flow-lavender rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-7 h-7 text-flow-purple" />
              </div>
              <h2 className="font-heading text-2xl text-gray-900 mb-1">No categories yet</h2>
              <p className="text-gray-500 mb-6">Try “School”, “Work” or “Home” to keep related tasks together.</p>
              <button
                onClick={openNew}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium"
              >
                <Plus className="w-5 h-5" /> Create a category
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {categories.map(category => {
                  const Icon = getCategoryIcon(category.icon);
                  const b = breakdown.get(category.id) || { total: 0, done: 0, overdue: 0, open: [] };
                  const percent = b.total ? Math.round((b.done / b.total) * 100) : 0;
                  return (
                    <article key={category.id} className="bg-white rounded-2xl border-t-4 shadow-sm p-4 sm:p-5 flex flex-col hover:shadow-md transition-shadow" style={{ borderTopColor: category.color }}>
                      <div className="flex items-start gap-3">
                        <div
                          className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${category.color}26`, color: category.color }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="font-sans font-semibold text-gray-900 truncate">{category.name}</h2>
                          <p className="text-xs text-gray-500">
                            {b.open.length} open · {b.done} done
                            {b.overdue > 0 && <span className="text-red-600"> · {b.overdue} overdue</span>}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => { setEditingCategory(category); setIsModalOpen(true); }}
                            aria-label={`Edit ${category.name}`}
                            className="p-2 text-gray-400 hover:text-flow-purple hover:bg-flow-lavender/60 rounded-lg"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleting(category)}
                            aria-label={`Delete ${category.name}`}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: `${category.color}26` }} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${category.name} progress`}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, backgroundColor: category.color }} />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-9 text-right">{percent}%</span>
                      </div>

                      <ul className="mt-3 space-y-1 flex-1">
                        {b.open.slice(0, 3).map(t => (
                          <li key={t.id} className="flex items-center gap-2 text-sm text-gray-700">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: category.color }} aria-hidden />
                            <span className="truncate">{t.title}</span>
                          </li>
                        ))}
                        {b.total === 0 && <li className="text-sm text-gray-400">No tasks yet</li>}
                        {b.total > 0 && b.open.length === 0 && <li className="text-sm text-green-600">All done 🎉</li>}
                      </ul>

                      <Link
                        to={`/dashboard?category=${category.id}#task-board`}
                        className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-flow-purple hover:underline self-start"
                      >
                        View tasks <ArrowRight className="h-4 w-4" />
                      </Link>
                    </article>
                  );
                })}
              </div>
              {uncategorized > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  {uncategorized} open task{uncategorized === 1 ? ' has' : 's have'} no category. Edit a task to give it one.
                </p>
              )}
            </>
          )
        )}

        <CategoryModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCategory(null); }}
          onSubmit={handleSubmitCategory}
          category={editingCategory}
        />

        {deleting && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4" role="alertdialog" aria-modal="true" aria-labelledby="del-cat-title">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-sm pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
              <h3 id="del-cat-title" className="font-heading text-2xl text-gray-900 mb-1">Delete “{deleting.name}”?</h3>
              <p className="text-gray-600 mb-6 text-sm">Its tasks won't be deleted. They'll just have no category.</p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDeleting(null)} className="px-4 py-2.5 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
                <button
                  onClick={() => deleteCategoryMutation.mutate(deleting.id)}
                  disabled={deleteCategoryMutation.isPending}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-60"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
