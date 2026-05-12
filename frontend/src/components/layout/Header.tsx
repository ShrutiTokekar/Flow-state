import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, LogOut, Settings, Bell } from 'lucide-react';
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

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread/count');
      setUnreadCount(res.data.count || 0);
    } catch (e) {}
  };

  return (
    <header className="bg-flow-green border-b border-flow-lavender sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left — menu button + logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-md text-gray-600 hover:bg-flow-lavender"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src="./Logo.png" alt="Flow State Logo" className="h-12 w-12 object-contain" />
              <span className="font-heading text-4xl font-bold text-flow-purple">Flow State</span>
            </Link>
          </div>

          {/* Right — notifications + user */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) setUnreadCount(0);
                }}
                className="p-2 rounded-lg hover:bg-flow-lavender transition-colors relative"
              >
                <Bell className="h-6 w-6 text-gray-700" />
                {unreadCount > 0 ? (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-flow-pink rounded-full" />
                )}
              </button>
              {isNotificationOpen && (
                <NotificationPanel onClose={() => setIsNotificationOpen(false)} />
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-flow-lavender transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-medium text-gray-900 font-sans">{user?.name}</div>
                  <div className="text-xs text-gray-500 font-sans">{user?.email}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-flow-purple flex items-center justify-center text-white font-heading text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 border border-gray-200 z-50">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-flow-lavender font-sans"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => { logout(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-sans"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;