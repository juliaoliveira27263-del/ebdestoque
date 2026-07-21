import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Boxes, Eye, EyeOff, Loader2, Mail, Lock, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'signup' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Nome obrigatório'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Mínimo 6 caracteres'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('password should be at least')) return 'A senha deve ter no mínimo 6 caracteres.';
  if (m.includes('rate limit')) return 'Muitas tentativas. Tente novamente em instantes.';
  return 'Ocorreu um erro. Tente novamente.';
}

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupForm>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onLogin = loginForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      toast.success('Bem-vindo de volta!');
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      toast.error(translateError((err as Error).message));
    } finally {
      setLoading(false);
    }
  });

  const onSignup = signupForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast.success('Conta criada com sucesso!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(translateError((err as Error).message));
    } finally {
      setLoading(false);
    }
  });

  const onForgot = forgotForm.handleSubmit(async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: window.location.origin + '/reset-password',
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success('E-mail de recuperação enviado!');
    } catch (err) {
      toast.error(translateError((err as Error).message));
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
          <p className="text-sm text-muted-foreground">Gestão de Estoque</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {mode === 'login' && (
            <form onSubmit={onLogin} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Entrar</h2>
              <div className="space-y-2">
                <Label htmlFor="login-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••"
                    className="px-9"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-primary hover:underline"
                >
                  Criar conta
                </button>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-muted-foreground hover:underline"
                >
                  Esqueci a senha
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={onSignup} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Criar conta</h2>
              <div className="space-y-2">
                <Label htmlFor="signup-name">Nome</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    placeholder="Seu nome"
                    className="pl-9"
                    {...signupForm.register('name')}
                  />
                </div>
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-destructive">
                    {signupForm.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-9"
                    {...signupForm.register('email')}
                  />
                </div>
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="••••••"
                  {...signupForm.register('password')}
                />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirmar senha</Label>
                <Input
                  id="signup-confirm"
                  type="password"
                  placeholder="••••••"
                  {...signupForm.register('confirm')}
                />
                {signupForm.formState.errors.confirm && (
                  <p className="text-xs text-destructive">
                    {signupForm.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar conta
              </Button>
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                Já tenho conta
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={onForgot} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Recuperar senha</h2>
              {forgotSent ? (
                <p className="text-sm text-muted-foreground">
                  Verifique seu e-mail para instruções de recuperação.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-9"
                        {...forgotForm.register('email')}
                      />
                    </div>
                    {forgotForm.formState.errors.email && (
                      <p className="text-xs text-destructive">
                        {forgotForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enviar e-mail
                  </Button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setForgotSent(false);
                }}
                className="w-full text-center text-sm text-primary hover:underline"
              >
                Voltar para login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
