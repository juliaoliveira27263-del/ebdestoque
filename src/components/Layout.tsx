import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, ClipboardList, ArrowLeftRight, Factory,
  BarChart3, Bell, Users, Settings, User, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produtos', label: 'Produtos', icon: Package },
  { to: '/solicitacoes', label: 'Solicitações', icon: ClipboardList },
  { to: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/industrias', label: 'Indústrias', icon: Factory, adminOnly: true },
  { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/notificacoes', label: 'Notificações', icon: Bell },
  { to: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
  { to: '/configuracoes', label: 'Configurações', icon: Settings, adminOnly: true },
];

const roleLabels: Record<string, string> = {
  admin: 'Administrador', supervisor: 'Supervisor', vendedor: 'Vendedor', promotor: 'Promotor',
};

export default function Layout() {
  const { profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnread())
      .subscribe();
    fetchUnread();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
      .or(`user_id.eq.${profile?.id},user_id.is.null`);
    setUnreadCount(count ?? 0);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-dark-900 border-r border-dark-700 flex flex-col z-50 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-dark-700">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Controle</p>
              <p className="text-dark-400 text-xs leading-tight">de Estoque</p>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-dark-300 hover:text-white hover:bg-dark-800'
                  }`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.to === '/notificacoes' && unreadCount > 0 && (
                  <span className="bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-dark-700 p-3">
          <NavLink
            to="/perfil"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors mb-1"
          >
            <User className="w-5 h-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{profile?.name}</p>
              <p className="text-xs text-dark-400">{roleLabels[profile?.role ?? ''] ?? ''}</p>
            </div>
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-dark-300 hover:text-error-500 hover:bg-dark-800 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 flex items-center justify-between px-4 bg-dark-900 border-b border-dark-700 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="text-dark-300 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary-600 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">Controle de Estoque</span>
          </div>
          {unreadCount > 0 && (
            <NavLink to="/notificacoes" className="relative">
              <Bell className="w-5 h-5 text-dark-300" />
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] px-1 rounded-full min-w-[16px] text-center">
                {unreadCount}
              </span>
            </NavLink>
          )}
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
