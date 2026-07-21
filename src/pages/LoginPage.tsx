import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Boxes, Eye, EyeOff, Mail, Lock, User as UserIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/RippleButton';

type Mode = 'login' | 'signup' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirm: z.string().min(6, 'Confirme a senha'),
}).refine((data) => data.password === data.confirm, {
  message: 'As senhas não coincidem',
  path: ['confirm'],
});

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'E-mail ou senha incorretos';
  if (message.includes('User already registered')) return 'Este e-mail já está cadastrado';
  if (message.includes('Password should be at least')) return 'A senha deve ter no mínimo 6 caracteres';
  if (message.includes('Unable to send email')) return 'Não foi possível enviar o e-mail';
  if (message.includes('Email not confirmed')) return 'E-mail não confirmado. Verifique sua caixa de entrada.';
  return 'Ocorreu um erro. Tente novamente.';
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const handleLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      toast.success('Login realizado com sucesso!');
      navigate(from || '/dashboard', { replace: true });
    } catch (err) {
      toast.error(translateError((err as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: SignupValues) => {
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
  };

  const handleForgot = async (values: ForgotValues) => {
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
          {mode === 'forgot' && forgotSent ? (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground">Verifique seu e-mail</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Enviamos um link para redefinir sua senha. Verifique sua caixa de entrada.
              </p>
              <Button
                className="mt-6 w-full"
                variant="outline"
                onClick={() => {
                  setMode('login');
                  setForgotSent(false);
                }}
              >
                Voltar para login
              </Button>
            </div>
          ) : mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
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
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setMode('forgot')}
                >
                  Esqueci a senha
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:underline"
                  onClick={() => setMode('signup')}
                >
                  Criar conta
                </button>
              </div>
            </form>
          ) : mode === 'signup' ? (
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">Criar conta</h2>
              </div>
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
                  <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
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
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    {...signupForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-confirm">Confirmar senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-confirm"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    {...signupForm.register('confirm')}
                  />
                </div>
                {signupForm.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar conta'}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground hover:underline"
                onClick={() => setMode('login')}
              >
                Já tem conta? Entrar
              </button>
            </form>
          ) : (
            <form onSubmit={forgotForm.handleSubmit(handleForgot)} className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <h2 className="text-lg font-semibold text-foreground">Recuperar senha</h2>
              </div>
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
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
