import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute';

// Lazy-load pages for code splitting
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const CourseCatalogPage = lazy(() => import('./pages/CourseCatalogPage'));
const LessonViewPage    = lazy(() => import('./pages/LessonViewPage'));
const ExamPage          = lazy(() => import('./pages/ExamPage'));
const ExamResultPage    = lazy(() => import('./pages/ExamResultPage'));
const ProfilePage       = lazy(() => import('./pages/ProfilePage'));

// Full-screen loading fallback
function PageLoader() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: 'var(--tc-bg)',
      }}
    >
      <div className="spinner" style={{ width: '36px', height: '36px', borderWidth: '4px' }} />
      <p style={{ color: 'var(--tc-muted)', fontSize: '0.875rem' }}>Yükleniyor…</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="page-wrapper">
          <Navbar />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <CourseCatalogPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses/:courseId/learn"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <LessonViewPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/exams/:examId"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <ExamPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/exams/:examId/result"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <ExamResultPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
