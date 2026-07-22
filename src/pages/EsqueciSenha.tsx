import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, AlertCircle, CheckCircle2, ArrowLeft, Send, Moon, Sun } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';

export default function EsqueciSenha() {
  const { resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setSubmitting(true);
    const { error } = await resetPassword(email);
    if (error) { setError(error); setSubmitting(false); } else { setSuccess(true); setSubmitting(false); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <button onClick={toggleTheme} className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark ? 'text-dark-300 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-600/30"><Package className="w-8 h-8 text-white" /></div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Esqueci minha senha</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Recuperação de senha por e-mail</p>
        </div>
        <div className={`card p-6 ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-lg'}`}>
          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/15 mb-2"><CheckCircle2 className="w-8 h-8 text-success-500" /></div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>E-mail enviado!</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Se uma conta existir com este e-mail, você receberá um link para redefinir sua senha. Verifique sua caixa de entrada e spam.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Voltar para o login</button>
            </div>
          ) : (
            <>
              <p className={`text-sm mb-4 ${isDark ? 'text-dark-300' : 'text-gray-600'}`}>Informe seu e-mail e enviaremos um link para você redefinir sua senha.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="label">E-mail</label><div className="relative"><Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="seu@email.com" required autoComplete="email" /></div></div>
                {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
                <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Enviar código de recuperação <Send className="w-4 h-4" /></>}</button>
              </form>
              <div className="mt-6 text-center"><Link to="/login" className={`inline-flex items-center gap-1 text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><ArrowLeft className="w-4 h-4" />Voltar para o login</Link></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
