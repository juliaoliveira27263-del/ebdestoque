import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, UserPlus, CheckCircle2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function Cadastro() {
  const { signUp, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userCount, setUserCount] = useState<number | null>(null);
  const isDark = theme === 'dark';

  useEffect(() => { if (user && !loading) navigate('/'); }, [user, loading, navigate]);
  useEffect(() => { (async () => { const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }); setUserCount(count ?? 0); })(); }, []);

  const validate = (): string | null => {
    if (!name.trim()) return 'Nome é obrigatório.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Formato de e-mail inválido.';
    if (password.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (password !== confirmPassword) return 'As senhas não coincidem.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setSubmitting(true);
    const { error } = await signUp(email, password, name);
    if (error) { setError(error.includes('already registered') || error.includes('already been registered') ? 'Este e-mail já está cadastrado.' : error); setSubmitting(false); }
    else { navigate('/'); }
  };

  if (loading) return (<div className="min-h-screen flex items-center justify-center bg-dark-950"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <button onClick={toggleTheme} className={`absolute top-4 right-4 p-2 rounded-lg transition-colors ${isDark ? 'text-dark-300 hover:text-white hover:bg-dark-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 mb-4 shadow-lg shadow-primary-600/30"><Package className="w-8 h-8 text-white" /></div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Criar Conta</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Cadastre-se no sistema</p>
        </div>
        <div className={`card p-6 ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-lg'}`}>
          {userCount === 0 && <div className="mb-4 p-3 rounded-lg bg-primary-600/10 border border-primary-600/30 text-primary-600 text-sm flex items-start gap-2"><CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><span>Este é o primeiro acesso. Você será o Administrador Master.</span></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Nome Completo</label><div className="relative"><UserIcon className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" placeholder="Seu nome completo" required autoComplete="name" /></div></div>
            <div><label className="label">E-mail</label><div className="relative"><Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-10" placeholder="seu@email.com" required autoComplete="email" /></div></div>
            <div><label className="label">Senha</label><div className="relative"><Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Mínimo 8 caracteres" required minLength={8} autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div></div>
            <div><label className="label">Confirmar Senha</label><div className="relative"><Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} /><input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Repita a senha" required minLength={8} autoComplete="new-password" /><button type="button" onClick={() => setShowConfirm(!showConfirm)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-dark-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button></div>{confirmPassword && password !== confirmPassword && <p className="text-error-500 text-xs mt-1">As senhas não coincidem.</p>}</div>
            {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
            <button type="submit" disabled={submitting} className="btn-primary w-full">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Criar Conta <UserPlus className="w-4 h-4" /></>}</button>
          </form>
          <div className="mt-6 text-center"><p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Já tem conta?{' '}<Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium transition-colors">Entrar</Link></p></div>
        </div>
      </div>
    </div>
  );
}
