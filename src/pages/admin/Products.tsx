import { useEffect, useState } from 'react'
import { supabase, Product, Industry } from '../../lib/supabase'
import { Plus, Pencil, Trash2, X, Loader2, Search, Boxes } from 'lucide-react'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', sku: '', description: '', stock_quantity: 0, min_stock: 0, unit: 'un', industry_id: '', image_url: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: prods }, { data: inds }] = await Promise.all([
      supabase.from('products').select('*').order('name'),
      supabase.from('industries').select('*').order('name')
    ])
    setProducts(prods as Product[] ?? [])
    setIndustries(inds as Industry[] ?? [])
    setLoading(false)
  }

  function openModal(prod?: Product) {
    if (prod) { setEditing(prod); setForm({ name: prod.name, sku: prod.sku, description: prod.description ?? '', stock_quantity: prod.stock_quantity, min_stock: prod.min_stock, unit: prod.unit, industry_id: prod.industry_id, image_url: prod.image_url ?? '' }) }
    else { setEditing(null); setForm({ name: '', sku: '', description: '', stock_quantity: 0, min_stock: 0, unit: 'un', industry_id: '', image_url: '' }) }
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) await supabase.from('products').update(form).eq('id', editing.id)
    else await supabase.from('products').insert({ ...form, active: true })
    setShowModal(false); fetchData()
  }

  async function handleDelete(id: string) { if (confirm('Deseja excluir este produto?')) { await supabase.from('products').delete().eq('id', id); fetchData() } }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = !filterIndustry || p.industry_id === filterIndustry
    return matchSearch && matchIndustry
  })

  const industryName = (id: string) => industries.find((i) => i.id === id)?.name.trim() ?? '—'

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Produtos</h2>
        <button onClick={() => openModal()} className="flex items-center gap-2 bg-ebd-700 hover:bg-ebd-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-ebd-700/20"><Plus className="w-4 h-4" /> Novo Produto</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white" />
        </div>
        <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
          <option value="">Todas indústrias</option>
          {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name.trim()}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-card">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-neutral-400"><Boxes className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhum produto encontrado</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Produto</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3 hidden sm:table-cell">Indústria</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Código</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Estoque</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">{p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}</div>
                        <span className="text-sm font-medium text-neutral-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600 hidden sm:table-cell">{industryName(p.industry_id)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500 font-mono">{p.sku}</td>
                    <td className="px-4 py-3"><span className={`text-sm font-medium ${p.stock_quantity < p.min_stock ? 'text-error-600' : 'text-neutral-900'}`}>{p.stock_quantity} {p.unit}</span></td>
                    <td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => openModal(p)} className="p-2 rounded-lg hover:bg-neutral-100"><Pencil className="w-4 h-4 text-neutral-500" /></button><button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-neutral-900">{editing ? 'Editar Produto' : 'Novo Produto'}</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Código" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <select required value={form.industry_id} onChange={(e) => setForm({ ...form, industry_id: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
                <option value="">Selecione a indústria</option>
                {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name.trim()}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} placeholder="Estoque" className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                <input type="number" required value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })} placeholder="Mínimo" className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
                <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="Un" className="px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              </div>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL da imagem" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <button type="submit" className="w-full bg-ebd-700 hover:bg-ebd-800 text-white font-medium py-2.5 rounded-lg transition-all">{editing ? 'Salvar' : 'Criar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
