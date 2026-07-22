import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { ReactNode } from 'react';
import AdminLayout from './components/AdminLayout';
import UserLayout from './components/UserLayout';
import Login from './pages/Login';
import Cadastro from './pages/Cadastro';
import EsqueciSenha from './pages/EsqueciSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Requests from './pages/Requests';
import Industries from './pages/Industries';
import Movements from './pages/Movements';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Solicitacao from './pages/Solicitacao';
import IndustriaMateriais from './pages/IndustriaMateriais';
import MeuPerfil from './pages/MeuPerfil';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-dark-400">Carregando...</div>;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-dark-400">Carregando...</div>;
  if (!isAdmin) return <Navigate to="/solicitacao" replace />;
  return <>{children}</>;
}

function NonAdminRoute({ children }: { children: ReactNode }) {
  const { isNonAdmin, isAdmin, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-dark-400">Carregando...</div>;
  if (isAdmin) return <Navigate to="/" replace />;
  if (!isNonAdmin) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/" element={<ProtectedRoute><AdminRoute><AdminLayout /></AdminRoute></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="produtos" element={<Products />} />
        <Route path="solicitacoes" element={<Requests />} />
        <Route path="movimentacoes" element={<Movements />} />
        <Route path="industrias" element={<Industries />} />
        <Route path="relatorios" element={<Reports />} />
        <Route path="notificacoes" element={<Notifications />} />
        <Route path="usuarios" element={<Users />} />
        <Route path="configuracoes" element={<Settings />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="/" element={<ProtectedRoute><NonAdminRoute><UserLayout /></NonAdminRoute></ProtectedRoute>}>
        <Route path="solicitacao" element={<Solicitacao />} />
        <Route path="industria/:id" element={<IndustriaMateriais />} />
        <Route path="meu-perfil" element={<MeuPerfil />} />
        <Route path="notificacoes" element={<Notifications />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
