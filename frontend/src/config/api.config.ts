
// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.flowstatemanage.com/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  OAUTH_GOOGLE: `${API_BASE_URL}/oauth2/authorization/google`,
  
  // Tasks
  TASKS: `${API_BASE_URL}/api/tasks`,
  TASK_STATS: `${API_BASE_URL}/api/tasks/stats`,

  
  // Categories
  CATEGORIES: `${API_BASE_URL}/api/categories`,
  
  // User
  USER_PROFILE: `${API_BASE_URL}/api/users/profile`,
};

// Development mode check
export const isDevelopment = import.meta.env.MODE === 'development';
export const isProduction = import.meta.env.MODE === 'production';

console.log('🚀 API Configuration:', {
  baseURL: API_BASE_URL,
  mode: isProduction ? 'production' : 'development',
});