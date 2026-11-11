import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor: Attach token ────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: Handle 401s ────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Normalize error message
    const message =
      response?.data?.message ||
      response?.data?.errors?.[0]?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new Error(message));
  }
);

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/update-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
};

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsAPI = {
  getAll: (params) => api.get('/students', { params }),
  getOne: (id) => api.get(`/students/${id}`),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  bulkImport: (students) => api.post('/students/bulk', { students }),
};

// ─── Attendance ───────────────────────────────────────────────────────────────
export const attendanceAPI = {
  getAll: (params) => api.get('/attendance', { params }),
  mark: (data) => api.post('/attendance', data),
  markBulk: (records) => api.post('/attendance/bulk', { records }),
  update: (id, data) => api.put(`/attendance/${id}`, data),
  delete: (id) => api.delete(`/attendance/${id}`),
  getClassRoster: (params) => api.get('/attendance/class', { params }),
};

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getStudentAttendance: (params) => api.get('/analytics/students', { params }),
  getTrends: (params) => api.get('/analytics/trends', { params }),
  getStudentDetails: (id) => api.get(`/analytics/students/${id}`),
  getMyProfile: () => api.get('/analytics/me'),
  getPrediction: (params) => api.get('/analytics/predict', { params }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsAPI = {
  getAttendanceReport: (params) => api.get('/reports/attendance', { params }),
  getAtRiskReport: (params) => api.get('/reports/at-risk', { params }),
  downloadCSV: (params) => api.get('/reports/attendance', { params: { ...params, format: 'csv' }, responseType: 'blob' }),
};

// ─── Users (admin) ────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getOne: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
