import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Calendar } from 'lucide-react';
import api from '../../services/api';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<TaskStats>({ total: 0, completed: 0, pending: 0 });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const response = await api.get('/tasks');
      const tasks = response.data;
      setStats({
        total: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'DONE').length,
        pending: tasks.filter((t: any) => t.status === 'TODO').length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/calendar', icon: Calendar, label: 'Calendar' },
    { to: '/categories', icon: FolderKanban, label: 'Categories' },
  ];

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-sans ${
      isActive
        ? 'bg-flow-purple text-white shadow-md'
        : 'text-gray-700 hover:bg-flow-lavender'
    }`;

  return (
    <>
      {/* Overlay — all screen sizes */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar — always a slide-in drawer, never static */}
      <aside
        className={`
          fixed top-16 bottom-0 left-0 z-50
          w-64 bg-flow-pink border-r border-flow-lavender
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col overflow-y-auto">
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={navLinkClass}
                  onClick={onClose}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Quick Stats */}
            <div className="pt-6 mt-6 border-t border-flow-lavender">
              <h3 className="px-4 text-xs font-semibold text-white uppercase tracking-wider font-sans mb-3">
                Quick Stats
              </h3>
              <div className="space-y-2">
                <div className="px-4 py-2 rounded-lg bg-flow-lavender">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-sans">Total Tasks</span>
                    <span className="text-lg font-bold text-flow-purple font-heading">{stats.total}</span>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-flow-green">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-sans">Completed</span>
                    <span className="text-lg font-bold text-green-700 font-heading">{stats.completed}</span>
                  </div>
                </div>
                <div className="px-4 py-2 rounded-lg bg-flow-yellow">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-sans">Pending</span>
                    <span className="text-lg font-bold text-yellow-700 font-heading">{stats.pending}</span>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;