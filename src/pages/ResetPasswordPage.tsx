import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { toast } from 'sonner';

const schema = z
  .object({
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

type Form = z.infer<typeof schema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    supabase.auth.getSession().then(() => setReady(true));
  }, []);

  const onSubmit = async (data: Form) => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: data.password });
    setLoading(false);
    if (error) {
      toast.error('Erro ao redefinir senha', { description: error.message });
      return;
    }
    setDone(true);
    toast.success('Senha redefinida com sucesso!');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted to-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30">
            <Boxes className="h-9 w-9 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{APP_NAME}</h1>
            <p className="text-sm text-muted-foreground">{APP_SUBTITLE}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
          {!ready ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : done ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Senha redefinida!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.
                </p>
              </div>
              <RippleButton size="lg" className="w-full" onClick={() => navigate('/login')}>
                Ir para o login
              </RippleButton>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Redefinir senha</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Digite sua nova senha abaixo.
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirmar senha</Label>
                  <Input
                    id="confirm"
                    type="password"
                    placeholder="Repita a nova senha"
                    {...register('confirm')}
                  />
                  {errors.confirm && (
                    <p className="text-xs text-destructive">{errors.confirm.message}</p>
                  )}
                </div>
                <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                  Redefinir senha
                </RippleButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
