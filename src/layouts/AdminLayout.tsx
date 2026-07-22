import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { LayoutDashboard, Package, Factory, ArrowLeftRight, ClipboardList, Users as UsersIcon, BarChart3, LogOut } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/industries', label: 'Indústrias', icon: Factory },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/requests', label: 'Solicitações', icon: ClipboardList },
  { to: '/users', label: 'Usuários', icon: UsersIcon },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold">EBD Petrolina</h1>
          <p className="text-xs text-slate-400">Controle de Estoque</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="text-sm text-slate-300 mb-2">{profile?.name}</div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
