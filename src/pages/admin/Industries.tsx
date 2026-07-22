import { useEffect, useState } from 'react'
import { supabase, Industry } from '../../lib/supabase'
import { Building2, Plus, Pencil, Trash2, X, Loader2, Package } from 'lucide-react'

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Industry | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '' })

  useEffect(() => { fetchIndustries() }, [])

  async function fetchIndustries() {
    setLoading(true)
    const { data } = await supabase.from('industries').select('*').order('name')
    if (data) {
      setIndustries(data as Industry[])
      const counts: Record<string, number> = {}
      for (const ind of data) {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('industry_id', ind.id).eq('active', true)
        counts[ind.id] = count ?? 0
      }
      setProductCounts(counts)
    }
    setLoading(false)
  }

  function openModal(ind?: Industry) {
    if (ind) { setEditing(ind); setForm({ name: ind.name, cnpj: ind.cnpj ?? '', contact_name: ind.contact_name ?? '', contact_email: ind.contact_email ?? '', contact_phone: ind.contact_phone ?? '', address: ind.address ?? '' }) }
    else { setEditing(null); setForm({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '' }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) await supabase.from('industries').update(form).eq('id', editing.id)
    else await supabase.from('industries').insert(form)
    setShowModal(false); fetchIndustries()
  }

  async function handleDelete(id: string) { if (confirm('Deseja realmente excluir esta industria?')) { await supabase.from('industries').delete().eq('id', id); fetchIndustries() } }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-neutral-900">Industrias</h2><p className="text-sm text-neutral-500 mt-1">{industries.length} industrias cadastradas</p></div>
        <button onClick={() => openModal()} className="flex items-center gap-2 gradient-ebd hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-ebd"><Plus className="w-4 h-4" /> Nova Industria</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {industries.map((ind, i) => (
          <div key={ind.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card card-hover animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-ebd-50 flex items-center justify-center overflow-hidden">
                {ind.logo_url ? <img src={ind.logo_url} alt={ind.name} className="w-full h-full object-cover" /> : <Building2 className="w-7 h-7 text-ebd-700" />}
              </div>
              <div className="flex gap-1">
                <button onClick={() => openModal(ind)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"><Pencil className="w-4 h-4 text-neutral-500" /></button>
                <button onClick={() => handleDelete(ind.id)} className="p-2 rounded-lg hover:bg-error-50 transition-colors"><Trash2 className="w-4 h-4 text-error-500" /></button>
              </div>
            </div>
            <h3 className="font-bold text-neutral-900 text-lg">{ind.name.trim()}</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full"><Package className="w-3 h-3" /> {productCounts[ind.id] ?? 0} produtos</span>
              <span className={`text-xs px-2.5 py-1 rounded-full ${ind.active ? 'bg-success-100 text-success-700' : 'bg-neutral-100 text-neutral-400'}`}>{ind.active ? 'Ativa' : 'Inativa'}</span>
            </div>
            {(ind.contact_name || ind.contact_phone) && (
              <div className="mt-3 pt-3 border-t border-neutral-100">
                {ind.contact_name && <p className="text-sm text-neutral-600">{ind.contact_name}</p>}
                {ind.contact_phone && <p className="text-xs text-neutral-400 mt-0.5">{ind.contact_phone}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">{editing ? 'Editar Industria' : 'Nova Industria'}</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome da industria" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="CNPJ" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} placeholder="Contato" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="E-mail" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="Telefone" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Endereco" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <button type="submit" className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-all shadow-ebd">{editing ? 'Salvar' : 'Criar Industria'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
