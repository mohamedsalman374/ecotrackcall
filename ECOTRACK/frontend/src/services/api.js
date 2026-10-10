import { supabase } from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Universal fetch wrapper for EcoTrack Express REST API.
 * Automatically injects Supabase Bearer token if session exists.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = options.headers ? { ...options.headers } : {};

  // Retrieve current session token from Supabase
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.debug('No active supabase session token found:', err);
  }

  // Handle json payload formatting
  let body = options.body;
  if (body && !(body instanceof FormData) && !(body instanceof Blob) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  // Handle binary / blob responses (e.g., CSV, PDF downloads)
  if (options.responseType === 'blob') {
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `Request failed with status ${response.status}`);
    }
    return response.blob();
  }

  const contentType = response.headers.get('content-type') || '';
  let responseData;
  if (contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (typeof responseData === 'object' && responseData !== null && responseData.error)
      ? responseData.error
      : (typeof responseData === 'string' && responseData.length < 200 ? responseData : `HTTP ${response.status} Error`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = responseData;
    throw error;
  }

  return responseData;
}

export const api = {
  // Auth
  auth: {
    signup: (data) => request('/api/auth/signup', { method: 'POST', body: data }),
    login: (data) => request('/api/auth/login', { method: 'POST', body: data }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    me: () => request('/api/auth/me'),
    forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (password) => request('/api/auth/reset-password', { method: 'POST', body: { password } }),
  },

  // Dashboard
  dashboard: {
    getSummary: () => request('/api/dashboard/summary'),
  },

  // Calculator
  calculator: {
    calculate: (data) => request('/api/calculator/calculate', { method: 'POST', body: data }),
    getById: (id) => request(`/api/calculator/${id}`),
    getLatest: () => request('/api/calculator/latest'),
    getFactors: () => request('/api/calculator/factors'),
  },

  // AI & Recommendations
  ai: {
    getRecommendations: () => request('/api/ai/recommendations'),
    generate: (prompt) => request('/api/ai/generate', { method: 'POST', body: { prompt } }),
  },

  // Analytics
  analytics: {
    getData: (range = 'all') => request(`/api/analytics?range=${encodeURIComponent(range)}`),
  },

  // History
  history: {
    getList: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/history${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/api/history/${id}`),
    delete: (id) => request(`/api/history/${id}`, { method: 'DELETE' }),
    batchDelete: (ids) => request('/api/history/batch-delete', { method: 'POST', body: { ids } }),
    deleteAll: () => request('/api/history/delete-all', { method: 'POST' }),
    exportCSV: () => request('/api/history/export/csv', { responseType: 'blob' }),
    exportPDF: () => request('/api/history/export/pdf', { responseType: 'blob' }),
  },

  // Profile
  profile: {
    get: () => request('/api/profile'),
    update: (data) => request('/api/profile', { method: 'PUT', body: data }),
    uploadAvatar: (formData) => request('/api/profile/avatar', { method: 'POST', body: formData }),
    deleteAvatar: () => request('/api/profile/avatar', { method: 'DELETE' }),
    changePassword: (oldPassword, newPassword) =>
      request('/api/profile/change-password', {
        method: 'POST',
        body: { old_password: oldPassword, new_password: newPassword },
      }),
  },

  // Feedback
  feedback: {
    submit: (formData) => request('/api/feedback', { method: 'POST', body: formData }),
    getMyFeedback: () => request('/api/feedback/my'),
    delete: (id) => request(`/api/feedback/${id}`, { method: 'DELETE' }),
  },

  // Admin
  admin: {
    getStats: () => request('/api/admin/stats'),
    getUsers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/admin/users${query ? `?${query}` : ''}`);
    },
    toggleRole: (id, role) => request(`/api/admin/users/${id}/role`, { method: 'PUT', body: { role } }),
    toggleStatus: (id, isActive) => request(`/api/admin/users/${id}/status`, { method: 'PUT', body: { is_active: isActive } }),
    getCalculations: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/admin/calculations${query ? `?${query}` : ''}`);
    },
    getFeedback: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/admin/feedback${query ? `?${query}` : ''}`);
    },
    updateFeedbackStatus: (id, status) => request(`/api/admin/feedback/${id}/status`, { method: 'PUT', body: { status } }),
    exportAnalytics: () => request('/api/admin/export/analytics', { responseType: 'blob' }),
  },
};
