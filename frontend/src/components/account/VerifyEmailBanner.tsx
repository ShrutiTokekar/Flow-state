import React, { useEffect, useState } from 'react';
import { MailCheck, X } from 'lucide-react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { errorMessage } from '../../services/sharedCalendarService';

/** Reminds people who signed up with email + password to confirm their address. */
export const VerifyEmailBanner: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  const unverified = user?.emailVerified === false;

  // They may have confirmed on another device (e.g. from their phone's mail app); refresh once.
  useEffect(() => {
    if (!unverified) return;
    api.get('/users/me').then(r => {
      if (r.data?.emailVerified) {
        const updated = { ...user!, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updated));
        setUser(updated);
      }
    }).catch(() => {});
  }, [unverified]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!unverified || dismissed) return null;

  const resend = async () => {
    setStatus('sending');
    setError('');
    try {
      await api.post('/users/me/resend-verification');
      setStatus('sent');
    } catch (e) {
      setError(errorMessage(e, 'Could not send the email. Try again in a minute.'));
      setStatus('idle');
    }
  };

  return (
    <div className="mb-4 rounded-2xl bg-white border-l-4 border-flow-purple shadow-sm px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2" role="status">
      <MailCheck className="h-5 w-5 text-flow-purple shrink-0" aria-hidden />
      <p className="text-sm text-gray-700 flex-1 min-w-[200px]">
        <strong>Confirm your email.</strong> We sent a link to {user?.email} so reminders and invites reach you.
        {error && <span className="block text-red-600 mt-1">{error}</span>}
      </p>
      {status === 'sent' ? (
        <span className="text-sm text-green-700 font-medium">Sent! Check your inbox.</span>
      ) : (
        <button onClick={resend} disabled={status === 'sending'} className="text-sm font-medium text-flow-purple hover:underline disabled:opacity-60">
          {status === 'sending' ? 'Sending…' : 'Resend email'}
        </button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="p-1 text-gray-400 hover:text-gray-600">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default VerifyEmailBanner;
