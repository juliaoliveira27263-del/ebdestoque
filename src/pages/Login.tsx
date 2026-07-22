import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { Package, Mail, Lock, ArrowRight, User, Building, Phone, MapPin, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({ name: '', surname: '', company: '', phone: '', city: '', state: '' })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError(error)
    else navigate('/')
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null)
    if (password !== confirmPassword) { setError('As senhas nao conferem'); return }
    if (password.length < 6) { setError('A senha deve ter no minimo 6 caracteres'); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name: `${formData.name} ${formData.surname}`, company: formData.company, phone: formData.phone, city: formData.city, state: formData.state, role: 'solicitante' } }
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
      setMessage('Conta criada com sucesso! Aguarde a aprovacao do administrador.')
      setMode('login')
      setEmail(''); setPassword(''); setConfirmPassword('')
      setFormData({ name: '', surname: '', company: '', phone: '', city: '', state: '' })
    }
  }

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault(); setError(null); setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    setLoading(false)
    if (error) setError(error.message)
    else setMessage('E-mail de recuperacao enviado! Verifique sua caixa de entrada.')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 gradient-ebd relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">EBD Distribuidora</h1>
              <p className="text-sm text-white/70">Gestao de Merchandising</p>
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold leading-tight mb-4">Controle completo<br />do seu estoque de<br />materiais promocionais</h2>
            <p className="text-white/70 text-lg max-w-md">Sistema de gestao de materiais de merchandising da EBD Distribuidora. Solicite, acompanhe e gerencie seus materiais em um unico lugar.</p>
            <div className="flex gap-6 mt-8">
              <div><p className="text-3xl font-bold">116+</p><p className="text-sm text-white/60">Produtos</p></div>
              <div><p className="text-3xl font-bold">6</p><p className="text-sm text-white/60">Industrias</p></div>
              <div><p className="text-3xl font-bold">100%</p><p className="text-sm text-white/60">Digital</p></div>
            </div>
          </div>
          <p className="text-white/50 text-sm">© 2025 EBD Distribuidora. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Right panel - Forms */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-neutral-50">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl gradient-ebd flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-neutral-900">EBD Distribuidora</h1>
              <p className="text-xs text-neutral-400">Gestao de Merchandising</p>
            </div>
          </div>

          {mode === 'login' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Bem-vindo de volta</h2>
              <p className="text-neutral-500 mb-6 text-sm">Entre com sua conta para continuar</p>
              {message && <div className="bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0" /> {message}</div>}
              {error && <div className="bg-error-50 border border-error-200 text-error-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" placeholder="seu@email.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full pl-11 pr-11 py-3 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full gradient-ebd hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all shadow-ebd disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Entrar <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <div className="flex items-center justify-between mt-5 text-sm">
                <button onClick={() => setMode('signup')} className="text-ebd-700 hover:text-ebd-800 font-medium transition-colors">Criar conta</button>
                <button onClick={() => setMode('forgot')} className="text-neutral-500 hover:text-neutral-700 transition-colors">Esqueci minha senha</button>
              </div>
            </div>
          )}

          {mode === 'signup' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Criar conta</h2>
              <p className="text-neutral-500 mb-6 text-sm">Preencha seus dados para se cadastrar</p>
              {error && <div className="bg-error-50 border border-error-200 text-error-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
              <form onSubmit={handleSignup} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome" className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                  <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input required value={formData.surname} onChange={(e) => setFormData({ ...formData, surname: e.target.value })} placeholder="Sobrenome" className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                </div>
                <div className="relative"><Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input required value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} placeholder="Empresa" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Telefone" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative"><MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input required value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                  <input required value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Estado" className="px-3 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" />
                </div>
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha (min. 6 caracteres)" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirmar senha" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none text-sm" /></div>
                <button type="submit" disabled={loading} className="w-full gradient-ebd hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all shadow-ebd disabled:opacity-50">{loading ? 'Criando...' : 'Criar Conta'}</button>
              </form>
              <button onClick={() => setMode('login')} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-5 transition-colors">Ja tenho conta · Entrar</button>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Recuperar senha</h2>
              <p className="text-neutral-500 mb-6 text-sm">Enviaremos um e-mail para redefinir sua senha</p>
              {error && <div className="bg-error-50 border border-error-200 text-error-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}
              {message && <div className="bg-success-50 border border-success-200 text-success-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0" /> {message}</div>}
              <form onSubmit={handleForgot} className="space-y-4">
                <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none" /></div>
                <button type="submit" disabled={loading} className="w-full gradient-ebd hover:opacity-90 text-white font-semibold py-3 rounded-xl transition-all shadow-ebd disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar Recuperacao'}</button>
              </form>
              <button onClick={() => setMode('login')} className="w-full text-center text-sm text-neutral-500 hover:text-neutral-700 mt-5 transition-colors">Voltar para login</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
