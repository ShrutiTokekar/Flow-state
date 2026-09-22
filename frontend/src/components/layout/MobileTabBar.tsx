import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar, FolderKanban, User } from 'lucide-react';

const tabs = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tasks' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/categories', icon: FolderKanban, label: 'Categories' },
  { to: '/profile', icon: User, label: 'Profile' },
];

/** App-style bottom navigation, shown on phones only. */
export const MobileTabBar: React.FC = () => (
  <nav
    aria-label="Main"
    className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
  >
    <ul className="grid grid-cols-4">
      {tabs.map(({ to, icon: Icon, label }) => (
        <li key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-flow-purple' : 'text-gray-500'}`
            }
          >
            <Icon className="h-6 w-6" aria-hidden />
            {label}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default MobileTabBar;
