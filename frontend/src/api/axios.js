import axios from 'axios';

// ── Axios instance ─────────────────────────────────────────────────────────
// Base URL: Vite proxy /api → http://127.0.0.1:8000 (uvicorn çalışmalı; yoksa ECONNREFUSED)
// Token: localStorage'da 'educell_token' anahtarıyla saklı JWT
// ---------------------------------------------------------------------------

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: Bearer token ekle ─────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('educell_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: 401 → login sayfasına yönlendir ─────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('educell_token');
      localStorage.removeItem('educell_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth endpoints ─────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  login:    (data) => api.post('/auth/login', data),
  me:       () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
};

// ── Course endpoints ───────────────────────────────────────────────────────
export const courseAPI = {
  list:       (params) => api.get('/courses/', { params }),
  enroll:     (courseId) => api.post(`/courses/${courseId}/enroll`),
  curriculum: (courseId) => api.get(`/courses/${courseId}/curriculum`),
  rate:       (courseId, data) => api.post(`/courses/${courseId}/rate`, data),
};

// ── Lesson endpoints ───────────────────────────────────────────────────────
export const lessonAPI = {
  complete: (lessonId) => api.patch(`/lessons/${lessonId}/complete`),
  comment:  (lessonId, data) => api.post(`/lessons/${lessonId}/comments`, data),
};

// ── Exam endpoints ─────────────────────────────────────────────────────────
export const examAPI = {
  start:  (examId) => api.post(`/exams/${examId}/start`),
  submit: (examId, data) => api.post(`/exams/${examId}/submit`, data),
  result: (examId) => api.get(`/exams/${examId}/result`),
};

export default api;
