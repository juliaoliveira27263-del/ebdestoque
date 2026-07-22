import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
        navigate('/');
      } else {
        await signUp(email, password, name);
        toast.success('Conta criada! Faça login para continuar.');
        setMode('signin');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary-950 p-4">
      <div className="w-full max-w-md bg-primary-900 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-2">EBD Petrolina</h1>
        <p className="text-red-200 mb-6">Controle de Estoque</p>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('signin')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'signin' ? 'bg-primary-600 text-white' : 'bg-primary-800 text-red-200'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'signup' ? 'bg-primary-600 text-white' : 'bg-primary-800 text-red-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-red-100 mb-1">Nome</label>
              <input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-primary-800 text-white border border-primary-700 focus:border-primary-400 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-red-100 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-primary-800 text-white border border-primary-700 focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-red-100 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-primary-800 text-white border border-primary-700 focus:border-primary-400 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : mode === 'signin' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
