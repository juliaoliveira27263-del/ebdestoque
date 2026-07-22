import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, FileText, Check, X, Eye, Truck } from 'lucide-react'

type RequestData = {
  id: string; status: string; total_items: number; notes: string | null; created_at: string
  profiles: { name: string } | null
  request_items: { id: string; quantity: number; product_id: string; products: { name: string; sku: string } | null }[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-warning-700', bg: 'bg-warning-100' },
  approved: { label: 'Aprovada', color: 'text-success-700', bg: 'bg-success-100' },
  rejected: { label: 'Negada', color: 'text-error-700', bg: 'bg-error-100' },
  completed: { label: 'Entregue', color: 'text-ebd-700', bg: 'bg-ebd-100' },
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [viewing, setViewing] = useState<RequestData | null>(null)

  useEffect(() => { fetchRequests() }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data } = await supabase.from('requests').select(`id, status, total_items, notes, created_at, profiles ( name ), request_items ( id, quantity, product_id, products ( name, sku ) )`).order('created_at', { ascending: false })
    setRequests(data as unknown as RequestData[] ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    if (status === 'approved') {
      const req = requests.find((r) => r.id === id)
      if (req) {
        for (const item of req.request_items) {
          const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single()
          if (product && product.stock_quantity >= item.quantity) {
            await supabase.from('products').update({ stock_quantity: product.stock_quantity - item.quantity }).eq('id', item.product_id)
            await supabase.from('movements').insert({ product_id: item.product_id, type: 'out', quantity: item.quantity, reason: 'Solicitação aprovada', request_id: id })
          }
        }
      }
    }
    await supabase.from('requests').update({ status }).eq('id', id)
    fetchRequests()
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Solicitações</h2>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['all', 'pending', 'approved', 'rejected', 'completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === f ? 'bg-ebd-700 text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'}`}>
            {f === 'all' ? 'Todas' : statusConfig[f]?.label ?? f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma solicitação encontrada</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const status = statusConfig[req.status] ?? statusConfig.pending
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-card">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ebd-50 flex items-center justify-center"><FileText className="w-5 h-5 text-ebd-700" /></div>
                    <div><p className="font-semibold text-neutral-900 text-sm">{req.profiles?.name ?? '—'}</p><p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')} · {req.total_items} itens</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                    <button onClick={() => setViewing(req)} className="p-2 rounded-lg hover:bg-neutral-100"><Eye className="w-4 h-4 text-neutral-500" /></button>
                    {req.status === 'pending' && (<>
                      <button onClick={() => updateStatus(req.id, 'approved')} className="p-2 rounded-lg hover:bg-success-50" title="Aprovar"><Check className="w-4 h-4 text-success-600" /></button>
                      <button onClick={() => updateStatus(req.id, 'rejected')} className="p-2 rounded-lg hover:bg-error-50" title="Negar"><X className="w-4 h-4 text-error-500" /></button>
                    </>)}
                    {req.status === 'approved' && <button onClick={() => updateStatus(req.id, 'completed')} className="p-2 rounded-lg hover:bg-ebd-50" title="Marcar Entregue"><Truck className="w-4 h-4 text-ebd-700" /></button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-neutral-900">Detalhes da Solicitação</h3><button onClick={() => setViewing(null)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <p className="text-sm text-neutral-500 mb-1">Solicitante: <span className="font-medium text-neutral-900">{viewing.profiles?.name ?? '—'}</span></p>
            <p className="text-sm text-neutral-500 mb-4">Data: {new Date(viewing.created_at).toLocaleString('pt-BR')}</p>
            <div className="border-t border-neutral-100 pt-3 space-y-2">
              {viewing.request_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><span className="text-neutral-400 font-mono text-xs">{item.products?.sku ?? '—'}</span><span className="text-neutral-700">{item.products?.name ?? '—'}</span></div>
                  <span className="font-medium text-neutral-900">{item.quantity} un</span>
                </div>
              ))}
            </div>
            {viewing.notes && <p className="mt-3 pt-3 border-t border-neutral-100 text-sm text-neutral-500">Obs: {viewing.notes}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
