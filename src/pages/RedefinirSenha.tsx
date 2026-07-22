import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, KeyRound, Moon, Sun } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function RedefinirSenha() {
  const { updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setVerifying(false); });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setVerifying(false); });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    if (newPassword.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    setSubmitting(true);
    const { error } = await updatePassword(newPassword);
    if (error) { setError(error); setSubmitting(false); } else { setSuccess(true); setSubmitting(false); setTimeout(() => navigate('/login'), 3000); }
  };

  if (verifying) return (<div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}><div className="text-center"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" /><p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Verificando link de recuperação...</p></div></div>);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <button onClick={toggleTheme} className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark ? 'text-dark-300 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-600/30"><Package className="w-8 h-8 text-white" /></div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Redefinir Senha</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Crie uma nova senha para sua conta</p>
        </div>
        <div className={`card p-6 ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-lg'}`}>
          {success ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/15 mb-2"><CheckCircle2 className="w-8 h-8 text-success-500" /></div>
              <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Senha atualizada com sucesso!</p>
              <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Redirecionando para a tela de login...</p>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="label">Nova Senha</label><div className="relative"><Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" autoFocus /><button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
                <div><label className="label">Confirmar Nova Senha</label><div className="relative"><Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Repita a nova senha" required minLength={8} autoComplete="new-password" /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>{confirmPassword && newPassword !== confirmPassword && <p className="text-error-500 text-xs mt-1">As senhas não coincidem.</p>}</div>
                {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
                <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Atualizar senha <KeyRound className="w-4 h-4" /></>}</button>
              </form>
              <div className="mt-6 text-center"><Link to="/login" className={`inline-flex items-center gap-1 text-sm transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><ArrowLeft className="w-4 h-4" />Voltar para o login</Link></div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
