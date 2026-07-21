import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Boxes, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Mode = 'login' | 'signup' | 'forgot';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirm: z.string().min(6, 'Confirme a senha'),
}).refine((d) => d.password === d.confirm, { message: 'As senhas não conferem', path: ['confirm'] });

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;
type ForgotValues = z.infer<typeof forgotSchema>;

function translateError(message: string): string {
  const map: Record<string, string> = {
    'Invalid login credentials': 'E-mail ou senha inválidos',
    'Email not confirmed': 'E-mail não confirmado',
    'User already registered': 'E-mail já cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter no mínimo 6 caracteres',
  };
  return map[message] ?? message;
}

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });
  const forgotForm = useForm<ForgotValues>({ resolver: zodResolver(forgotSchema) });

  const onLogin = async (values: LoginValues) => {
    setLoading(true);
    try {
      await signIn(values.email, values.password);
      navigate('/dashboard');
    } catch (e) {
      toast.error(translateError((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (values: SignupValues) => {
    setLoading(true);
    try {
      await signUp(values.name, values.email, values.password);
      toast.success('Conta criada com sucesso! Verifique seu e-mail.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(translateError((e as Error).message));
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (values: ForgotValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('E-mail de recuperação enviado!');
      setMode('login');
    } catch (e) {
      toast.error(translateError((e as Error).message));
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
          <p className="text-sm text-muted-foreground">Gestão de Estoque</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Entrar</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...loginForm.register('email')} />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} {...loginForm.register('password')} />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <RippleButton type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </RippleButton>
              <button type="button" onClick={() => setMode('forgot')} className="text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
              <button type="button" onClick={() => setMode('signup')} className="text-sm text-muted-foreground hover:underline">
                Não tem conta? Cadastre-se
              </button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(onSignup)} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Criar conta</h2>
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" {...signupForm.register('name')} />
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" type="email" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type={showPassword ? 'text' : 'password'} {...signupForm.register('password')} />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type={showPassword ? 'text' : 'password'} {...signupForm.register('confirm')} />
                {signupForm.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <RippleButton type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar
              </RippleButton>
              <button type="button" onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:underline">
                Já tem conta? Entrar
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={forgotForm.handleSubmit(onForgot)} className="flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-foreground">Recuperar senha</h2>
              <p className="text-sm text-muted-foreground">Enviaremos um link de recuperação para seu e-mail.</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <Input id="forgot-email" type="email" {...forgotForm.register('email')} />
                {forgotForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{forgotForm.formState.errors.email.message}</p>
                )}
              </div>
              <RippleButton type="submit" disabled={loading} className="w-full">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Enviar link
              </RippleButton>
              <button type="button" onClick={() => setMode('login')} className="text-sm text-muted-foreground hover:underline">
                Voltar para login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
