import * as React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

const HomePage = React.lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const NewRequestPage = React.lazy(() => import('@/pages/NewRequestPage').then((m) => ({ default: m.NewRequestPage })));
const DashboardPage = React.lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductsPage = React.lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const RequestsPage = React.lazy(() => import('@/pages/RequestsPage').then((m) => ({ default: m.RequestsPage })));
const MovementsPage = React.lazy(() => import('@/pages/MovementsPage').then((m) => ({ default: m.MovementsPage })));
const IndustriesPage = React.lazy(() => import('@/pages/IndustriesPage').then((m) => ({ default: m.IndustriesPage })));
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = React.lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const UsersPage = React.lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ProfilePage = React.lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

function RootRedirect() {
  const { profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Navigate to="/login" replace />;
  if (!profile) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Navigate to={isAdmin ? '/dashboard' : '/home'} replace />;
}

function LazyFallback() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<RootRedirect />} />
        <Route path="/home" element={<React.Suspense fallback={<LazyFallback />}><HomePage /></React.Suspense>} />
        <Route path="/solicitar" element={<React.Suspense fallback={<LazyFallback />}><NewRequestPage /></React.Suspense>} />
        <Route path="/dashboard" element={<React.Suspense fallback={<LazyFallback />}><DashboardPage /></React.Suspense>} />
        <Route path="/products" element={<React.Suspense fallback={<LazyFallback />}><ProductsPage /></React.Suspense>} />
        <Route path="/requests" element={<React.Suspense fallback={<LazyFallback />}><RequestsPage /></React.Suspense>} />
        <Route path="/movements" element={<React.Suspense fallback={<LazyFallback />}><MovementsPage /></React.Suspense>} />
        <Route path="/industries" element={<React.Suspense fallback={<LazyFallback />}><IndustriesPage /></React.Suspense>} />
        <Route path="/reports" element={<React.Suspense fallback={<LazyFallback />}><ReportsPage /></React.Suspense>} />
        <Route path="/notifications" element={<React.Suspense fallback={<LazyFallback />}><NotificationsPage /></React.Suspense>} />
        <Route path="/users" element={<React.Suspense fallback={<LazyFallback />}><UsersPage /></React.Suspense>} />
        <Route path="/profile" element={<React.Suspense fallback={<LazyFallback />}><ProfilePage /></React.Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
