import { AlertCircle, RefreshCw } from 'lucide-react';
import { RippleButton } from './RippleButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-card/50 p-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="text-lg font-bold text-foreground">Algo deu errado</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? 'Ocorreu um erro ao carregar os dados. Tente novamente.'}
      </p>
      {onRetry && (
        <RippleButton variant="outline" className="mt-6" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </RippleButton>
      )}
    </div>
  );
}
