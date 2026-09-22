import React, { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw, Trash2, LogOut, Users, X } from 'lucide-react';
import {
  sharedCalendarService,
  SharedCalendarDetail,
  CalendarRole,
  inviteUrl,
  errorMessage,
} from '../../services/sharedCalendarService';
import { useAuthStore } from '../../store/authStore';

export const CALENDAR_COLORS = ['#8894d1', '#dfa4c6', '#7cc47f', '#f0b35e', '#5bb8d6', '#c98bdb'];

const ModalShell: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div
    className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onClick={onClose}
  >
    <div
      className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] flex flex-col pb-[env(safe-area-inset-bottom)]"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h2 className="text-xl font-heading text-gray-900">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-lg">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="overflow-y-auto">{children}</div>
    </div>
  </div>
);

const ColorPicker: React.FC<{ value: string; onChange: (c: string) => void }> = ({ value, onChange }) => (
  <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Calendar color">
    {CALENDAR_COLORS.map(c => (
      <button
        key={c}
        type="button"
        role="radio"
        aria-checked={value === c}
        aria-label={`Color ${c}`}
        onClick={() => onChange(c)}
        className={`h-9 w-9 rounded-full flex items-center justify-center ring-offset-2 ${value === c ? 'ring-2 ring-gray-800' : ''}`}
        style={{ backgroundColor: c }}
      >
        {value === c && <Check className="h-4 w-4 text-white" />}
      </button>
    ))}
  </div>
);

// ── Create ────────────────────────────────────────────────────────────────

export const NewCalendarModal: React.FC<{
  onClose: () => void;
  onCreated: (cal: SharedCalendarDetail) => void;
}> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState(CALENDAR_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      onCreated(await sharedCalendarService.create(name.trim(), color));
    } catch (err) {
      setError(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <ModalShell title="New shared calendar" onClose={onClose}>
      <form onSubmit={submit} className="p-5 space-y-5">
        <p className="text-sm text-gray-600">
          Make a calendar for your roommates, study group, team or family. Anyone you send the link to can add events and tasks.
        </p>
        <div>
          <label htmlFor="cal-name" className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
          <input
            id="cal-name"
            autoFocus
            maxLength={60}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Apartment 4B, CS Study Group"
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-flow-purple"
          />
        </div>
        <div>
          <span className="block text-sm font-semibold text-gray-700 mb-2">Color</span>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium">Cancel</button>
          <button
            type="submit"
            disabled={!name.trim() || saving}
            className="px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Create calendar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
};

// ── Share & members ───────────────────────────────────────────────────────

const ROLE_LABEL: Record<CalendarRole, string> = { OWNER: 'Owner', EDITOR: 'Can edit', VIEWER: 'View only' };

export const ShareCalendarModal: React.FC<{
  calendarId: number;
  onClose: () => void;
  onChanged: () => void; // renamed, recolored, members changed
  onGone: () => void;    // deleted or left
}> = ({ calendarId, onClose, onChanged, onGone }) => {
  const currentUser = useAuthStore(s => s.user);
  const [cal, setCal] = useState<SharedCalendarDetail | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () =>
    sharedCalendarService.get(calendarId).then(setCal).catch(e => setError(errorMessage(e)));

  useEffect(() => { load(); }, [calendarId]); // eslint-disable-line react-hooks/exhaustive-deps

  const isOwner = cal?.role === 'OWNER';
  const link = cal?.shareToken ? inviteUrl(cal.shareToken) : '';
  const me = cal?.members.find(m => m.email === currentUser?.email);

  const run = async (action: () => Promise<unknown>, after?: () => void) => {
    setError('');
    try {
      await action();
      if (after) {
        after();
      } else {
        await load();
        onChanged();
      }
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const copyLink = async () => {
    const nav: any = navigator;
    // The native share sheet is the natural choice on phones (Messages, WhatsApp, …).
    if (nav.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await nav.share({ title: `Join ${cal?.name} on Flow State`, url: link });
        return;
      } catch { /* cancelled — fall back to copying */ }
    }
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the link and copy it manually.');
    }
  };

  return (
    <ModalShell title={cal ? `Share “${cal.name}”` : 'Share calendar'} onClose={onClose}>
      {!cal ? (
        <div className="p-5 text-sm text-gray-500">{error || 'Loading…'}</div>
      ) : (
        <div className="p-5 space-y-6">
          {isOwner ? (
            <section className="space-y-2">
              <h3 className="font-sans font-semibold text-gray-800 text-sm">Invite link</h3>
              <p className="text-sm text-gray-600">Anyone with this link can join after signing in to Flow State. New members can add and edit items.</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  onFocus={e => e.target.select()}
                  aria-label="Invite link"
                  className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 text-gray-700"
                />
                <button
                  onClick={copyLink}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 text-sm font-medium shrink-0"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Share'}
                </button>
              </div>
              <button
                onClick={() => run(() => sharedCalendarService.regenerateLink(calendarId))}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 py-1"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reset link (the old one stops working)
              </button>
            </section>
          ) : (
            <p className="text-sm text-gray-600">
              Owned by <strong>{cal.ownerName}</strong>. Ask them for the invite link to add more people.
            </p>
          )}

          <section>
            <h3 className="font-sans font-semibold text-gray-800 text-sm mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4" /> Members ({cal.members.length})
            </h3>
            <ul className="divide-y divide-gray-100">
              {cal.members.map(m => (
                <li key={m.userId} className="flex items-center gap-3 py-2.5">
                  <div className="h-9 w-9 rounded-full bg-flow-lavender flex items-center justify-center font-heading text-flow-purple shrink-0">
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {m.name}{m.userId === me?.userId && <span className="text-gray-400"> (you)</span>}
                    </div>
                    <div className="text-xs text-gray-500 truncate">{m.email}</div>
                  </div>
                  {isOwner && m.role !== 'OWNER' ? (
                    <div className="flex items-center gap-1">
                      <select
                        value={m.role}
                        aria-label={`Access for ${m.name}`}
                        onChange={e => run(() => sharedCalendarService.changeRole(calendarId, m.userId, e.target.value as CalendarRole))}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
                      >
                        <option value="EDITOR">Can edit</option>
                        <option value="VIEWER">View only</option>
                      </select>
                      <button
                        aria-label={`Remove ${m.name}`}
                        onClick={() => run(() => sharedCalendarService.removeMember(calendarId, m.userId))}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-500">{ROLE_LABEL[m.role]}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

          <section className="pt-2 border-t border-gray-100">
            {isOwner ? (
              confirmDelete ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-700">Delete this calendar and everything in it for everyone?</span>
                  <button
                    onClick={() => run(() => sharedCalendarService.remove(calendarId), onGone)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg font-medium"
                  >
                    Delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="px-3 py-2 bg-gray-100 rounded-lg">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 py-1">
                  <Trash2 className="h-4 w-4" /> Delete calendar
                </button>
              )
            ) : (
              me && (
                <button
                  onClick={() => run(() => sharedCalendarService.removeMember(calendarId, me.userId), onGone)}
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 py-1"
                >
                  <LogOut className="h-4 w-4" /> Leave calendar
                </button>
              )
            )}
          </section>
        </div>
      )}
    </ModalShell>
  );
};
