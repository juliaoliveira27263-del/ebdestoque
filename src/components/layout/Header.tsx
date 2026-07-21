import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { RippleButton } from '@/components/RippleButton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { profile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useUnreadNotifications();
  const navigate = useNavigate();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-sm">
      <RippleButton variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </RippleButton>

      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="text-base font-bold text-foreground">{profile?.name ?? 'Usuário'}</h1>
      </div>

      <RippleButton variant="ghost" size="icon" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </RippleButton>

      <div className="relative">
        <RippleButton variant="ghost" size="icon" onClick={() => navigate('/notifications')}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </RippleButton>
      </div>

      <button onClick={() => navigate('/profile')} className="rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      </button>
    </header>
  );
}
