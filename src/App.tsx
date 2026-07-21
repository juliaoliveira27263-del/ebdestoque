import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const NewRequestPage = lazy(() => import('@/pages/NewRequestPage').then((m) => ({ default: m.NewRequestPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const RequestsPage = lazy(() => import('@/pages/RequestsPage').then((m) => ({ default: m.RequestsPage })));
const MovementsPage = lazy(() => import('@/pages/MovementsPage').then((m) => ({ default: m.MovementsPage })));
const IndustriesPage = lazy(() => import('@/pages/IndustriesPage').then((m) => ({ default: m.IndustriesPage })));
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));

function RootRedirect() {
  const { isAdmin } = useAuth();
  return <Navigate to={isAdmin ? '/dashboard' : '/home'} replace />;
}

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
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
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
