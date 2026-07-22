import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Loader2, FileText, Check, X, Eye, Truck, Clock, CheckCircle, XCircle, Package } from 'lucide-react'

type RequestData = {
  id: string; status: string; total_items: number; notes: string | null; created_at: string
  profiles: { name: string } | null
  request_items: { id: string; quantity: number; product_id: string; products: { name: string; sku: string } | null }[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'text-warning-700', bg: 'bg-warning-100', icon: Clock },
  approved: { label: 'Aprovada', color: 'text-success-700', bg: 'bg-success-100', icon: CheckCircle },
  rejected: { label: 'Negada', color: 'text-error-700', bg: 'bg-error-100', icon: XCircle },
  completed: { label: 'Entregue', color: 'text-ebd-700', bg: 'bg-ebd-100', icon: Truck },
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
            await supabase.from('movements').insert({ product_id: item.product_id, type: 'out', quantity: item.quantity, reason: 'Solicitacao aprovada', request_id: id })
          }
        }
      }
    }
    await supabase.from('requests').update({ status }).eq('id', id)
    fetchRequests()
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)
  const counts = { all: requests.length, pending: requests.filter((r) => r.status === 'pending').length, approved: requests.filter((r) => r.status === 'approved').length, rejected: requests.filter((r) => r.status === 'rejected').length, completed: requests.filter((r) => r.status === 'completed').length }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="animate-fade-in">
      <div className="mb-6"><h2 className="text-2xl font-bold text-neutral-900">Solicitacoes</h2><p className="text-sm text-neutral-500 mt-1">{requests.length} solicitacoes no total</p></div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendentes' },
          { key: 'approved', label: 'Aprovadas' },
          { key: 'rejected', label: 'Negadas' },
          { key: 'completed', label: 'Entregues' },
        ].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${filter === f.key ? 'gradient-ebd text-white shadow-ebd' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'}`}>
            {f.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === f.key ? 'bg-white/20' : 'bg-neutral-100'}`}>{counts[f.key as keyof typeof counts]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-40" /><p className="font-medium">Nenhuma solicitacao encontrada</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const status = statusConfig[req.status] ?? statusConfig.pending
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-ebd-50 flex items-center justify-center"><FileText className="w-5 h-5 text-ebd-700" /></div>
                    <div>
                      <p className="font-semibold text-neutral-900">{req.profiles?.name ?? '—'}</p>
                      <p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')} · {req.total_items} itens</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}><status.icon className="w-3.5 h-3.5" /> {status.label}</span>
                    <button onClick={() => setViewing(req)} className="p-2 rounded-lg hover:bg-neutral-100 transition-colors" title="Ver detalhes"><Eye className="w-4 h-4 text-neutral-500" /></button>
                    {req.status === 'pending' && (<>
                      <button onClick={() => updateStatus(req.id, 'approved')} className="p-2 rounded-lg hover:bg-success-50 transition-colors" title="Aprovar"><Check className="w-4 h-4 text-success-600" /></button>
                      <button onClick={() => updateStatus(req.id, 'rejected')} className="p-2 rounded-lg hover:bg-error-50 transition-colors" title="Negar"><X className="w-4 h-4 text-error-500" /></button>
                    </>)}
                    {req.status === 'approved' && <button onClick={() => updateStatus(req.id, 'completed')} className="p-2 rounded-lg hover:bg-ebd-50 transition-colors" title="Marcar Entregue"><Truck className="w-4 h-4 text-ebd-700" /></button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewing(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">Detalhes da Solicitacao</h3><button onClick={() => setViewing(null)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-neutral-100">
              <div className="w-10 h-10 rounded-full bg-ebd-100 flex items-center justify-center text-sm font-semibold text-ebd-700">{viewing.profiles?.name?.charAt(0).toUpperCase() ?? '?'}</div>
              <div><p className="font-medium text-neutral-900 text-sm">{viewing.profiles?.name ?? '—'}</p><p className="text-xs text-neutral-500">{new Date(viewing.created_at).toLocaleString('pt-BR')}</p></div>
            </div>
            <div className="space-y-2 mb-4">
              <p className="text-xs font-semibold text-neutral-500 uppercase">Itens Solicitados</p>
              {viewing.request_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-neutral-50">
                  <div className="flex items-center gap-2"><Package className="w-4 h-4 text-neutral-400" /><div><p className="text-sm text-neutral-700">{item.products?.name ?? '—'}</p><p className="text-xs text-neutral-400">Cod: {item.products?.sku ?? '—'}</p></div></div>
                  <span className="font-semibold text-neutral-900 text-sm">{item.quantity} un</span>
                </div>
              ))}
            </div>
            {viewing.notes && <div className="mb-4 p-3 rounded-xl bg-neutral-50"><p className="text-xs text-neutral-500">Observacoes: {viewing.notes}</p></div>}
            {viewing.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => { updateStatus(viewing.id, 'approved'); setViewing(null) }} className="flex-1 bg-success-600 hover:bg-success-700 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Aprovar</button>
                <button onClick={() => { updateStatus(viewing.id, 'rejected'); setViewing(null) }} className="flex-1 bg-error-500 hover:bg-error-600 text-white font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"><X className="w-4 h-4" /> Negar</button>
              </div>
            )}
            {viewing.status === 'approved' && <button onClick={() => { updateStatus(viewing.id, 'completed'); setViewing(null) }} className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-2.5 rounded-xl transition-all shadow-ebd flex items-center justify-center gap-2"><Truck className="w-4 h-4" /> Marcar como Entregue</button>}
          </div>
        </div>
      )}
    </div>
  )
}
