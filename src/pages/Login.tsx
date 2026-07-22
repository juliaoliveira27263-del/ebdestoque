import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { toast } from 'sonner';

export default function Login() {
  const { signIn } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error); } else { toast.success('Login realizado com sucesso!'); navigate('/'); }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <button onClick={toggleTheme} className={`absolute top-4 right-4 p-2.5 rounded-xl transition-colors ${isDark ? 'bg-dark-800 text-dark-300 hover:bg-dark-700' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'}`}>{isDark ? <Sun size={20} /> : <Moon size={20} />}</button>
      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${isDark ? 'bg-dark-900 border border-dark-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4"><span className="text-white font-bold text-xl">EBD</span></div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>EBD Petrolina</h1>
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Controle de Estoque</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Email</label>
            <div className="relative">
              <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} size={18} />
              <input type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} placeholder="seu@email.com" />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Senha</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} size={18} />
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} required className={`w-full pl-10 pr-10 py-2.5 rounded-xl border outline-none transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} placeholder="••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">{loading ? 'Entrando...' : 'Entrar'}</button>
        </form>
        <div className="mt-6 flex flex-col gap-2 text-center">
          <Link to="/esqueci-senha" className={`text-sm ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Esqueci minha senha</Link>
          <Link to="/cadastro" className={`text-sm ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>Não tem conta? Cadastre-se</Link>
        </div>
      </div>
    </div>
  );
}
