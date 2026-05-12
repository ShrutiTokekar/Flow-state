import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Loader2 } from 'lucide-react';

export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setAuthenticated } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    const name = searchParams.get('name');

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
      navigate('/dashboard', { replace: true });
    } else {
      // Failed to get token, redirect to login
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, setUser, setAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
        <p className="text-lg text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};