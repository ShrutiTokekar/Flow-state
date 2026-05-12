import React from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { User, Mail, Bell } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

        <div className="space-y-6">
          {/* User Info Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="input bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={user.role}
                  disabled
                  className="input bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Notifications Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              <Bell className="w-5 h-5 inline mr-2" />
              Notifications
            </h2>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive task reminders via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={user.emailNotifications}
                  disabled
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>

          {/* Coming Soon Card */}
          <div className="card bg-gray-50 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">More Settings Coming Soon</h2>
            <p className="text-sm text-gray-600">
              We're working on adding more customization options including theme preferences, 
              password changes, and more!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
