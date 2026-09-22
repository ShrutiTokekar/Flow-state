import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

/** App-style bottom navigation, shown on phones only. */
export const MobileTabBar: React.FC = () => (
  <nav
    aria-label="Main"
    className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
  >
    <ul className="grid grid-cols-4">
      {NAV_ITEMS.map(({ to, icon: Icon, short }) => (
        <li key={to}>
          <NavLink
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-flow-purple font-semibold' : 'text-gray-500'}`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`px-4 py-1 rounded-full ${isActive ? 'bg-flow-purple text-white' : ''}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {short}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

export default MobileTabBar;
