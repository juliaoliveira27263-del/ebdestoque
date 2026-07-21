import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RippleButton } from '@/components/RippleButton';

type Mode = 'login' | 'signup' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;
type ForgotFormData = z.infer<typeof forgotSchema>;

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (m.includes('email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Tente novamente em alguns minutos.';
  if (m.includes('network') || m.includes('fetch')) return 'Erro de conexão. Verifique sua internet.';
  if (m.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  return 'Ocorreu um erro. Tente novamente.';
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = React.useState<Mode>('login');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotFormData>({ resolver: zodResolver(forgotSchema) });

  const handleLogin = async (data: LoginFormData) => {
    setError(null);
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      navigate(from ?? '/home', { replace: true });
    } catch (e) {
      setError(translateError((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (data: SignupFormData) => {
    setError(null);
    setLoading(true);
    try {
      await signUp(data.name, data.email, data.password);
      setInfo('Conta criada! Verifique seu e-mail para confirmar.');
      setMode('login');
    } catch (e) {
      setError(translateError((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (data: ForgotFormData) => {
    setError(null);
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) throw resetError;
      setInfo('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (e) {
      setError(translateError((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Boxes className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EBD Petrolina</h1>
          <p className="text-sm text-muted-foreground">Gestão de Estoque</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Entrar</h2>
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              {info && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{info}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" {...loginForm.register('email')} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
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
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <RippleButton type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Entrar
              </RippleButton>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setMode('forgot'); setError(null); setInfo(null); }} className="text-primary hover:underline">
                  Esqueceu a senha?
                </button>
                <button type="button" onClick={() => { setMode('signup'); setError(null); setInfo(null); }} className="text-primary hover:underline">
                  Criar conta
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setMode('login'); setError(null); }} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-xl font-semibold text-foreground">Criar conta</h2>
              </div>
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" placeholder="Seu nome" {...signupForm.register('name')} />
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" type="email" placeholder="seu@email.com" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type="password" placeholder="••••••••" {...signupForm.register('password')} />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" placeholder="••••••••" {...signupForm.register('confirm')} />
                {signupForm.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <RippleButton type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Criar conta
              </RippleButton>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { setMode('login'); setError(null); setInfo(null); }} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-xl font-semibold text-foreground">Recuperar senha</h2>
              </div>
              {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
              {info && <p className="rounded-lg bg-success/10 px-3 py-2 text-sm text-success">{info}</p>}
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input id="forgot-email" type="email" placeholder="seu@email.com" {...forgotForm.register('email')} />
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <RippleButton type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enviar e-mail
              </RippleButton>
            </form>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
