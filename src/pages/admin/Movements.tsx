import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeftRight, Loader2, Plus, Minus } from 'lucide-react'

type Movement = {
  id: string
  type: string
  quantity: number
  reason: string | null
  created_at: string
  product_id: string
  products: { name: string; sku: string } | null
  profiles: { name: string } | null
}

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ product_id: '', type: 'in', quantity: 1, reason: '' })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [{ data: movs }, { data: prods }] = await Promise.all([
      supabase.from('movements').select(`
        id, type, quantity, reason, created_at, product_id,
        products ( name, sku ),
        profiles ( name )
      `).order('created_at', { ascending: false }),
      supabase.from('products').select('id, name, sku').eq('active', true).order('name')
    ])
    setMovements(movs as unknown as Movement[] ?? [])
    setProducts(prods ?? [])
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { product_id, type, quantity, reason } = form
    const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', product_id).single()
    if (product) {
      const newQty = type === 'in' ? product.stock_quantity + quantity : Math.max(0, product.stock_quantity - quantity)
      await supabase.from('products').update({ stock_quantity: newQty }).eq('id', product_id)
    }
    await supabase.from('movements').insert({ product_id, type, quantity, reason })
    setShowModal(false)
    setForm({ product_id: '', type: 'in', quantity: 1, reason: '' })
    fetchData()
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-600 animate-spin" /></div>
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Movimentações</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary-600/20">
          <Plus className="w-4 h-4" /> Nova Movimentação
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        {movements.length === 0 ? (
          <div className="text-center py-12 text-neutral-400">
            <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma movimentação registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Produto</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Tipo</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Qtd</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3 hidden sm:table-cell">Motivo</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3 hidden sm:table-cell">Usuário</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 text-sm text-neutral-900">{m.products?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${m.type === 'in' ? 'bg-accent-100 text-accent-700' : 'bg-error-100 text-error-700'}`}>
                        {m.type === 'in' ? <Plus className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        {m.type === 'in' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-neutral-900">{m.quantity}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{m.reason ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500 hidden sm:table-cell">{m.profiles?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-neutral-500">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Nova Movimentação</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="">Selecione o produto</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                <option value="in">Entrada</option>
                <option value="out">Saída</option>
              </select>
              <input type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} placeholder="Quantidade" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Motivo" className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 rounded-lg transition-all">Registrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
