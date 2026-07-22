import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, Building2, FileText, AlertTriangle, TrendingUp, CheckCircle, XCircle, Truck } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, pending: 0, approved: 0, rejected: 0, delivered: 0, lowStock: 0, zeroStock: 0 })
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  useEffect(() => { fetchStats() }, [])

  async function fetchStats() {
    const [prods, pending, approved, rejected, delivered, lowStock, zeroStock, recent, movements] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('products').select('name, sku, stock_quantity, min_stock, unit').eq('active', true).lt('stock_quantity', 10),
      supabase.from('products').select('name, sku, stock_quantity, unit').eq('active', true).eq('stock_quantity', 0),
      supabase.from('requests').select(`id, status, total_items, created_at, profiles ( name )`).order('created_at', { ascending: false }).limit(5),
      supabase.from('movements').select(`id, type, quantity, created_at, products ( name ), profiles ( name )`).order('created_at', { ascending: false }).limit(5),
    ])
    setStats({
      products: prods.count ?? 0,
      pending: pending.count ?? 0,
      approved: approved.count ?? 0,
      rejected: rejected.count ?? 0,
      delivered: delivered.count ?? 0,
      lowStock: lowStock.data?.length ?? 0,
      zeroStock: zeroStock.data?.length ?? 0,
    })
    setRecentRequests(recent.data ?? [])
    setRecentMovements(movements.data ?? [])
    setLowStockProducts((lowStock.data ?? []).slice(0, 5))
  }

  const cards = [
    { label: 'Total de Produtos', value: stats.products, icon: Package, color: 'bg-ebd-700' },
    { label: 'Solicitações Pendentes', value: stats.pending, icon: FileText, color: 'bg-warning-500' },
    { label: 'Solicitações Aprovadas', value: stats.approved, icon: CheckCircle, color: 'bg-success-600' },
    { label: 'Solicitações Negadas', value: stats.rejected, icon: XCircle, color: 'bg-error-500' },
    { label: 'Solicitações Entregues', value: stats.delivered, icon: Truck, color: 'bg-ebd-600' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'bg-warning-500' },
    { label: 'Produtos Zerados', value: stats.zeroStock, icon: AlertTriangle, color: 'bg-error-500' },
    { label: 'Indústrias', value: 6, icon: Building2, color: 'bg-neutral-700' },
  ]

  const statusLabels: Record<string, string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Negada', completed: 'Entregue' }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-neutral-400" /><h3 className="font-semibold text-neutral-900">Últimas Solicitações</h3></div>
          {recentRequests.length === 0 ? <p className="text-sm text-neutral-400 py-4">Nenhuma solicitação</p> : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div><p className="text-sm font-medium text-neutral-900">{req.profiles?.name ?? '—'}</p><p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')}</p></div>
                  <div className="flex items-center gap-2"><span className="text-xs text-neutral-500">{req.total_items} itens</span><span className="text-xs font-medium text-neutral-700">{statusLabels[req.status] ?? req.status}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-warning-500" /><h3 className="font-semibold text-neutral-900">Estoque Baixo</h3></div>
          {lowStockProducts.length === 0 ? <p className="text-sm text-neutral-400 py-4">Todos os produtos com estoque adequado</p> : (
            <div className="space-y-3">
              {lowStockProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div><p className="text-sm font-medium text-neutral-900">{p.name}</p><p className="text-xs text-neutral-500">Código: {p.sku}</p></div>
                  <span className="text-sm font-semibold text-error-600">{p.stock_quantity} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4"><Package className="w-5 h-5 text-neutral-400" /><h3 className="font-semibold text-neutral-900">Últimas Movimentações</h3></div>
          {recentMovements.length === 0 ? <p className="text-sm text-neutral-400 py-4">Nenhuma movimentação</p> : (
            <div className="space-y-3">
              {recentMovements.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div><p className="text-sm font-medium text-neutral-900">{m.products?.name ?? '—'}</p><p className="text-xs text-neutral-500">{m.profiles?.name ?? '—'} · {new Date(m.created_at).toLocaleString('pt-BR')}</p></div>
                  <span className={`text-sm font-medium ${m.type === 'in' ? 'text-success-600' : 'text-error-600'}`}>{m.type === 'in' ? '+' : '-'}{m.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
