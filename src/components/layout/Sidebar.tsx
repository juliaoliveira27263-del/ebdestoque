import { NavLink } from 'react-router-dom';
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
  ShoppingCart,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { ROLE_LABELS } from '@/lib/constants';
import { RippleButton } from '@/components/RippleButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const adminNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/requests', label: 'Solicitações', icon: ClipboardList },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/industries', label: 'Indústrias', icon: Building2 },
  { to: '/reports', label: 'Relatórios', icon: BarChart3 },
  { to: '/notifications', label: 'Notificações', icon: Bell },
  { to: '/users', label: 'Usuários', icon: Users },
];

const userNav = [
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
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border bg-card transition-all duration-200',
          collapsed ? 'w-20' : 'w-64',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Boxes className="h-8 w-8 shrink-0 text-primary" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground">EBD Petrolina</span>
              <span className="text-xs text-muted-foreground">Gestão de Estoque</span>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
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
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.to === '/notifications' && unreadCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-border p-2">
          <div className={cn('flex items-center gap-3 rounded-lg p-2', collapsed && 'justify-center')}>
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {profile?.name?.charAt(0).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold text-foreground">{profile?.name}</span>
                <span className="text-xs text-muted-foreground">{profile ? ROLE_LABELS[profile.role] : ''}</span>
              </div>
            )}
          </div>
          <RippleButton
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            className={cn('mt-1 w-full', collapsed && 'mx-auto')}
            onClick={() => signOut()}
            title={collapsed ? 'Sair' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </RippleButton>
        </div>

        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-border bg-card shadow-sm lg:flex"
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
      </aside>
    </>
  );
}
