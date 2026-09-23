import React, { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { errorMessage } from '../services/sharedCalendarService';
import { User as UserIcon, Mail, Bell, KeyRound, ShieldCheck, LogOut } from 'lucide-react';

const Card: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
  <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6">
    <h2 className="font-sans font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-flow-purple" aria-hidden /> {title}
    </h2>
    {children}
  </section>
);

export const Profile: React.FC = () => {
  const { user, setUser, logout } = useAuthStore();

  const [savingNotif, setSavingNotif] = useState(false);
  const [notifError, setNotifError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus, setPwStatus] = useState<{ ok?: string; error?: string }>({});
  const [changing, setChanging] = useState(false);

  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);

  if (!user) return null;

  const saveUser = (changes: Partial<typeof user>) => {
    const updated = { ...user, ...changes };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const toggleEmailNotifications = async () => {
    const next = !user.emailNotifications;
    setSavingNotif(true);
    setNotifError('');
    try {
      await api.put('/users/me', { emailNotifications: next });
      saveUser({ emailNotifications: next });
    } catch (e) {
      setNotifError(errorMessage(e, 'Could not save. Please try again.'));
    } finally {
      setSavingNotif(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwStatus({});
    if (newPassword.length < 8) return setPwStatus({ error: 'Your new password needs at least 8 characters.' });
    if (newPassword !== confirmPassword) return setPwStatus({ error: "The new passwords don't match." });
    setChanging(true);
    try {
      const res = await api.put('/users/me/password', { currentPassword, newPassword });
      // Other devices are signed out; keep this one signed in with the fresh token
      localStorage.setItem('token', res.data.token);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwStatus({ ok: 'Password changed. You were signed out on your other devices.' });
    } catch (err) {
      setPwStatus({ error: errorMessage(err, 'Could not change your password.') });
    } finally {
      setChanging(false);
    }
  };

  const logoutEverywhere = async () => {
    try {
      await api.post('/users/me/logout-all');
    } finally {
      logout();
      window.location.href = '/login';
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-flow-purple';

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <PageHeader title="Profile settings" subtitle="Your account, notifications and security" />

        <div className="space-y-5">
          <Card title="Account" icon={UserIcon}>
            <dl className="space-y-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{user.name}</dd>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <dt className="text-gray-500 flex items-center gap-1.5"><Mail className="h-4 w-4" aria-hidden /> Email</dt>
                <dd className="font-medium text-gray-900 break-all">
                  {user.email}
                  {user.emailVerified === false && <span className="ml-2 text-xs text-orange-600">(not confirmed)</span>}
                </dd>
              </div>
            </dl>
          </Card>

          <Card title="Notifications" icon={Bell}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 text-sm">Email notifications</p>
                <p className="text-sm text-gray-500">Due-soon and overdue alerts, and when someone joins your calendar. Reminders you set to "App + email" always send.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!user.emailNotifications}
                aria-label="Email notifications"
                onClick={toggleEmailNotifications}
                disabled={savingNotif}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${user.emailNotifications ? 'bg-flow-purple' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${user.emailNotifications ? 'translate-x-5' : ''}`} />
              </button>
            </div>
            {notifError && <p className="text-sm text-red-600 mt-2" role="alert">{notifError}</p>}
          </Card>

          <Card title="Change password" icon={KeyRound}>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label htmlFor="pw-current" className="block text-sm font-medium text-gray-700 mb-1">Current password</label>
                <input id="pw-current" type="password" autoComplete="current-password" value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)} className={inputClass} />
                <p className="text-xs text-gray-500 mt-1">Leave blank if you've only ever signed in with Google.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pw-new" className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                  <input id="pw-new" type="password" autoComplete="new-password" minLength={8} maxLength={72} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="pw-confirm" className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
                  <input id="pw-confirm" type="password" autoComplete="new-password" maxLength={72} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)} className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-gray-500">At least 8 characters. Changing it signs you out on your other devices.</p>
              {pwStatus.error && <p className="text-sm text-red-600" role="alert">{pwStatus.error}</p>}
              {pwStatus.ok && <p className="text-sm text-green-700" role="status">{pwStatus.ok}</p>}
              <button type="submit" disabled={changing || !newPassword}
                className="px-4 py-2.5 bg-flow-purple text-white rounded-xl hover:bg-primary-500 font-medium text-sm disabled:opacity-50">
                {changing ? 'Saving…' : 'Change password'}
              </button>
            </form>
          </Card>

          <Card title="Security" icon={ShieldCheck}>
            <p className="text-sm text-gray-600 mb-3">
              Lost a phone or used a shared computer? Sign out everywhere, including this device.
            </p>
            {confirmLogoutAll ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-700">Sign out on all devices now?</span>
                <button onClick={logoutEverywhere} className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium">Sign out everywhere</button>
                <button onClick={() => setConfirmLogoutAll(false)} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmLogoutAll(true)} className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" /> Log out of all devices
              </button>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};
