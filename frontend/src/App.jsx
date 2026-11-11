import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/shared/Layout';
import PageSpinner from './components/shared/PageSpinner';

// Lazy-loaded pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Students = lazy(() => import('./pages/Students'));
const AttendancePage = lazy(() => import('./pages/Attendance'));
const Analytics = lazy(() => import('./pages/Analytics'));
const Reports = lazy(() => import('./pages/Reports'));
const StudentDetail = lazy(() => import('./pages/StudentDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const NotFound = lazy(() => import('./pages/NotFound'));
const MyAttendance = lazy(() => import('./pages/MyAttendance'));

// ─── Route guards ─────────────────────────────────────────────────────────────
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <PageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <PageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── App Routes ───────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Protected routes — inside Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/students" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <Students />
            </ProtectedRoute>
          } />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/attendance" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AttendancePage />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/my-attendance" element={<MyAttendance />} />
          <Route path="/reports" element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <Reports />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUsers />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#1e293b' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#1e293b' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
