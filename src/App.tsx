import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { QueryProvider } from '@/contexts/QueryProvider';
import { Toaster } from 'sonner';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PWAInstallBanner } from '@/components/PWAInstallBanner';
import { PWAUpdateToast } from '@/components/PWAUpdateToast';
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/components/PageLoader';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const NewRequestPage = lazy(() => import('@/pages/NewRequestPage').then((m) => ({ default: m.NewRequestPage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const RequestsPage = lazy(() => import('@/pages/RequestsPage').then((m) => ({ default: m.RequestsPage })));
const MovementsPage = lazy(() => import('@/pages/MovementsPage').then((m) => ({ default: m.MovementsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const IndustriesPage = lazy(() => import('@/pages/IndustriesPage').then((m) => ({ default: m.IndustriesPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));

function RootRedirect() {
  const { profile, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (profile?.role === 'admin') return <Navigate to="/dashboard" replace />;
  return <Navigate to="/solicitar" replace />;
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

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
        <Route path="/home" element={<Suspense fallback={<PageLoader />}><HomePage /></Suspense>} />
        <Route path="/solicitar" element={<Suspense fallback={<PageLoader />}><NewRequestPage /></Suspense>} />
        <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
        <Route path="/products" element={<Suspense fallback={<PageLoader />}><ProductsPage /></Suspense>} />
        <Route path="/requests" element={<Suspense fallback={<PageLoader />}><RequestsPage /></Suspense>} />
        <Route path="/movements" element={<Suspense fallback={<PageLoader />}><MovementsPage /></Suspense>} />
        <Route path="/industries" element={<Suspense fallback={<PageLoader />}><IndustriesPage /></Suspense>} />
        <Route path="/reports" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
        <Route path="/notifications" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
        <Route path="/users" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
        <Route path="/profile" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          <BrowserRouter>
            <AppRoutes />
            <PWAInstallBanner />
          </BrowserRouter>
          <PWAUpdateToast />
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
