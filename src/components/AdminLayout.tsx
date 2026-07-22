import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Package, FileText, ArrowLeftRight, Building2,
  BarChart3, Bell, Users as UsersIcon, Settings, User, LogOut, Menu, X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/produtos', label: 'Produtos', icon: Package },
  { path: '/solicitacoes', label: 'Solicitações', icon: FileText },
  { path: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { path: '/industrias', label: 'Indústrias', icon: Building2 },
  { path: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { path: '/notificacoes', label: 'Notificações', icon: Bell },
  { path: '/usuarios', label: 'Usuários', icon: UsersIcon },
  { path: '/configuracoes', label: 'Configurações', icon: Settings },
  { path: '/perfil', label: 'Perfil', icon: User },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false);
      setUnreadCount(count ?? 0);
    };
    fetchUnread();
    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => fetchUnread())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };
  const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-dark-900 border-r border-dark-800 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="flex items-center justify-between p-5 border-b border-dark-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center"><span className="text-white font-bold text-sm">EBD</span></div>
            <div><h1 className="text-white font-bold text-sm">EBD Petrolina</h1><p className="text-dark-400 text-xs">Controle de Estoque</p></div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-dark-400 hover:text-white"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${active ? 'bg-primary text-white' : 'text-dark-300 hover:bg-dark-800 hover:text-white'}`}>
                <Icon size={18} /><span>{item.label}</span>
                {item.path === '/notificacoes' && unreadCount > 0 && <span className="ml-auto bg-primary text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-dark-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center"><span className="text-white text-sm font-semibold">{profile?.name?.charAt(0).toUpperCase() ?? 'A'}</span></div>
            <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{profile?.name}</p><p className="text-dark-400 text-xs">Administrador</p></div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-300 hover:bg-dark-800 hover:text-white transition-colors"><LogOut size={16} />Sair da conta</button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 bg-dark-900 border-b border-dark-800">
          <button onClick={() => setSidebarOpen(true)} className="text-dark-300 hover:text-white"><Menu size={24} /></button>
          <span className="text-white font-semibold text-sm">EBD Petrolina</span>
          <div className="w-9 h-9 rounded-full bg-dark-700 flex items-center justify-center"><span className="text-white text-sm font-semibold">{profile?.name?.charAt(0).toUpperCase() ?? 'A'}</span></div>
        </header>
        <main className="flex-1 overflow-y-auto bg-dark-950"><Outlet /></main>
      </div>
    </div>
  );
}
