import React, { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Plus, Sparkles, X } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { sharedCalendarService, SharedCalendarSummary } from '../../services/sharedCalendarService';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [calendars, setCalendars] = useState<SharedCalendarSummary[] | null>(null);

  useEffect(() => {
    // Hide the section entirely if the backend doesn't support shared calendars yet.
    sharedCalendarService.list().then(setCalendars).catch(() => setCalendars(null));
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive ? 'bg-flow-purple text-white shadow-sm' : 'text-gray-700 hover:bg-white/60 hover:text-gray-900'
    }`;

  return (
    <>
      {/* Overlay for the drawer (below lg) */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={onClose} aria-hidden />}

      <aside
        aria-label="Sidebar"
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0
          bg-flow-lavender border-r border-purple-200/70 flex flex-col
          pt-[env(safe-area-inset-top)]
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
        `}
      >
        <div className="h-16 px-4 flex items-center justify-between shrink-0">
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2">
            <img src="/Logo.png" alt="" className="h-9 w-9 object-contain" />
            <span className="font-heading text-3xl text-flow-purple">Flow State</span>
          </Link>
          <button onClick={onClose} aria-label="Close menu" className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6" aria-label="Main">
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink to={to} className={navLinkClass} onClick={onClose}>
                  <Icon className="h-5 w-5" aria-hidden />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>

          {calendars && (
            <div>
              <div className="flex items-center justify-between px-3 mb-1">
                <h2 className="font-sans text-xs font-semibold uppercase tracking-wide text-gray-500">Shared calendars</h2>
                <Link to="/calendar?new=1" onClick={onClose} aria-label="New shared calendar" className="p-1 text-gray-500 hover:text-flow-purple rounded">
                  <Plus className="h-4 w-4" />
                </Link>
              </div>
              {calendars.length === 0 ? (
                <p className="px-3 py-1 text-xs text-gray-600">Plan with roommates, classmates or your team.</p>
              ) : (
                <ul className="space-y-0.5">
                  {calendars.map(c => (
                    <li key={c.id}>
                      <NavLink to={`/calendars/${c.id}`} className={navLinkClass} onClick={onClose}>
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 ml-1" style={{ backgroundColor: c.color }} />
                        <span className="truncate flex-1">{c.name}</span>
                        <span className="text-xs opacity-70">{c.memberCount}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </nav>

        <div className="p-3 shrink-0">
          <Link
            to="/calendar?freeTime=1"
            onClick={onClose}
            className="block rounded-2xl bg-flow-green hover:bg-white p-4 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-2 font-semibold text-sm text-gray-900">
              <Sparkles className="h-4 w-4" /> Find free time
            </div>
            <p className="text-xs text-gray-700 mt-1">See the open slots in your week.</p>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
