import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { Loader2 } from 'lucide-react';

const HomePage = lazy(() => import('@/pages/HomePage'));
const NewRequestPage = lazy(() => import('@/pages/NewRequestPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const RequestsPage = lazy(() => import('@/pages/RequestsPage'));
const MovementsPage = lazy(() => import('@/pages/MovementsPage'));
const IndustriesPage = lazy(() => import('@/pages/IndustriesPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function RootRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/dashboard' : '/home'} replace />;
}

function AppRoutes() {
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
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
