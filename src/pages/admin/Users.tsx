import { useEffect, useState } from 'react'
import { supabase, Profile } from '../../lib/supabase'
import { Pencil, Trash2, X, Loader2, Check, Ban, Phone, MapPin, Calendar } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Profile | null>(null)
  const [form, setForm] = useState({ name: '', role: 'solicitante', phone: '', city: '', active: true })

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').order('name')
    setUsers(data as Profile[] ?? [])
    setLoading(false)
  }

  function openModal(user?: Profile) {
    if (user) { setEditing(user); setForm({ name: user.name, role: user.role, phone: user.phone ?? '', city: user.city ?? '', active: user.active }) }
    else { setEditing(null); setForm({ name: '', role: 'solicitante', phone: '', city: '', active: true }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) await supabase.from('profiles').update(form).eq('id', editing.id)
    setShowModal(false); fetchUsers()
  }

  async function handleDelete(id: string) { if (confirm('Deseja excluir este usuario?')) { await supabase.from('profiles').delete().eq('id', id); fetchUsers() } }
  async function toggleActive(user: Profile) { await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id); fetchUsers() }

  const roleLabels: Record<string, string> = { admin: 'Administrador', solicitante: 'Solicitante', promotor: 'Promotor', supervisor: 'Supervisor', vendedor: 'Vendedor' }
  const roleColors: Record<string, string> = { admin: 'bg-ebd-100 text-ebd-700', solicitante: 'bg-neutral-100 text-neutral-700', promotor: 'bg-success-100 text-success-700', supervisor: 'bg-warning-100 text-warning-700', vendedor: 'bg-blue-100 text-blue-700' }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fade-in">
      <div className="mb-6"><h2 className="text-2xl font-bold text-neutral-900">Usuarios</h2><p className="text-sm text-neutral-500 mt-1">{users.length} usuarios cadastrados</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user, i) => (
          <div key={user.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card card-hover animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-full gradient-ebd flex items-center justify-center text-lg font-bold text-white">{user.name.charAt(0).toUpperCase()}</div>
              <div className="flex gap-1">
                <button onClick={() => openModal(user)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"><Pencil className="w-4 h-4 text-neutral-500" /></button>
                <button onClick={() => toggleActive(user)} className={`p-2 rounded-lg transition-colors ${user.active ? 'hover:bg-error-50' : 'hover:bg-success-50'}`} title={user.active ? 'Bloquear' : 'Aprovar'}>
                  {user.active ? <Ban className="w-4 h-4 text-error-500" /> : <Check className="w-4 h-4 text-success-600" />}
                </button>
                <button onClick={() => handleDelete(user.id)} className="p-2 rounded-lg hover:bg-error-50 transition-colors"><Trash2 className="w-4 h-4 text-error-500" /></button>
              </div>
            </div>
            <h3 className="font-semibold text-neutral-900">{user.name}</h3>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role] ?? roleColors.solicitante}`}>{roleLabels[user.role] ?? user.role}</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-400'}`}>{user.active ? 'Ativo' : 'Inativo'}</span>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 space-y-1">
              {user.phone && <p className="text-xs text-neutral-400 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {user.phone}</p>}
              {user.city && <p className="text-xs text-neutral-400 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {user.city}</p>}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">{editing ? 'Editar Usuario' : 'Novo Usuario'}</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
                <option value="solicitante">Solicitante</option><option value="admin">Administrador</option><option value="promotor">Promotor</option><option value="supervisor">Supervisor</option><option value="vendedor">Vendedor</option>
              </select>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Telefone" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded accent-ebd-700" /> Ativo</label>
              <button type="submit" className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-all shadow-ebd">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
