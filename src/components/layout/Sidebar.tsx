import { NavLink, useNavigate } from 'react-router-dom';
import {
  Boxes,
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  Building2,
  BarChart3,
  Bell,
  Users,
  ShoppingBag,
  User,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, APP_NAME, APP_SUBTITLE } from '@/lib/constants';

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

const adminNavItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/requests', label: 'Solicitações', icon: ClipboardList },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/industries', label: 'Indústrias', icon: Building2 },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/users', label: 'Usuários', icon: Users },
];

const userNavItems: NavItem[] = [
  { to: '/solicitar', label: 'Solicitar', icon: ShoppingBag },
  { to: '/profile', label: 'Perfil', icon: User },
];

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useUnreadNotifications();

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-card transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
              <Boxes className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate text-sm font-bold text-foreground">{APP_NAME}</p>
                <p className="truncate text-xs text-muted-foreground">{APP_SUBTITLE}</p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
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
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                    {unreadCount}
                  </span>
                )}
                {collapsed && item.to === '/notifications' && unreadCount > 0 && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-2">
          <button
            onClick={onToggleCollapse}
            className="hidden w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:flex"
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <PanelLeftClose className="h-5 w-5 shrink-0" />
            )}
            {!collapsed && <span>Recolher</span>}
          </button>

          <div className={cn('mt-2 flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {profile?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {profile?.name ?? 'Usuário'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile ? ROLE_LABELS[profile.role] : ''}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className={cn(
              'mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
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
