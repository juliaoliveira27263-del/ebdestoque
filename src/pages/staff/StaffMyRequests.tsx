import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ClipboardList, Loader2, Package } from 'lucide-react'

type RequestWithItems = {
  id: string
  status: string
  total_items: number
  notes: string | null
  created_at: string
  request_items: { id: string; quantity: number; product_id: string; products: { name: string; sku: string } | null }[]
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-warning-700', bg: 'bg-warning-100' },
  approved: { label: 'Aprovada', color: 'text-success-700', bg: 'bg-success-100' },
  rejected: { label: 'Negada', color: 'text-error-700', bg: 'bg-error-100' },
  completed: { label: 'Entregue', color: 'text-ebd-700', bg: 'bg-ebd-100' },
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
    <div className="max-w-4xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Minhas Solicitações</h2>
        <p className="text-neutral-500 text-sm mt-1">Acompanhe o status das suas solicitações</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">Nenhuma solicitação ainda</p>
          <p className="text-sm">Volte para a página de indústrias para fazer sua primeira solicitação</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const status = statusConfig[req.status] ?? statusConfig.pending
            return (
              <div key={req.id} className="bg-white rounded-2xl border border-neutral-200 p-5 animate-fadeIn shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ebd-50 flex items-center justify-center"><Package className="w-5 h-5 text-ebd-700" /></div>
                    <div>
                      <p className="font-semibold text-neutral-900 text-sm">Solicitação #{req.id.slice(0, 8)}</p>
                      <p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>{status.label}</span>
                </div>
                <div className="border-t border-neutral-100 pt-3">
                  <p className="text-xs text-neutral-500 mb-2">{req.total_items} item(s) solicitado(s)</p>
                  <div className="space-y-1.5">
                    {req.request_items?.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 font-mono text-xs">{item.products?.sku ?? '—'}</span>
                          <span className="text-neutral-700">{item.products?.name ?? 'Produto removido'}</span>
                        </div>
                        <span className="font-medium text-neutral-900">{item.quantity} un</span>
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
