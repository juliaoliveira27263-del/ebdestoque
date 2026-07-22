import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Package, ClipboardList, User, LogOut, Menu, X, Bell, Moon, Sun, ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

const roleLabels: Record<string, string> = {
  supervisor: 'Supervisor', vendedor: 'Vendedor', promotor: 'Promotor',
};

export default function UserLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!profile) return;
    fetchUnread();
    const channel = supabase.channel('user-notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const fetchUnread = async () => {
    if (!profile) return;
    const { count } = await supabase.from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('read', false)
      .or(`user_id.eq.${profile.id},user_id.is.null`);
    setUnreadCount(count ?? 0);
  };

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const firstName = profile?.name?.split(' ')[0] ?? '';
  const isDark = theme === 'dark';
  const sidebarWidth = collapsed ? 'w-16' : 'w-60';

  const navItems = [
    { to: '/solicitacao', label: 'Solicitação', icon: ClipboardList },
    { to: '/meu-perfil', label: 'Meu Perfil', icon: User },
  ];

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarWidth} ${isDark ? 'bg-dark-900 border-dark-700' : 'bg-white border-gray-200'} border-r flex flex-col z-50 transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo area */}
        <div className={`h-16 flex items-center px-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'} ${collapsed ? 'justify-center' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className={`font-semibold text-sm leading-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>EBD Petrolina</p>
                <p className={`text-xs leading-tight truncate ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Sistema de Estoque</p>
              </div>
            )}
          </div>
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white'
                      : isDark
                        ? 'text-dark-300 hover:text-white hover:bg-dark-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  } ${collapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse button (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`hidden lg:flex items-center gap-2 px-3 py-2 text-xs ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} border-t ${isDark ? 'border-dark-700' : 'border-gray-200'} transition-colors`}
        >
          <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Recolher menu</span>}
        </button>

        {/* Sign out */}
        <div className={`border-t ${isDark ? 'border-dark-700' : 'border-gray-200'} p-3`}>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isDark ? 'text-dark-300 hover:text-error-500 hover:bg-dark-800' : 'text-gray-600 hover:text-red-600 hover:bg-gray-100'}`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className={`h-16 flex items-center justify-between px-4 lg:px-6 border-b sticky top-0 z-30 ${isDark ? 'bg-dark-900/80 border-dark-700' : 'bg-white/80 border-gray-200'} backdrop-blur-md`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Olá, {firstName}
              </p>
              <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                {roleLabels[profile?.role ?? ''] ?? ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-dark-300 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
              title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/notificacoes')}
              className={`relative p-2 rounded-lg transition-colors ${isDark ? 'text-dark-300 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-primary-600 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center overflow-hidden shrink-0">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-sm font-bold">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className={`hidden sm:block text-sm font-medium truncate max-w-[120px] ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {profile?.name}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
