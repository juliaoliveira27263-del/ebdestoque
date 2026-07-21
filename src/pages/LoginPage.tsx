import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Loader2, LogIn, Mail, Lock, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';

const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

const signUpSchema = z
  .object({
    name: z.string().min(2, 'Nome obrigatório'),
    email: z.string().email('E-mail inválido'),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    confirm: z.string().min(6, 'Confirme a senha'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'As senhas não coincidem',
    path: ['confirm'],
  });

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from = (location.state as { from?: string })?.from || '/home';

  const loginForm = useForm<SignInForm>({ resolver: zodResolver(signInSchema) });
  const signupForm = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) });

  const handleLogin = async (data: SignInForm) => {
    setLoading(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Login realizado com sucesso!');
      navigate(from, { replace: true });
    } catch (err) {
      const error = err as { message?: string };
      const msg = error.message ?? '';
      if (msg.includes('Invalid login credentials')) {
        toast.error('E-mail ou senha incorretos.', { description: 'Verifique suas credenciais e tente novamente.' });
      } else if (msg.includes('Email not confirmed')) {
        toast.error('E-mail não confirmado.', { description: 'Confirme seu e-mail antes de fazer login.' });
      } else if (msg.includes('rate limit') || msg.includes('Rate limit')) {
        toast.error('Muitas tentativas.', { description: 'Aguarde alguns segundos e tente novamente.' });
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed to fetch')) {
        toast.error('Erro de conexão.', { description: 'Verifique sua internet e tente novamente.' });
      } else {
        toast.error('Erro ao fazer login.', { description: msg || 'Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    setLoading(true);
    try {
      await signUp(data.name, data.email, data.password);
      toast.success('Conta criada com sucesso!', { description: 'Você já pode fazer login.' });
      setMode('login');
      loginForm.setValue('email', data.email);
    } catch (err) {
      const error = err as { message?: string };
      const msg = error.message ?? '';
      if (msg.includes('already been registered') || msg.includes('User already registered')) {
        toast.error('E-mail já cadastrado.', { description: 'Faça login ou recupere sua senha.' });
      } else {
        toast.error('Erro ao criar conta.', { description: msg || 'Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
      toast.success('E-mail de recuperação enviado!', { description: 'Verifique sua caixa de entrada.' });
    } catch (err) {
      const error = err as { message?: string };
      const msg = error.message ?? '';
      if (msg.includes('rate limit') || msg.includes('Rate limit')) {
        toast.error('Muitas solicitações.', { description: 'Aguarde alguns minutos antes de tentar novamente.' });
      } else {
        toast.error('Erro ao enviar e-mail.', { description: msg || 'Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
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
          {mode === 'login' && (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Entrar</h3>
                <p className="text-sm text-muted-foreground mt-1">Acesse sua conta para continuar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10"
                    autoComplete="email"
                    {...loginForm.register('email')}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    className="pl-10 pr-10"
                    autoComplete="current-password"
                    {...loginForm.register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                Entrar
              </RippleButton>
              <div className="flex flex-col gap-2 text-center text-sm">
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotEmail(''); setForgotSent(false); }}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueceu sua senha?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Não tem conta? <span className="font-semibold text-primary">Criar conta</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Criar conta</h3>
                <p className="text-sm text-muted-foreground mt-1">Preencha seus dados para se cadastrar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Seu nome" {...signupForm.register('name')} />
                {signupForm.formState.errors.name && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">E-mail</Label>
                <Input id="signup-email" type="email" placeholder="seu@email.com" {...signupForm.register('email')} />
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type="password" placeholder="Mínimo 6 caracteres" {...signupForm.register('password')} />
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input id="confirm" type="password" placeholder="Repita a senha" {...signupForm.register('confirm')} />
                {signupForm.formState.errors.confirm && (
                  <p className="text-xs text-destructive">{signupForm.formState.errors.confirm.message}</p>
                )}
              </div>
              <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                Criar conta
              </RippleButton>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Já tem conta? <span className="font-semibold text-primary">Entrar</span>
                </button>
              </div>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-foreground">Recuperar senha</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {forgotSent
                    ? 'E-mail enviado! Verifique sua caixa de entrada.'
                    : 'Digite seu e-mail para receber o link de recuperação.'}
                </p>
              </div>
              {forgotSent ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-foreground">
                    Enviamos um link de recuperação para <strong>{forgotEmail}</strong>.
                    O link expira em 1 hora. Clique nele para definir uma nova senha.
                  </div>
                  <RippleButton size="lg" className="w-full" onClick={() => setMode('login')}>
                    Voltar para login
                  </RippleButton>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                    Enviar link de recuperação
                  </RippleButton>
                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Voltar para login
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/reset-password" className="hover:text-primary transition-colors">
            Redefinir senha
          </Link>
          {' • '}
          © {new Date().getFullYear()} {APP_NAME}
        </p>
      </div>
    </div>
  );
}
