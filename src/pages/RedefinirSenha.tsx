import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Sun, Moon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { toast } from 'sonner';

export default function RedefinirSenha() {
  const { updatePassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isDark = theme === 'dark';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-dark-950' : 'bg-gray-50'}`}>
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-2.5 rounded-xl transition-colors ${isDark ? 'bg-dark-800 text-dark-300 hover:bg-dark-700' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'}`}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl shadow-xl ${isDark ? 'bg-dark-900 border border-dark-800' : 'bg-white border border-gray-200'}`}>
        <Link to="/login" className={`flex items-center gap-2 text-sm mb-6 ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
          <ArrowLeft size={16} /> Voltar ao login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">EBD</span>
          </div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Redefinir Senha</h1>
          <p className={`text-sm mt-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Digite sua nova senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Nova Senha</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full pl-10 pr-10 py-2.5 rounded-xl border outline-none transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`}
                placeholder="Mínimo 6 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Confirmar Senha</label>
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`}
                placeholder="Repita a senha"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
