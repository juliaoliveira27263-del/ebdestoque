import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Solicite a recuperação novamente.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Boxes className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">EBD Petrolina</h1>
          <p className="text-sm text-muted-foreground">Redefinir senha</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {success ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Sua senha foi atualizada com sucesso. Você já pode entrar com a nova senha.
              </p>
              <Button className="w-full" onClick={() => (window.location.href = '/login')}>
                Ir para login
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Nova senha</h2>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••"
                    className="pl-9"
                    {...form.register('password')}
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  placeholder="••••••"
                  {...form.register('confirm')}
                />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Atualizar senha
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
