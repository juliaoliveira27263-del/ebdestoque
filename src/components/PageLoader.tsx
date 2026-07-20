import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
          <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}
