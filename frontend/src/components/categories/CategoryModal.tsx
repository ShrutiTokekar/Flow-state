import React, { useState, useEffect } from 'react';
import { Category, CategoryFormData } from '../../types';
import { X, Check } from 'lucide-react';
import * as Icons from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => void;
  category?: Category | null;
}

// Flow State theme colors
const THEME_COLORS = [
  { label: 'Purple',    value: '#8894d1' },
  { label: 'Pink',      value: '#dfa4c6' },
  { label: 'Lavender',  value: '#dfc9e6' },
  { label: 'Green',     value: '#cae892' },
  { label: 'Yellow',    value: '#fdfac5' },
  { label: 'Soft Blue', value: '#cad1f1' },
  { label: 'Rose',      value: '#f4a7b9' },
  { label: 'Mint',      value: '#a8e6cf' },
  { label: 'Peach',     value: '#ffcba4' },
  { label: 'Sky',       value: '#87ceeb' },
];

const CATEGORY_ICONS = [
  { value: 'folder', label: 'Folder' },
  { value: 'briefcase', label: 'Work' },
  { value: 'home', label: 'Home' },
  { value: 'heart', label: 'Personal' },
  { value: 'book', label: 'Study' },
  { value: 'shopping-cart', label: 'Shopping' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'music', label: 'Music' },
  { value: 'camera', label: 'Creative' },
  { value: 'code', label: 'Dev' },
  { value: 'star', label: 'Important' },
  { value: 'target', label: 'Goals' },
  { value: 'coffee', label: 'Daily' },
  { value: 'plane', label: 'Travel' },
  { value: 'dollar-sign', label: 'Finance' },
];

const getIconComponent = (iconName: string) => {
  const key = iconName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  return (Icons as any)[key] || Icons.Folder;
};

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, onSubmit, category }) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: THEME_COLORS[0].value,
    icon: 'folder',
  });

  useEffect(() => {
    if (category) {
      setFormData({ name: category.name, color: category.color, icon: category.icon });
    } else {
      setFormData({ name: '', color: THEME_COLORS[0].value, icon: 'folder' });
    }
  }, [category, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-flow-purple focus:border-transparent";
  const IconPreview = getIconComponent(formData.icon || 'folder');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 font-heading">
              {category ? 'Edit Category' : 'New Category'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-flow-lavender rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 font-sans">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                placeholder="e.g., Work, Personal, Study"
                maxLength={50}
              />
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2">
                {THEME_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => setFormData({ ...formData, color: c.value })}
                    className={`w-full aspect-square rounded-xl transition-all flex items-center justify-center ${
                      formData.color === c.value
                        ? 'ring-2 ring-offset-2 ring-flow-purple scale-110 shadow-md'
                        : 'hover:scale-105 hover:shadow-sm'
                    }`}
                    style={{ backgroundColor: c.value }}
                  >
                    {formData.color === c.value && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2">
                {CATEGORY_ICONS.map((icon) => {
                  const IconComp = getIconComponent(icon.value);
                  const isSelected = formData.icon === icon.value;
                  return (
                    <button
                      key={icon.value}
                      type="button"
                      title={icon.label}
                      onClick={() => setFormData({ ...formData, icon: icon.value })}
                      className={`p-3 rounded-xl transition-all ${
                        isSelected
                          ? 'ring-2 ring-flow-purple scale-105 shadow-sm'
                          : 'hover:scale-105'
                      }`}
                      style={{
                        backgroundColor: isSelected ? `${formData.color}30` : '#f3f4f6',
                        color: isSelected ? formData.color : '#6b7280',
                      }}
                    >
                      <IconComp className="w-5 h-5 mx-auto" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-xl p-4" style={{ backgroundColor: `${formData.color}15`, border: `1px solid ${formData.color}40` }}>
              <p className="text-xs text-gray-500 mb-2 font-sans uppercase tracking-wide">Preview</p>
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium font-sans text-sm"
                style={{ backgroundColor: `${formData.color}25`, color: formData.color }}
              >
                <IconPreview className="w-4 h-4" />
                <span>{formData.name || 'Category Name'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-flow-purple text-white py-2.5 rounded-xl hover:bg-purple-600 transition-colors font-sans font-medium"
              >
                {category ? 'Update' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-flow-lavender text-gray-700 py-2.5 rounded-xl hover:bg-purple-200 transition-colors font-sans font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};