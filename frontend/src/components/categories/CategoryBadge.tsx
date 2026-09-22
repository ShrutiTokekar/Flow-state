import React from 'react';
import { Category } from '../../types';
import { getCategoryIcon } from '../../utils/categoryIcons';

interface CategoryBadgeProps {
  category: Category;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ 
  category, 
  size = 'md',
  showIcon = true 
}) => {
  const Icon = getCategoryIcon(category.icon);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        borderColor: category.color,
      }}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      <span>{category.name}</span>
      {category.taskCount !== undefined && category.taskCount > 0 && (
        <span className="ml-1 opacity-75">({category.taskCount})</span>
      )}
    </span>
  );
};
