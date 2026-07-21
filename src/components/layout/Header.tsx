import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/RippleButton';

interface HeaderProps {
  onMenuClick: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();

  const getInitials = (name: string): string => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 flex-col">
        <span className="text-sm text-muted-foreground">{getGreeting()},</span>
        <span className="text-base font-semibold text-foreground">
          {profile?.name?.split(' ')[0] || 'Usuário'}
        </span>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme} title="Alternar tema">
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => navigate('/notifications')}
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <button
        onClick={() => navigate('/profile')}
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      >
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {getInitials(profile?.name || '')}
          </AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
}
