import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <Toast
          key={t.id}
          open={t.open}
          onOpenChange={(open: boolean) => { if (!open) dismiss(t.id); }}
          variant={t.variant}
        >
          <div className="flex-1 space-y-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && <ToastDescription>{t.description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
    </ToastProvider>
  );
}
