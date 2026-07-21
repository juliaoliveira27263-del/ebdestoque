import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/RippleButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {message ?? 'Algo deu errado'}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Tente novamente. Se o problema persistir, contate o suporte.
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      ) : null}
    </div>
  );
}
