import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Boxes, Loader2, LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { APP_NAME, APP_SUBTITLE } from '@/lib/constants';
import { toast } from 'sonner';

const signInSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const signUpSchema = signInSchema.extend({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

const forgotSchema = z.object({
  email: z.string().email('E-mail inválido'),
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;
type ForgotForm = z.infer<typeof forgotSchema>;

export function LoginPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);

  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: errorsLogin },
  } = useForm<SignInForm>({ resolver: zodResolver(signInSchema) });

  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: errorsSignup },
  } = useForm<SignUpForm>({ resolver: zodResolver(signUpSchema) });

  const {
    register: registerForgot,
    handleSubmit: handleSubmitForgot,
    formState: { errors: errorsForgot },
  } = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema) });

  const onSignIn = async (data: SignInForm) => {
    setLoading(true);
    const { error } = await signIn(data.email, data.password);
    setLoading(false);
    if (error) {
      toast.error('Erro ao entrar', { description: error });
      return;
    }
    toast.success('Bem-vindo!');
    navigate('/');
  };

  const onSignUp = async (data: SignUpForm) => {
    setLoading(true);
    const { error } = await signUp(data.email, data.password, data.name);
    setLoading(false);
    if (error) {
      toast.error('Erro ao criar conta', { description: error });
      return;
    }
    toast.success('Conta criada!', { description: 'Você já pode fazer login.' });
    setMode('login');
  };

  const onForgot = async (data: ForgotForm) => {
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Erro ao enviar e-mail', { description: error.message });
      return;
    }
    toast.success('E-mail enviado!', {
      description: 'Verifique sua caixa de entrada para redefinir sua senha.',
    });
    setMode('login');
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
          {mode === 'forgot' ? (
            <div className="space-y-5">
              <div>
                <button
                  onClick={() => setMode('login')}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao login
                </button>
                <h3 className="text-lg font-bold text-foreground">Recuperar senha</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>
              <form onSubmit={handleSubmitForgot(onForgot)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">E-mail</Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="seu@email.com"
                    {...registerForgot('email')}
                  />
                  {errorsForgot.email && (
                    <p className="text-xs text-destructive">{errorsForgot.email.message}</p>
                  )}
                </div>
                <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
                  Enviar link de recuperação
                </RippleButton>
              </form>
            </div>
          ) : (
            <>
              <div className="mb-6 flex rounded-lg bg-muted p-1">
                <button
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                    mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMode('login')}
                >
                  Entrar
                </button>
                <button
                  className={`flex-1 rounded-md py-2 text-sm font-semibold transition-all ${
                    mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                  onClick={() => setMode('signup')}
                >
                  Cadastrar
                </button>
              </div>

              {mode === 'login' ? (
                <form onSubmit={handleSubmitLogin(onSignIn)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...registerLogin('email')}
                    />
                    {errorsLogin.email && (
                      <p className="text-xs text-destructive">{errorsLogin.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setMode('forgot')}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      {...registerLogin('password')}
                    />
                    {errorsLogin.password && (
                      <p className="text-xs text-destructive">{errorsLogin.password.message}</p>
                    )}
                  </div>
                  <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
                    Entrar
                  </RippleButton>
                </form>
              ) : (
                <form onSubmit={handleSubmitSignup(onSignUp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      {...registerSignup('name')}
                    />
                    {errorsSignup.name && (
                      <p className="text-xs text-destructive">{errorsSignup.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      {...registerSignup('email')}
                    />
                    {errorsSignup.email && (
                      <p className="text-xs text-destructive">{errorsSignup.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      {...registerSignup('password')}
                    />
                    {errorsSignup.password && (
                      <p className="text-xs text-destructive">{errorsSignup.password.message}</p>
                    )}
                  </div>
                  <RippleButton type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
                    Criar conta
                  </RippleButton>
                  <p className="text-center text-xs text-muted-foreground">
                    O primeiro usuário cadastrado torna-se administrador automaticamente.
                  </p>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
