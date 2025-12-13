import axios from 'axios';

// Support both local development and production deployment
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
};

export const twoFactorAPI = {
  initiateLogin: (credentials) => api.post('/2fa/login', credentials),
  verifyCode: (data) => api.post('/2fa/verify', data),
  resendCode: (data) => api.post('/2fa/resend', data),
};

export const annualPlanAPI = {
  create: (data) => api.post('/annual-plans', data),
  getAll: () => api.get('/annual-plans'),
  getById: (id) => api.get(`/annual-plans/${id}`),
};

export const reportAPI = {
  submit: (data) => api.post('/reports/submit', data),
  getMyReports: () => api.get('/reports/my-reports'),
  getAllReports: (planId) => api.get(`/reports/plan/${planId}`),
  getBranchComparison: (planId) => api.get(`/reports/comparison/${planId}`),
  getAllCurrentMonthReports: () => api.get('/reports/current-month/all'),
};

export const actionAPI = {
  create: (data) => api.post('/actions', data),
  getByPlan: (planId) => api.get(`/actions/plan/${planId}`),
  getMyReports: () => api.get('/actions/my-reports'),
  submit: (data) => api.post('/actions/submit', data),
  getAllReports: (planId) => api.get(`/actions/reports/plan/${planId}`),
  getSummary: (planId) => api.get(`/actions/summary/${planId}`),
  quickUpdate: (reportId, actualActivity) => api.put('/actions/quick-update', { reportId, actualActivity }),
};

export const monthlyPlanAPI = {
  getCurrent: () => api.get('/monthly-plans/current'),
  updateTarget: (targetAmount) => api.put('/monthly-plans/current/target', { targetAmount }),
  getHistory: () => api.get('/monthly-plans/history'),
  getStats: (planId) => api.get(`/monthly-plans/${planId}/stats`),
  checkRenewal: () => api.post('/monthly-plans/check-renewal'),
};

export const attachmentsAPI = {
  addActionAttachment: (actionId, { title, url, mimeType }) =>
    api.post(`/attachments/action/${actionId}`, { title, url, mimeType }),
  addActionReportAttachment: (reportId, { title, url, mimeType }) =>
    api.post(`/attachments/action-report/${reportId}`, { title, url, mimeType }),
  addMonthlyReportAttachment: (reportId, { title, url, mimeType }) =>
    api.post(`/attachments/monthly-report/${reportId}`, { title, url, mimeType }),
  list: (entityType, entityId) => api.get(`/attachments/${entityType}/${entityId}`)
};

export const adminAPI = {
  // User Management
  getAllUsers: () => api.get('/admin/users'),
  createUser: (userData) => api.post('/admin/users', userData),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  resetUserPassword: (userId, newPassword) => api.post(`/admin/users/${userId}/reset-password`, { newPassword }),
  updateUserEmail: (userId, email) => api.put(`/admin/users/${userId}/email`, { email }),
  updateUserPhone: (userId, phoneNumber) => api.put(`/admin/users/${userId}/phone`, { phoneNumber }),
  updateUserContact: (userId, contactData) => api.put(`/admin/users/${userId}/contact`, contactData),
  
  // System Statistics
  getSystemStats: () => api.get('/admin/system-stats'),
  getBranchStats: () => api.get('/admin/stats'),
  
  // Legacy Branch Management (for compatibility)
  getAllBranches: () => api.get('/admin/branches'),
  createBranch: (branchData) => api.post('/admin/branches', branchData),
  updateBranch: (branchId, branchData) => api.put(`/admin/branches/${branchId}`, branchData),
  deleteBranch: (branchId) => api.delete(`/admin/branches/${branchId}`),
  resetBranchPassword: (branchId, newPassword) => api.post(`/admin/branches/${branchId}/reset-password`, { newPassword }),
};

export default api;
