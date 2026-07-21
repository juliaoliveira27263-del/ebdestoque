import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {greeting}, {profile?.name?.split(' ')[0] ?? 'Usuário'}!
          </p>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? 'Painel administrativo' : 'Bem-vindo de volta'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button
          onClick={() => navigate('/notifications')}
          className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground'
              )}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          {profile?.name?.charAt(0).toUpperCase() ?? '?'}
        </button>
      </div>
    </header>
  );
}
