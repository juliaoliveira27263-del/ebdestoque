import { useEffect, useState } from 'react'
import { supabase, Product, Industry } from '../../lib/supabase'
import { Plus, Pencil, Trash2, X, Loader2, Search, Boxes, Filter } from 'lucide-react'

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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-neutral-900">Produtos</h2><p className="text-sm text-neutral-500 mt-1">{filtered.length} de {products.length} produtos</p></div>
        <button onClick={() => openModal()} className="flex items-center gap-2 gradient-ebd hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-ebd"><Plus className="w-4 h-4" /> Novo Produto</button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome ou codigo..." className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none" />
        </div>
        <div className="relative">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)} className="pl-11 pr-8 py-2.5 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 outline-none appearance-none">
            <option value="">Todas industrias</option>
            {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name.trim()}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-card">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-neutral-400"><Boxes className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhum produto encontrado</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Produto</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5 hidden sm:table-cell">Industria</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Codigo</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Estoque</th>
                  <th className="text-right text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((p) => {
                  const lowStock = p.stock_quantity < p.min_stock
                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <Boxes className="w-5 h-5 text-neutral-300" />}
                          </div>
                          <div><p className="text-sm font-medium text-neutral-900">{p.name}</p>{p.description && <p className="text-xs text-neutral-400 line-clamp-2">{p.description}</p>}</div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell"><span className="text-sm text-neutral-600">{industryName(p.industry_id)}</span></td>
                      <td className="px-5 py-3"><span className="text-sm text-neutral-500 font-mono">{p.sku}</span></td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${lowStock ? 'bg-error-50 text-error-700' : p.stock_quantity === 0 ? 'bg-error-100 text-error-700' : 'bg-success-50 text-success-700'}`}>
                          {p.stock_quantity} {p.unit}
                        </span>
                      </td>
                      <td className="px-5 py-3"><div className="flex justify-end gap-1"><button onClick={() => openModal(p)} className="p-2 rounded-lg hover:bg-neutral-100"><Pencil className="w-4 h-4 text-neutral-500" /></button><button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-error-50"><Trash2 className="w-4 h-4 text-error-500" /></button></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">{editing ? 'Editar Produto' : 'Novo Produto'}</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do produto" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Codigo" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <select required value={form.industry_id} onChange={(e) => setForm({ ...form, industry_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
                <option value="">Selecione a industria</option>
                {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name.trim()}</option>)}
              </select>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descricao" rows={2} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none resize-none" />
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-neutral-500 mb-1 block">Estoque</label><input type="number" required value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Minimo</label><input type="number" required value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" /></div>
                <div><label className="text-xs text-neutral-500 mb-1 block">Unidade</label><input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" /></div>
              </div>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="URL da imagem" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <button type="submit" className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-all shadow-ebd">{editing ? 'Salvar' : 'Criar Produto'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
