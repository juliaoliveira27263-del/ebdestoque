import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Requests from './pages/Requests';
import Movements from './pages/Movements';
import Industries from './pages/Industries';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Solicitacao from './pages/Solicitacao';
import IndustriaMateriais from './pages/IndustriaMateriais';
import MeuPerfil from './pages/MeuPerfil';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';

function LoadingScreen() {
  return (<div className="min-h-screen flex items-center justify-center bg-dark-950"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAdmin) return <Navigate to="/solicitacao" replace />;
  return <>{children}</>;
}

function NonAdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isNonAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAdmin) return <Navigate to="/" replace />;
  if (!isNonAdmin) return <Navigate to="/solicitacao" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Admin routes - unchanged */}
      <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminRoute><Dashboard /></AdminRoute>} />
        <Route path="produtos" element={<AdminRoute><Products /></AdminRoute>} />
        <Route path="solicitacoes" element={<AdminRoute><Requests /></AdminRoute>} />
        <Route path="movimentacoes" element={<AdminRoute><Movements /></AdminRoute>} />
        <Route path="industrias" element={<AdminRoute><Industries /></AdminRoute>} />
        <Route path="relatorios" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="notificacoes" element={<AdminRoute><Notifications /></AdminRoute>} />
        <Route path="usuarios" element={<AdminRoute><Users /></AdminRoute>} />
        <Route path="configuracoes" element={<AdminRoute><Settings /></AdminRoute>} />
        <Route path="perfil" element={<AdminRoute><Profile /></AdminRoute>} />
      </Route>

      {/* Non-admin routes - new modern layout */}
      <Route element={<ProtectedRoute><UserLayout /></ProtectedRoute>}>
        <Route path="/solicitacao" element={<NonAdminRoute><Solicitacao /></NonAdminRoute>} />
        <Route path="/industria/:id" element={<NonAdminRoute><IndustriaMateriais /></NonAdminRoute>} />
        <Route path="/meu-perfil" element={<NonAdminRoute><MeuPerfil /></NonAdminRoute>} />
        <Route path="/notificacoes" element={<NonAdminRoute><Notifications /></NonAdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
