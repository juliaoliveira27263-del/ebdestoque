import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, Building2, FileText, AlertTriangle, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    industries: 0,
    pendingRequests: 0,
    lowStock: 0,
  })
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const [prods, inds, pending, lowStock, recent] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('industries').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('products').select('name, sku, stock_quantity, min_stock, unit').eq('active', true).lt('stock_quantity', 10),
      supabase.from('requests').select(`
        id, status, total_items, created_at,
        profiles ( name )
      `).order('created_at', { ascending: false }).limit(5)
    ])

    setStats({
      products: prods.count ?? 0,
      industries: inds.count ?? 0,
      pendingRequests: pending.count ?? 0,
      lowStock: lowStock.data?.length ?? 0,
    })
    setRecentRequests(recent.data ?? [])
    setLowStockProducts((lowStock.data ?? []).slice(0, 5))
  }

  const cards = [
    { label: 'Produtos', value: stats.products, icon: Package, color: 'bg-primary-600' },
    { label: 'Indústrias', value: stats.industries, icon: Building2, color: 'bg-accent-600' },
    { label: 'Solicitações Pendentes', value: stats.pendingRequests, icon: FileText, color: 'bg-warning-500' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'bg-error-500' },
  ]

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    approved: 'Aprovado',
    rejected: 'Rejeitado',
    completed: 'Concluído',
  }

  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Dashboard</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-2xl border border-neutral-200 p-5">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent requests */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-neutral-400" />
            <h3 className="font-semibold text-neutral-900">Solicitações Recentes</h3>
          </div>
          {recentRequests.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4">Nenhuma solicitação</p>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{req.profiles?.name ?? '—'}</p>
                    <p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <span className="text-xs text-neutral-600">{req.total_items} itens</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-warning-500" />
            <h3 className="font-semibold text-neutral-900">Estoque Baixo</h3>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-neutral-400 py-4">Todos os produtos com estoque adequado</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">{p.name}</p>
                    <p className="text-xs text-neutral-500">SKU: {p.sku}</p>
                  </div>
                  <span className="text-sm font-semibold text-error-600">{p.stock_quantity} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
