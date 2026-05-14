import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import PrivateRoute from './components/layout/PrivateRoute';

// Lazy-load pages for code splitting
const LoginPage         = lazy(() => import('./pages/LoginPage'));
const CourseCatalogPage = lazy(() => import('./pages/CourseCatalogPage'));
const CourseDetailPage  = lazy(() => import('./pages/CourseDetailPage'));
const MyCoursesPage     = lazy(() => import('./pages/MyCoursesPage'));
const CourseManagementPage = lazy(() => import('./pages/CourseManagementPage'));
const CourseFormPage    = lazy(() => import('./pages/CourseFormPage'));
const CourseContentManagePage = lazy(() => import('./pages/CourseContentManagePage'));
const ExamManagePage    = lazy(() => import('./pages/ExamManagePage'));
const ExamQuestionsPage = lazy(() => import('./pages/ExamQuestionsPage'));
const AdminExamsPage    = lazy(() => import('./pages/AdminExamsPage'));
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

function RoleHome() {
  const { user } = useAuth();
  if (user?.role === 'instructor') return <Navigate to="/instructor/courses" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/courses" replace />;
  return <CourseCatalogPage />;
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
                    <RoleHome />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <CourseCatalogPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/my-courses"
                element={
                  <PrivateRoute allowedRoles={['student']}>
                    <MyCoursesPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/courses/:courseId"
                element={
                  <PrivateRoute>
                    <CourseDetailPage />
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
                path="/instructor/courses"
                element={
                  <PrivateRoute allowedRoles={['instructor']}>
                    <CourseManagementPage mode="instructor" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/courses/new"
                element={
                  <PrivateRoute allowedRoles={['instructor']}>
                    <CourseFormPage mode="instructor" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/courses/:courseId/edit"
                element={
                  <PrivateRoute allowedRoles={['instructor']}>
                    <CourseFormPage mode="instructor" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/courses/:courseId/modules"
                element={
                  <PrivateRoute allowedRoles={['instructor']}>
                    <CourseContentManagePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/modules/:moduleId/exam"
                element={
                  <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <ExamManagePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/exams/:examId/edit"
                element={
                  <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <ExamManagePage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/instructor/exams/:examId/questions"
                element={
                  <PrivateRoute allowedRoles={['instructor', 'admin']}>
                    <ExamQuestionsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/courses"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <CourseManagementPage mode="admin" />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/exams"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <AdminExamsPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/courses/:courseId/edit"
                element={
                  <PrivateRoute allowedRoles={['admin']}>
                    <CourseFormPage mode="admin" />
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
