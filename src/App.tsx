import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Industries from './pages/Industries';
import Movements from './pages/Movements';
import Requests from './pages/Requests';
import Users from './pages/Users';
import Reports from './pages/Reports';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading, session } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loading, session, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <Routes>
        {isAdmin ? (
          <>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/movements" element={<Movements />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/users" element={<Users />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route element={<UserLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/requests" element={<Requests />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </ProtectedRoute>
  );
}
