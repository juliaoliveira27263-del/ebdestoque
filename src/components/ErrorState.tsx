import { AlertTriangle, RefreshCw } from 'lucide-react';
import { RippleButton } from '@/components/RippleButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">Algo deu errado</h3>
        <p className="text-sm text-muted-foreground">
          {message ?? 'Não foi possível carregar os dados. Tente novamente.'}
        </p>
      </div>
      {onRetry && (
        <RippleButton variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </RippleButton>
      )}
    </div>
  );
}
