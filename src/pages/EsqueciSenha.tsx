import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function EsqueciSenha() {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error } = await resetPassword(email);
    if (error) {
      setError(error);
      setSubmitting(false);
    } else {
      setSuccess(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-600/30">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Esqueci minha senha</h1>
          <p className="text-dark-400 mt-1 text-sm">Recuperação de senha por e-mail</p>
        </div>

        <div className="card p-6">
          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/15 mb-2">
                <CheckCircle2 className="w-8 h-8 text-success-500" />
              </div>
              <p className="text-white font-medium">E-mail enviado!</p>
              <p className="text-dark-400 text-sm">
                Se uma conta existir com este e-mail, você receberá um link
                para redefinir sua senha. Verifique sua caixa de entrada e spam.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full"
              >
                Voltar para o login
              </button>
            </div>
          ) : (
            <>
              <p className="text-dark-300 text-sm mb-4">
                Informe seu e-mail e enviaremos um link para você redefinir sua senha.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Enviar código de recuperação <Send className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar para o login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
