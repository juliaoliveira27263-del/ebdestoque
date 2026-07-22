import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ArrowLeftRight, Loader2, Plus, Minus, X, ArrowUp, ArrowDown } from 'lucide-react'

type Movement = {
  id: string; type: string; quantity: number; reason: string | null; created_at: string; product_id: string
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
      supabase.from('movements').select(`id, type, quantity, reason, created_at, product_id, products ( name, sku ), profiles ( name )`).order('created_at', { ascending: false }),
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
    setShowModal(false); setForm({ product_id: '', type: 'in', quantity: 1, reason: '' }); fetchData()
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div><h2 className="text-2xl font-bold text-neutral-900">Movimentacoes</h2><p className="text-sm text-neutral-500 mt-1">{movements.length} movimentacoes registradas</p></div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 gradient-ebd hover:opacity-90 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-ebd"><Plus className="w-4 h-4" /> Nova Movimentacao</button>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-card">
        {movements.length === 0 ? (
          <div className="text-center py-16 text-neutral-400"><ArrowLeftRight className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhuma movimentacao registrada</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Produto</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Tipo</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Qtd</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5 hidden sm:table-cell">Motivo</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5 hidden sm:table-cell">Usuario</th>
                  <th className="text-left text-xs font-semibold text-neutral-500 uppercase px-5 py-3.5">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-neutral-900">{m.products?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${m.type === 'in' ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'}`}>
                        {m.type === 'in' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {m.type === 'in' ? 'Entrada' : 'Saida'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-semibold text-neutral-900">{m.quantity}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500 hidden sm:table-cell">{m.reason ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500 hidden sm:table-cell">{m.profiles?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-sm text-neutral-500">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">Nova Movimentacao</h3><button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
                <option value="">Selecione o produto</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none bg-white">
                <option value="in">Entrada</option><option value="out">Saida</option>
              </select>
              <input type="number" min={1} required value={form.quantity} onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })} placeholder="Quantidade" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Motivo" className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-ebd-700 outline-none" />
              <button type="submit" className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-all shadow-ebd">Registrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
