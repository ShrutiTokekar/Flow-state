import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogIn, Mail, Lock, AlertCircle, ChevronDown } from 'lucide-react';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [showLogin, setShowLogin] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      const loginSection = document.getElementById('login-section');
      if (loginSection) {
        loginSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleScroll = () => {
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth' });
      setShowLogin(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
      navigate('/dashboard');
    } catch (error) {
      // Error is handled by the store
    }
  };

  const handleGoogleLogin = () => {
  window.location.href = 'https://api.flowstatemanage.com/oauth2/authorization/google';
  };

  return (
    <div className="min-h-screen bg-flow-purple overflow-y-scroll snap-y snap-mandatory">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 snap-start relative">
        <div className="animate-slide-down">
          <img 
            src="/Logo.png" 
            alt="Flow State Logo" 
            className="h-80 w-80 md:h-96 md:w-96 object-contain mb-8 drop-shadow-1l"
          />
        </div>

        <h1 className="font-heading text-6xl md:text-8xl font-bold text-flow-green text-center mb-4 animate-fade-in" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>
          Flow State
        </h1>

        <p className="font-sans text-xl md:text-2xl text-text-light-purple text-center max-w-2xl mb-12 animate-fade-in" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>
         Want to get into your own Flow State? </p>
         <p>Start manage your tasks effortlessly the ultimate task management app designed to help you focus, organize, and conquer your to-do list with ease.</p>

        <button
          onClick={handleScroll}
          className="animate-bounce-slow cursor-pointer flex flex-col items-center gap-2 text-flow-green hover:text-flow-yellow transition-colors animate-fade-in"
          style={{ animationDelay: '1s', opacity: 0, animationFillMode: 'forwards' }}
        >
          <span className="font-sans text-lg">Scroll down to try</span>
          <ChevronDown className="w-8 h-8" />
        </button>
      </section>

      {/* Login Section */}
      <section id="login-section" className="min-h-screen flex items-center justify-center px-4 snap-start">
        <div className="max-w-md w-full">
          
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="font-heading text-4xl font-bold text-flow-purple mb-2">
                Welcome Back
              </h2>
              <p className="font-sans text-text-gray">
                Sign in to continue to Flow State
              </p>
            </div>

            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-flow-purple rounded-lg hover:bg-flow-lavender transition-colors mb-6"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="font-sans font-medium text-gray-700">Continue with Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-text-gray font-sans">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-sans">{error}</p>
                </div>
              )}

              {/* Email - NO ICON OVERLAP */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flow-purple focus:border-transparent transition-all bg-white font-sans"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password - NO ICON OVERLAP */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-sans">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-flow-purple focus:border-transparent transition-all bg-white font-sans"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-flow-purple text-text-white hover:bg-primary-600 py-3 rounded-lg font-sans font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-text-gray font-sans">
                Don't have an account?{' '}
                <Link to="/register" className="text-flow-purple hover:text-primary-600 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};