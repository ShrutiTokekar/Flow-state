import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, LogOut, Settings, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import NotificationPanel from '../notifications/NotificationPanel';
import api from '../../services/api';

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle, isSidebarOpen }) => {
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close the account menu when clicking elsewhere
  useEffect(() => {
    if (!isDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isDropdownOpen]);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread/count');
      setUnreadCount(res.data.count || 0);
    } catch (e) {}
  };

  return (
    <header className="bg-flow-green border-b border-green-300/60 sticky top-0 z-30 pt-[env(safe-area-inset-top)] shrink-0">
      <div className="h-16 px-2 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
        {/* Left — menu + logo (the sidebar shows the logo on large screens) */}
        <div className="flex items-center gap-1 lg:hidden">
          <button
            onClick={onMenuToggle}
            aria-label="Open menu"
            aria-expanded={isSidebarOpen}
            className="hidden md:inline-flex p-2 rounded-lg text-gray-700 hover:bg-white/50"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 pl-1">
            <img src="/Logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-heading text-2xl text-flow-purple">Flow State</span>
          </Link>
        </div>
        <div className="hidden lg:block" />

        {/* Right — notifications + account */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                if (!isNotificationOpen) setUnreadCount(0);
              }}
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[1rem] h-4 px-1 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {isNotificationOpen && (
              <NotificationPanel onClose={() => setIsNotificationOpen(false)} />
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              aria-label="Account menu"
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-3 pl-1 pr-1 sm:pr-2 py-1 rounded-xl hover:bg-white/50 transition-colors"
            >
              <div className="h-9 w-9 rounded-full bg-flow-purple flex items-center justify-center text-white font-heading text-lg">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</div>
                <div className="text-xs text-gray-600 leading-tight">{user?.email}</div>
              </div>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg py-1 border border-gray-200 z-50">
                <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.name}</div>
                  <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                </div>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsDropdownOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Profile settings
                </Link>
                <button
                  onClick={() => { logout(); setIsDropdownOpen(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
