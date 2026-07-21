import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  Bell,
  Users,
  ChevronRight,
  X,
  Boxes,
  FileBarChart,
  Factory,
  UserCircle,
  LogOut,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import { APP_NAME, APP_SUBTITLE, ROLE_LABELS } from '@/lib/constants';

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
  { to: '/industries', label: 'Indústrias', icon: Factory },
  { to: '/reports', label: 'Relatórios', icon: FileBarChart },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/users', label: 'Usuários', icon: Users },
];

const promotorNavItems: NavItem[] = [
  { to: '/solicitar', label: 'Solicitação', icon: ClipboardList },
  { to: '/profile', label: 'Meu Perfil', icon: UserCircle },
];

export function Sidebar({ open, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useUnreadNotifications();

  if (!profile) return null;

  const isAdmin = profile.role === 'admin';
  const items = isAdmin ? adminNavItems : promotorNavItems;

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

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
          'fixed inset-y-0 left-0 z-40 flex flex-col bg-card border-r border-border shadow-xl transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
              <Boxes className="h-5 w-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground leading-tight">{APP_NAME}</p>
                <p className="truncate text-xs text-muted-foreground leading-tight">{APP_SUBTITLE}</p>
              </div>
            )}
          </div>
          <button
            className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden shrink-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const hasNotif = item.to === '/notifications' && unreadCount > 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                {!collapsed && hasNotif && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {collapsed && hasNotif && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse toggle — desktop only */}
        <div className="hidden lg:flex border-t border-border px-3 py-2 shrink-0">
          <button
            onClick={onToggleCollapse}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Expandir menu' : undefined}
          >
            <ChevronRight
              className={cn('h-4 w-4 shrink-0 transition-transform duration-300', !collapsed && 'rotate-180')}
            />
            {!collapsed && <span>Recolher menu</span>}
          </button>
        </div>

        {/* User footer */}
        <div className="border-t border-border p-3 shrink-0">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 mb-1',
              collapsed && 'justify-center px-2'
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground leading-tight">{profile.name}</p>
                <p className="truncate text-xs text-muted-foreground leading-tight">{ROLE_LABELS[profile.role]}</p>
              </div>
            )}
          </div>
          <button
            onClick={() => signOut()}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
              collapsed && 'justify-center px-2'
            )}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sair da conta</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
