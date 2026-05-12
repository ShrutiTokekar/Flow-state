import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
  icon?: LucideIcon;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, color, icon: Icon }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      border: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      border: 'border-yellow-200'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-lg border ${colors.border} p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colors.text}`}>{value}</p>
        </div>
        {Icon && (
          <div className={`p-3 ${colors.bg} rounded-lg`}>
            <Icon className={`h-8 w-8 ${colors.text}`} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;