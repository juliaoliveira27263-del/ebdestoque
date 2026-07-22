import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Package, Mail, Lock, ArrowRight, User, Building, Phone, MapPin } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [formData, setFormData] = useState({ name: '', surname: '', company: '', phone: '', city: '', state: '' })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) { setError('As senhas não conferem'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: formData.name, surname: formData.surname, company: formData.company, phone: formData.phone, city: formData.city, state: formData.state, role: 'solicitante' } }
    })
    setLoading(false)
    if (error) setError(error.message)
    else if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        name: `${formData.name} ${formData.surname}`,
        role: 'solicitante',
        phone: formData.phone,
        city: formData.city,
        active: false,
      })
      setMessage('Conta criada! Aguarde aprovação do administrador.')
      setMode('login')
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('E-mail de recuperação enviado!')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-ebd-50 px-4 py-8">
      <div className="w-full max-w-md animate-scaleIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ebd-700 shadow-lg shadow-ebd-700/20 mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900">EBD Distribuidora</h1>
          <p className="text-neutral-500 mt-1 text-sm">Sistema de Gestão de Materiais de Merchandising</p>
        </div>

        <div className="bg-white rounded-2xl shadow-elevated border border-neutral-200 p-8">
          {mode === 'login' && (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Entrar</h2>
              {message && <div className="bg-success-50 border border-success-100 text-success-700 text-sm rounded-lg px-4 py-3 mb-4">{message}</div>}
              {error && <div className="bg-error-50 border border-error-100 text-error-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" placeholder="••••••••" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-ebd-700 hover:bg-ebd-800 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-ebd-700/20 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? 'Entrando...' : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="flex items-center justify-between mt-4 text-sm">
                <button onClick={() => setMode('signup')} className="text-ebd-700 hover:text-ebd-800 font-medium transition-colors">Criar conta</button>
                <button onClick={() => setMode('forgot')} className="text-neutral-500 hover:text-neutral-700 transition-colors">Esqueci minha senha</button>
              </div>
            </>
          )}

          {mode === 'signup' && (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Criar Conta</h2>
              {error && <div className="bg-error-50 border border-error-100 text-error-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input required value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} placeholder="Sobrenome" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                  </div>
                </div>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Empresa" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Telefone" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                  </div>
                  <input required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Estado" className="px-3 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar senha" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-ebd-700 hover:bg-ebd-800 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-ebd-700/20 disabled:opacity-50">
                  {loading ? 'Criando...' : 'Criar Conta'}
                </button>
              </form>
              <button onClick={() => setMode('login')} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-4 transition-colors">Já tenho conta · Entrar</button>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Recuperar Senha</h2>
              {error && <div className="bg-error-50 border border-error-100 text-error-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
              {message && <div className="bg-success-50 border border-success-100 text-success-700 text-sm rounded-lg px-4 py-3 mb-4">{message}</div>}
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-ebd-700 hover:bg-ebd-800 text-white font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-ebd-700/20 disabled:opacity-50">
                  {loading ? 'Enviando...' : 'Enviar Recuperação'}
                </button>
              </form>
              <button onClick={() => setMode('login')} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-4 transition-colors">Voltar para login</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
