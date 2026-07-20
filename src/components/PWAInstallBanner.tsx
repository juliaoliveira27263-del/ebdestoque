import { useState } from 'react';
import { X, Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const DISMISSED_KEY = 'ebd-pwa-install-dismissed';

export function PWAInstallBanner() {
  const { isInstallable, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true'; } catch { return false; }
  });

  if (!isInstallable || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
  };

  const handleInstall = async () => {
    await install();
    setDismissed(true);
  };

  return (
    <div
      role="banner"
      aria-label="Instalar aplicativo"
      className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe pb-4 animate-fade-in-up"
      style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card shadow-xl px-4 py-3 max-w-lg mx-auto">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold text-sm select-none">
          EBD
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Instale o EBD Inventário</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-tight">Acesse mais rápido, funciona offline</p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Fechar"
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
