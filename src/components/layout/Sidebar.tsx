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
  Home,
  ShoppingCart,
  User,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/RippleButton';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const adminNav: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Produtos', icon: Package },
  { to: '/requests', label: 'Solicitações', icon: ClipboardList },
  { to: '/movements', label: 'Movimentações', icon: ArrowLeftRight },
  { to: '/industries', label: 'Indústrias', icon: Building2 },
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
  const navigate = useNavigate();

  const navItems = isAdmin ? adminNav : userNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Boxes className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-foreground">EBD Petrolina</span>
              <span className="truncate text-xs text-muted-foreground">Gestão de Estoque</span>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
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
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          {!collapsed && profile && (
            <div className="mb-2 flex items-center gap-3 rounded-lg bg-muted px-3 py-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-foreground">
                  {profile.name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </span>
              </div>
            </div>
          )}
          <div className={cn('flex gap-2', collapsed ? 'flex-col' : 'flex-row')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="hidden lg:flex"
              title={collapsed ? 'Expandir' : 'Recolher'}
            >
              <ChevronLeft className={cn('h-5 w-5 transition-transform', collapsed && 'rotate-180')} />
            </Button>
            <Button
              variant="ghost"
              size={collapsed ? 'icon' : 'default'}
              onClick={handleSignOut}
              className={cn('text-destructive hover:bg-destructive/10 hover:text-destructive', !collapsed && 'flex-1')}
              title="Sair"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && <span>Sair</span>}
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
