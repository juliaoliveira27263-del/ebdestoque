import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ClipboardList, Loader2, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react'

type RequestWithItems = {
  id: string; status: string; total_items: number; notes: string | null; created_at: string
  request_items: { id: string; quantity: number; product_id: string; products: { name: string; sku: string } | null }[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'text-warning-700', bg: 'bg-warning-100', icon: Clock },
  approved: { label: 'Aprovada', color: 'text-success-700', bg: 'bg-success-100', icon: CheckCircle },
  rejected: { label: 'Negada', color: 'text-error-700', bg: 'bg-error-100', icon: XCircle },
  completed: { label: 'Entregue', color: 'text-ebd-700', bg: 'bg-ebd-100', icon: Truck },
}

export default function StaffMyRequests() {
  const { profile } = useAuth()
  const [requests, setRequests] = useState<RequestWithItems[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchRequests() }, [profile])

  async function fetchRequests() {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase.from('requests').select(`id, status, total_items, notes, created_at, request_items ( id, quantity, product_id, products ( name, sku ) )`).eq('user_id', profile.id).order('created_at', { ascending: false })
    setRequests(data as unknown as RequestWithItems[] ?? [])
    setLoading(false)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Minhas Solicitacoes</h2>
        <p className="text-neutral-500 text-sm mt-1">{requests.length} solicitacoes registradas</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4"><ClipboardList className="w-8 h-8 opacity-50" /></div>
          <p className="font-medium text-neutral-500">Nenhuma solicitacao ainda</p>
          <p className="text-sm mt-1">Volte para a pagina de industrias para fazer sua primeira solicitacao</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => {
            const status = statusConfig[req.status] ?? statusConfig.pending
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 p-5 animate-slide-up shadow-card" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-ebd-50 flex items-center justify-center"><Package className="w-5 h-5 text-ebd-700" /></div>
                    <div><p className="font-semibold text-neutral-900 text-sm">Solicitacao #{req.id.slice(0, 8)}</p><p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')}</p></div>
                  </div>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}><status.icon className="w-3.5 h-3.5" /> {status.label}</span>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <p className="text-xs text-neutral-500 mb-2">{req.total_items} item(s) solicitado(s)</p>
                  <div className="space-y-1.5">
                    {req.request_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-neutral-50">
                        <div className="flex items-center gap-2"><Package className="w-4 h-4 text-neutral-400" /><div><span className="text-sm text-neutral-700">{item.products?.name ?? 'Produto removido'}</span><p className="text-xs text-neutral-400">Cod: {item.products?.sku ?? '—'}</p></div></div>
                        <span className="font-semibold text-neutral-900 text-sm">{item.quantity} un</span>
                      </div>
                    ))}
                  </div>
                </div>
                {req.notes && <div className="mt-3 pt-3 border-t border-neutral-100"><p className="text-xs text-neutral-500">{req.notes}</p></div>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
