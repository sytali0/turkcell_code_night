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
  detail:     (courseId) => api.get(`/courses/${courseId}`),
  enroll:     (courseId) => api.post(`/courses/${courseId}/enroll`),
  myEnrollments: () => api.get('/courses/my-enrollments'),
  instructorCourses: () => api.get('/courses/instructor/mine'),
  adminCourses: (params) => api.get('/courses/admin/all', { params }),
  create:     (data) => api.post('/courses/', data),
  update:     (courseId, data) => api.patch(`/courses/${courseId}`, data),
  updateStatus: (courseId, status) => api.patch(`/courses/${courseId}/status`, { status }),
  createModule: (courseId, data) => api.post(`/courses/${courseId}/modules`, data),
  createLesson: (moduleId, data) => api.post(`/modules/${moduleId}/lessons`, data),
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
  moduleExam: (moduleId) => api.get(`/modules/${moduleId}/exam`),
  createForModule: (moduleId, data) => api.post(`/modules/${moduleId}/exam`, data),
  update: (examId, data) => api.patch(`/exams/${examId}`, data),
  delete: (examId) => api.delete(`/exams/${examId}`),
  questions: (examId) => api.get(`/exams/${examId}/questions`),
  createQuestion: (examId, data) => api.post(`/exams/${examId}/questions`, data),
  updateQuestion: (questionId, data) => api.patch(`/questions/${questionId}`, data),
  deleteQuestion: (questionId) => api.delete(`/questions/${questionId}`),
  adminStats: () => api.get('/admin/exams'),
};

export default api;
