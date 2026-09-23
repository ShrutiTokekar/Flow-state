import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { takePostLoginRedirect } from '../utils/postLoginRedirect';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setAuthenticated } = useAuthStore();

  useEffect(() => {
    // The backend puts the token in the URL fragment (#token=...), which is never sent to any
    // server. Read it, then wipe it from the address bar and browser history right away.
    const params = new URLSearchParams(window.location.hash.slice(1));
    window.history.replaceState(null, '', window.location.pathname);
    const token = params.get('token');
    const email = params.get('email');
    const name = params.get('name');

    if (token && email && name) {
      // Store token and user data
      localStorage.setItem('token', token);
      
      const user = {
        id: 0, // Will be updated from backend
        email,
        name,
        role: 'USER',
        emailNotifications: true,
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth store
      setUser(user);
      setAuthenticated(true);
      
      // Redirect to dashboard
      navigate(takePostLoginRedirect(), { replace: true });
    } else {
      // Failed to get token, redirect to login
      navigate('/login', { replace: true });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-lg text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};