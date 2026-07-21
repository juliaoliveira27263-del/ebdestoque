import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/RippleButton';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">Algo deu errado</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {message || 'Ocorreu um erro ao carregar os dados. Tente novamente.'}
      </p>
      {onRetry && (
        <Button variant="destructive" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
