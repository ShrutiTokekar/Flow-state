import { LayoutDashboard, Calendar, FolderKanban, Table2 } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', short: 'Home' },
  { to: '/calendar', icon: Calendar, label: 'Calendar', short: 'Calendar' },
  { to: '/categories', icon: FolderKanban, label: 'Categories', short: 'Categories' },
  { to: '/trackers', icon: Table2, label: 'Trackers', short: 'Trackers' },
];
