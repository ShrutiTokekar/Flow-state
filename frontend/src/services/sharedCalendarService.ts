import api from './api';

export type CalendarRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface SharedCalendarSummary {
  id: number;
  name: string;
  color: string;
  role: CalendarRole;
  ownerName: string;
  memberCount: number;
}

export interface CalendarMember {
  userId: number;
  name: string;
  email: string;
  role: CalendarRole;
  joinedAt: string;
}

export interface SharedCalendarDetail {
  id: number;
  name: string;
  color: string;
  role: CalendarRole;
  ownerName: string;
  shareToken: string | null; // only returned to the owner
  members: CalendarMember[];
}

export interface InvitePreview {
  name: string;
  color: string;
  ownerName: string;
  memberCount: number;
}

export interface SharedEvent {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  type: 'task' | 'event' | 'reminder';
  color?: string;
  completed?: boolean;
  calendarId: number;
  createdByName?: string;
}

export interface FreeSlot {
  start: string;
  end: string;
  minutes: number;
}

export interface FreeTimeQuery {
  from: string; // yyyy-MM-dd
  to: string;
  dayStart: string; // HH:mm
  dayEnd: string;
  minMinutes: number;
}

// Inside the iOS app the origin is capacitor://localhost, which nobody else can open,
// so invite links always point at the website there.
const PUBLIC_WEB_URL = process.env.REACT_APP_PUBLIC_URL || 'https://flowstatemanage.com';
const webOrigin = () =>
  window.location.protocol.startsWith('http') ? window.location.origin : PUBLIC_WEB_URL;

export const inviteUrl = (token: string) => `${webOrigin()}/join/${token}`;

// Readable message from a failed request, falling back to a generic one.
export const errorMessage = (e: any, fallback = 'Something went wrong. Please try again.') =>
  e?.response?.data?.message || fallback;

export const sharedCalendarService = {
  list: () => api.get<SharedCalendarSummary[]>('/calendars').then(r => r.data),
  get: (id: number) => api.get<SharedCalendarDetail>(`/calendars/${id}`).then(r => r.data),
  create: (name: string, color: string) =>
    api.post<SharedCalendarDetail>('/calendars', { name, color }).then(r => r.data),
  update: (id: number, changes: { name?: string; color?: string }) =>
    api.put<SharedCalendarDetail>(`/calendars/${id}`, changes).then(r => r.data),
  remove: (id: number) => api.delete(`/calendars/${id}`),

  regenerateLink: (id: number) =>
    api.post<SharedCalendarDetail>(`/calendars/${id}/share-link`).then(r => r.data),
  previewInvite: (token: string) =>
    api.get<InvitePreview>(`/calendars/invite/${encodeURIComponent(token)}`).then(r => r.data),
  join: (token: string) =>
    api.post<SharedCalendarSummary>(`/calendars/invite/${encodeURIComponent(token)}/join`).then(r => r.data),
  changeRole: (id: number, userId: number, role: CalendarRole) =>
    api.put(`/calendars/${id}/members/${userId}`, { role }),
  removeMember: (id: number, userId: number) => api.delete(`/calendars/${id}/members/${userId}`),

  events: (id: number) => api.get<SharedEvent[]>(`/calendars/${id}/events`).then(r => r.data),
  createEvent: (id: number, data: Partial<SharedEvent>) =>
    api.post<SharedEvent>(`/calendars/${id}/events`, data).then(r => r.data),
  updateEvent: (id: number, eventId: number, data: Partial<SharedEvent>) =>
    api.put<SharedEvent>(`/calendars/${id}/events/${eventId}`, data).then(r => r.data),
  deleteEvent: (id: number, eventId: number) => api.delete(`/calendars/${id}/events/${eventId}`),

  /** Pass a calendarId for "when is everyone free", or omit it for just me. */
  freeTime: (q: FreeTimeQuery, calendarId?: number) =>
    api
      .get<FreeSlot[]>(calendarId ? `/calendars/${calendarId}/free-time` : '/calendar/free-time', { params: q })
      .then(r => r.data),
};
