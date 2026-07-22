import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, Building2, FileText, AlertTriangle, TrendingUp, CheckCircle, XCircle, Truck, ArrowUp, ArrowDown, Clock, ArrowLeftRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'

const EBD_RED = '#C8102E'
const COLORS = ['#C8102E', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, pending: 0, approved: 0, rejected: 0, delivered: 0, lowStock: 0, zeroStock: 0, industries: 0 })
  const [recentRequests, setRecentRequests] = useState<any[]>([])
  const [recentMovements, setRecentMovements] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [industryData, setIndustryData] = useState<any[]>([])
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    const [prods, inds, pending, approved, rejected, delivered, lowStock, zeroStock, recent, movements, industries, productsAll] = await Promise.all([
      supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('industries').select('*', { count: 'exact', head: true }).eq('active', true),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
      supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('products').select('name, sku, stock_quantity, min_stock, unit').eq('active', true).lt('stock_quantity', 10),
      supabase.from('products').select('name, sku, stock_quantity, unit').eq('active', true).eq('stock_quantity', 0),
      supabase.from('requests').select(`id, status, total_items, created_at, profiles ( name )`).order('created_at', { ascending: false }).limit(6),
      supabase.from('movements').select(`id, type, quantity, created_at, products ( name ), profiles ( name )`).order('created_at', { ascending: false }).limit(6),
      supabase.from('industries').select('id, name'),
      supabase.from('products').select('id, name, industry_id'),
    ])

    setStats({
      products: prods.count ?? 0, pending: pending.count ?? 0, approved: approved.count ?? 0,
      rejected: rejected.count ?? 0, delivered: delivered.count ?? 0,
      lowStock: lowStock.data?.length ?? 0, zeroStock: zeroStock.data?.length ?? 0,
      industries: inds.count ?? 0,
    })
    setRecentRequests(recent.data ?? [])
    setRecentMovements(movements.data ?? [])
    setLowStockProducts((lowStock.data ?? []).slice(0, 6))

    // Industry distribution
    if (industries.data && productsAll.data) {
      const dist = industries.data.map((ind: any) => ({
        name: ind.name.trim(),
        produtos: productsAll.data.filter((p: any) => p.industry_id === ind.id).length,
      })).filter((d: any) => d.produtos > 0)
      setIndustryData(dist)
    }

    // Monthly mock data
    setMonthlyData([
      { mes: 'Jan', entradas: 45, saidas: 32 },
      { mes: 'Fev', entradas: 52, saidas: 38 },
      { mes: 'Mar', entradas: 48, saidas: 41 },
      { mes: 'Abr', entradas: 61, saidas: 55 },
      { mes: 'Mai', entradas: 58, saidas: 47 },
      { mes: 'Jun', entradas: 67, saidas: 59 },
      { mes: 'Jul', entradas: 73, saidas: 62 },
    ])
  }

  const cards = [
    { label: 'Total de Produtos', value: stats.products, icon: Package, color: 'gradient-ebd', textColor: 'text-white' },
    { label: 'Industrias', value: stats.industries, icon: Building2, color: 'bg-neutral-700', textColor: 'text-white' },
    { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'bg-warning-500', textColor: 'text-white' },
    { label: 'Aprovadas', value: stats.approved, icon: CheckCircle, color: 'bg-success-600', textColor: 'text-white' },
    { label: 'Negadas', value: stats.rejected, icon: XCircle, color: 'bg-error-500', textColor: 'text-white' },
    { label: 'Entregues', value: stats.delivered, icon: Truck, color: 'bg-ebd-600', textColor: 'text-white' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'bg-warning-500', textColor: 'text-white' },
    { label: 'Zerados', value: stats.zeroStock, icon: AlertTriangle, color: 'bg-error-500', textColor: 'text-white' },
  ]

  const statusLabels: Record<string, string> = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Negada', completed: 'Entregue' }
  const statusColors: Record<string, string> = { pending: 'text-warning-700 bg-warning-100', approved: 'text-success-700 bg-success-100', rejected: 'text-error-700 bg-error-100', completed: 'text-ebd-700 bg-ebd-100' }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={card.label} className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-card animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.textColor}`} />
            </div>
            <p className="text-2xl font-bold text-neutral-900">{card.value}</p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-ebd-700" /><h3 className="font-semibold text-neutral-900">Entradas x Saidas</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
              <Line type="monotone" dataKey="entradas" stroke={EBD_RED} strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="saidas" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><Building2 className="w-5 h-5 text-ebd-700" /><h3 className="font-semibold text-neutral-900">Produtos por Industria</h3></div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={industryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '13px' }} />
              <Bar dataKey="produtos" fill={EBD_RED} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><FileText className="w-5 h-5 text-ebd-700" /><h3 className="font-semibold text-neutral-900">Ultimas Solicitacoes</h3></div>
          {recentRequests.length === 0 ? <p className="text-sm text-neutral-400 py-4">Nenhuma solicitacao</p> : (
            <div className="space-y-2">
              {recentRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ebd-100 flex items-center justify-center text-xs font-semibold text-ebd-700">{req.profiles?.name?.charAt(0).toUpperCase() ?? '?'}</div>
                    <div><p className="text-sm font-medium text-neutral-900">{req.profiles?.name ?? '—'}</p><p className="text-xs text-neutral-500">{new Date(req.created_at).toLocaleDateString('pt-BR')} · {req.total_items} itens</p></div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[req.status] ?? statusColors.pending}`}>{statusLabels[req.status] ?? req.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-warning-500" /><h3 className="font-semibold text-neutral-900">Estoque Baixo</h3></div>
          {lowStockProducts.length === 0 ? <p className="text-sm text-neutral-400 py-4">Todos os produtos com estoque adequado</p> : (
            <div className="space-y-2">
              {lowStockProducts.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                  <div><p className="text-sm font-medium text-neutral-900">{p.name}</p><p className="text-xs text-neutral-500">Codigo: {p.sku}</p></div>
                  <span className={`text-sm font-semibold ${p.stock_quantity === 0 ? 'text-error-600' : 'text-warning-600'}`}>{p.stock_quantity} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Movements */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4"><ArrowLeftRight className="w-5 h-5 text-ebd-700" /><h3 className="font-semibold text-neutral-900">Ultimas Movimentacoes</h3></div>
        {recentMovements.length === 0 ? <p className="text-sm text-neutral-400 py-4">Nenhuma movimentacao</p> : (
          <div className="space-y-2">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.type === 'in' ? 'bg-success-100' : 'bg-error-100'}`}>
                    {m.type === 'in' ? <ArrowUp className="w-4 h-4 text-success-600" /> : <ArrowDown className="w-4 h-4 text-error-600" />}
                  </div>
                  <div><p className="text-sm font-medium text-neutral-900">{m.products?.name ?? '—'}</p><p className="text-xs text-neutral-500">{m.profiles?.name ?? '—'} · {new Date(m.created_at).toLocaleDateString('pt-BR')}</p></div>
                </div>
                <span className={`text-sm font-semibold ${m.type === 'in' ? 'text-success-600' : 'text-error-600'}`}>{m.type === 'in' ? '+' : '-'}{m.quantity}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
