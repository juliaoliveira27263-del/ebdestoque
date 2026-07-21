import { AlertCircle, RefreshCw } from 'lucide-react';
import { RippleButton } from '@/components/RippleButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Algo deu errado</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message ?? 'Ocorreu um erro inesperado. Tente novamente.'}
      </p>
      {onRetry && (
        <RippleButton variant="destructive" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </RippleButton>
      )}
    </div>
  );
}
