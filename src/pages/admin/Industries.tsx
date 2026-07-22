import { useEffect, useState } from 'react'
import { supabase, Industry } from '../../lib/supabase'
import { Building2, Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react'

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Industry | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '' })

  useEffect(() => { fetchIndustries() }, [])

  async function fetchIndustries() {
    setLoading(true)
    const { data } = await supabase.from('industries').select('*').order('name')
    setIndustries(data as Industry[] ?? [])
    setLoading(false)
  }

  function openModal(ind?: Industry) {
    if (ind) {
      setEditing(ind)
      setForm({ name: ind.name, cnpj: ind.cnpj ?? '', contact_name: ind.contact_name ?? '', contact_email: ind.contact_email ?? '', contact_phone: ind.contact_phone ?? '', address: ind.address ?? '' })
    } else {
      setEditing(null)
      setForm({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '' })
    }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await supabase.from('industries').update(form).eq('id', editing.id)
    } else {
      await supabase.from('industries').insert(form)
    }
    setShowModal(false)
    fetchIndustries()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja realmente excluir esta indústria?')) return
    await supabase.from('industries').delete().eq('id', id)
    fetchIndustries()
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Indústrias</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-600/20">
          <Plus className="w-4 h-4" /> Nova Indústria
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {industries.map((ind) => (
          <div key={ind.id} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(ind)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                  <Pencil className="w-4 h-4 text-neutral-500" />
                </button>
                <button onClick={() => handleDelete(ind.id)} className="p-2 rounded-lg hover:bg-error-50 transition-colors">
                  <Trash2 className="w-4 h-4 text-error-500" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-neutral-900">{ind.name.trim()}</h3>
            {ind.contact_name && <p className="text-sm text-neutral-500 mt-1">{ind.contact_name}</p>}
            {ind.contact_phone && <p className="text-xs text-neutral-400 mt-0.5">{ind.contact_phone}</p>}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">{editing ? 'Editar Indústria' : 'Nova Indústria'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100">
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="CNPJ" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Contato" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="E-mail" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="Telefone" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereço" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all">
                {editing ? 'Salvar' : 'Criar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
