// Task due dates arrive as "yyyy-MM-dd" or "yyyy-MM-ddTHH:mm[:ss]".
export const parseDue = (due: string): Date => new Date(due.includes('T') ? due : `${due}T00:00:00`);

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const daysFromToday = (d: Date) =>
  Math.round((startOfDay(d).getTime() - startOfDay(new Date()).getTime()) / 86_400_000);

export type DueTone = 'overdue' | 'today' | 'soon' | 'later' | 'done';

/** Short, human label for a due date: "Overdue · Sep 20", "Today", "Tomorrow", "Fri", "Oct 3". */
export const dueLabel = (due: string, isDone: boolean): { label: string; tone: DueTone } => {
  const date = parseDue(due);
  const days = daysFromToday(date);
  const hasTime = due.includes('T') && !due.slice(11).startsWith('00:00');
  const time = hasTime ? ' ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
  const short = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (isDone) return { label: short, tone: 'done' };
  if (days < 0) return { label: `Overdue · ${short}`, tone: 'overdue' };
  if (days === 0) return { label: `Today${time}`, tone: 'today' };
  if (days === 1) return { label: `Tomorrow${time}`, tone: 'soon' };
  if (days < 7) return { label: date.toLocaleDateString('en-US', { weekday: 'short' }) + time, tone: 'soon' };
  return { label: short, tone: 'later' };
};

export const isOverdue = (due: string | undefined, status: string) =>
  !!due && status !== 'DONE' && daysFromToday(parseDue(due)) < 0;

export const isDueToday = (due: string | undefined) => !!due && daysFromToday(parseDue(due)) === 0;
