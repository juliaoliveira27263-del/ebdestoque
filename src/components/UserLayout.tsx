import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { ShoppingBag, User, LogOut, Menu, X, Sun, Moon, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { roleLabels, UserRole } from '../lib/types';

const navItems = [
  { path: '/solicitacao', label: 'Solicitação', icon: ShoppingBag },
  { path: '/meu-perfil', label: 'Meu Perfil', icon: User },
];

export default function UserLayout() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchUnread = async () => {
      if (!profile) return;
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('read', false).eq('user_id', profile.id);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase.channel('user-notifications').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchUnread()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const isActive = (path: string) => location.pathname.startsWith(path);
  const firstName = profile?.name?.split(' ')[0] ?? '';
  const role = (profile?.role ?? 'vendedor') as UserRole;

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 ${collapsed ? 'w-20' : 'w-64'} ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'} border-r flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} p-5 border-b ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0"><span className="text-white font-bold text-sm">EBD</span></div>
              <div><h1 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>EBD Petrolina</h1><p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Sistema de Estoque</p></div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">EBD</span></div>
          )}
          <button onClick={() => setSidebarOpen(false)} className={`lg:hidden ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-white' : isDark ? 'text-dark-300 hover:bg-dark-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
                <Icon size={18} className="shrink-0" />{!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className={`p-4 border-t ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
          <button onClick={() => setCollapsed(!collapsed)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors mb-2 ${isDark ? 'text-dark-300 hover:bg-dark-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
            {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /><span>Recolher menu</span></>}
          </button>
          <button onClick={handleSignOut} title={collapsed ? 'Sair da conta' : undefined} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? 'text-dark-300 hover:bg-dark-800 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'} ${collapsed ? 'justify-center' : ''}`}>
            <LogOut size={18} className="shrink-0" />{!collapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className={`flex items-center justify-between p-4 border-b ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden ${isDark ? 'text-dark-300' : 'text-gray-600'}`}><Menu size={24} /></button>
            <div><h2 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Olá, {firstName}!</h2><p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{roleLabels[role]}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-800 text-dark-300' : 'hover:bg-gray-100 text-gray-600'}`}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
            <Link to="/notificacoes" className={`relative p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-800 text-dark-300' : 'hover:bg-gray-100 text-gray-600'}`}>
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-xs px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{unreadCount}</span>}
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-white text-sm font-semibold">{firstName.charAt(0).toUpperCase()}</span>}
              </div>
              <span className={`hidden sm:block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{firstName}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto"><Outlet /></main>
      </div>
    </div>
  );
}
