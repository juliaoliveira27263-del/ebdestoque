import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Boxes, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirm: z.string().min(6, 'Confirme a senha'),
}).refine((d) => d.password === d.confirm, { message: 'As senhas não conferem', path: ['confirm'] });

type Values = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: Values) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Solicite um novo link de recuperação.');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Senha atualizada com sucesso!');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Boxes className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EBD Petrolina</h1>
          <p className="text-sm text-muted-foreground">Redefinir senha</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <h2 className="text-lg font-semibold text-foreground">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground">Sua senha foi atualizada com sucesso. Você já pode fazer login.</p>
              <RippleButton className="w-full" onClick={() => (window.location.href = '/login')}>
                Ir para login
              </RippleButton>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Nova senha</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" {...form.register('confirm')} />
                {form.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{form.formState.errors.confirm.message}</p>
                )}
              </div>
              <RippleButton type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Redefinir senha
              </RippleButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
