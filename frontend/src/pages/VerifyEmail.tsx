import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { errorMessage } from '../services/sharedCalendarService';

/** Opened from the link in the confirmation email: /verify-email?token=… */
export const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [state, setState] = useState<'working' | 'done' | 'error'>('working');
  const [message, setMessage] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // the token is single-use; don't submit it twice in dev StrictMode
    ran.current = true;
    const token = params.get('token');
    if (!token) {
      setState('error');
      setMessage('This confirmation link is missing its code.');
      return;
    }
    api.post('/auth/verify-email', { token })
      .then(res => {
        setState('done');
        if (isAuthenticated && user && res.data?.email === user.email) {
          const updated = { ...user, emailVerified: true };
          localStorage.setItem('user', JSON.stringify(updated));
          setUser(updated);
        }
      })
      .catch(e => {
        setState('error');
        setMessage(errorMessage(e, 'This confirmation link is invalid or has expired.'));
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[100dvh] bg-flow-purple flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src="/Logo.png" alt="" className="h-10 w-10 object-contain" />
          <span className="font-heading text-2xl text-flow-purple">Flow State</span>
        </Link>
        {state === 'working' && (
          <div className="py-6 flex flex-col items-center gap-3 text-gray-600">
            <Loader2 className="h-8 w-8 animate-spin text-flow-purple" aria-hidden />
            Confirming your email…
          </div>
        )}
        {state === 'done' && (
          <>
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" aria-hidden />
            <h1 className="font-heading text-3xl text-gray-900 mb-2">Email confirmed</h1>
            <p className="text-gray-600 mb-6">You'll now get reminders and calendar invites by email.</p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="inline-block w-full py-3 bg-flow-purple text-white rounded-xl font-semibold hover:bg-primary-500">
              {isAuthenticated ? 'Go to my dashboard' : 'Log in'}
            </Link>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="h-14 w-14 text-red-400 mx-auto mb-3" aria-hidden />
            <h1 className="font-heading text-3xl text-gray-900 mb-2">Link not working</h1>
            <p className="text-gray-600 mb-6">{message} You can request a new email from the banner in the app.</p>
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="inline-block w-full py-3 bg-flow-purple text-white rounded-xl font-semibold hover:bg-primary-500">
              {isAuthenticated ? 'Back to Flow State' : 'Log in'}
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
