import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { sharedCalendarService, InvitePreview, errorMessage, announceCalendarsChanged } from '../services/sharedCalendarService';
import { setPostLoginRedirect } from '../utils/postLoginRedirect';

/** Landing spot for an invite link: /join/:token */
export const JoinCalendar: React.FC = () => {
  const { token = '' } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    sharedCalendarService
      .previewInvite(token)
      .then(setInvite)
      .catch(e => setError(errorMessage(e, 'This invite link is invalid or has been reset.')));
  }, [token]);

  const rememberInvite = () => setPostLoginRedirect(`/join/${token}`);

  const join = async () => {
    setJoining(true);
    setError('');
    try {
      const cal = await sharedCalendarService.join(token);
      announceCalendarsChanged();
      navigate(`/calendars/${cal.id}`, { replace: true });
    } catch (e) {
      setError(errorMessage(e, 'Could not join this calendar.'));
      setJoining(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-flow-purple flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-6">
          <img src="/Logo.png" alt="" className="h-10 w-10 object-contain" />
          <span className="font-heading text-2xl text-flow-purple">Flow State</span>
        </Link>

        {!invite && !error && (
          <div className="py-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-flow-purple" aria-label="Loading" /></div>
        )}

        {error && !invite && (
          <>
            <h1 className="font-heading text-3xl text-gray-900 mb-2">Link not working</h1>
            <p className="text-gray-600 mb-6">{error} Ask whoever sent it for a new link.</p>
            <Link to={isAuthenticated ? '/calendar' : '/'} className="text-flow-purple font-medium">Go to Flow State</Link>
          </>
        )}

        {invite && (
          <>
            <div className="h-16 w-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: invite.color || '#8894d1' }}>
              <Users className="h-8 w-8 text-white" />
            </div>
            <p className="text-gray-600">{invite.ownerName} invited you to</p>
            <h1 className="font-heading text-4xl text-gray-900 mb-1 break-words">{invite.name}</h1>
            <p className="text-sm text-gray-500 mb-8">
              {invite.memberCount} member{invite.memberCount === 1 ? '' : 's'} · shared calendar
            </p>

            {error && <p className="text-sm text-red-600 mb-4" role="alert">{error}</p>}

            {isAuthenticated ? (
              <button
                onClick={join}
                disabled={joining}
                className="w-full py-3.5 bg-flow-purple text-white rounded-xl font-semibold text-lg hover:bg-primary-500 disabled:opacity-60"
              >
                {joining ? 'Joining…' : 'Join calendar'}
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  to="/register"
                  onClick={rememberInvite}
                  className="block w-full py-3.5 bg-flow-purple text-white rounded-xl font-semibold text-lg hover:bg-primary-500"
                >
                  Sign up to join
                </Link>
                <Link
                  to="/login"
                  onClick={rememberInvite}
                  className="block w-full py-3.5 border-2 border-flow-purple text-flow-purple rounded-xl font-semibold hover:bg-flow-lavender"
                >
                  I already have an account
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default JoinCalendar;
