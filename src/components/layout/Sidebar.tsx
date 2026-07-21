import { NavLink } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  Factory,
  BarChart3,
  Bell,
  Users,
  Home,
  ShoppingCart,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const adminNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/requests', label: 'Solicitações', icon: ClipboardList },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/industries', label: 'Indústrias', icon: Factory },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/users', label: 'Usuários', icon: Users },
];

const userNav: NavItem[] = [
  { to: '/home', label: 'Início', icon: Home },
  { to: '/solicitar', label: 'Solicitar', icon: ShoppingCart },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const { unreadCount } = useUnreadNotifications();
  const navItems = isAdmin ? adminNav : userNav;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-200',
          collapsed ? 'w-20' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Boxes className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-foreground">EBD Petrolina</p>
                <p className="truncate text-xs text-muted-foreground">Gestão de Estoque</p>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground md:flex"
          >
            <ChevronLeft
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
            />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const showBadge = item.to === '/notifications' && unreadCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {showBadge && !collapsed && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-foreground px-1.5 text-xs font-bold text-primary">
                    {unreadCount}
                  </span>
                )}
                {showBadge && collapsed && (
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && (
            <div className="mb-2 flex items-center gap-3 rounded-lg px-2 py-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {profile?.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">
                  {profile?.name ?? 'Usuário'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
              collapsed && 'justify-center'
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
