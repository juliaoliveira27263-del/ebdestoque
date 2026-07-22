import { useEffect, useState } from 'react';
import { Package, AlertTriangle, TrendingUp, FileText, Building2, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase } from '../lib/supabase';
import { Product, Industry, Request as RequestType } from '../lib/types';
import Badge from '../components/Badge';

interface Stats {
  totalProducts: number;
  lowStock: number;
  totalIndustries: number;
  pendingRequests: number;
  totalUsers: number;
  totalStockValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, lowStock: 0, totalIndustries: 0, pendingRequests: 0, totalUsers: 0, totalStockValue: 0,
  });
  const [recentRequests, setRecentRequests] = useState<RequestType[]>([]);
  const [stockByIndustry, setStockByIndustry] = useState<{ name: string; quantidade: number }[]>([]);
  const [stockStatus, setStockStatus] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ count: productCount }, { count: industryCount }, { count: userCount }, { data: products }, { data: requests }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('industries').select('*', { count: 'exact', head: true }).eq('active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('stock_quantity, min_stock, industry_id'),
        supabase.from('requests').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      const productList = products as Product[] | null;
      const lowStockCount = productList?.filter(p => p.stock_quantity <= p.min_stock).length ?? 0;
      const pendingCount = (requests as RequestType[] | null)?.filter(r => r.status === 'pending').length ?? 0;

      setStats({
        totalProducts: productCount ?? 0,
        lowStock: lowStockCount,
        totalIndustries: industryCount ?? 0,
        pendingRequests: pendingCount,
        totalUsers: userCount ?? 0,
        totalStockValue: productList?.reduce((sum, p) => sum + p.stock_quantity, 0) ?? 0,
      });
      setRecentRequests((requests as RequestType[] | null) ?? []);

      const { data: industries } = await supabase.from('industries').select('id, name');
      const industryList = (industries as Industry[] | null) ?? [];
      const byIndustry = industryList.map(ind => {
        const total = productList?.filter(p => p.industry_id === ind.id).reduce((sum, p) => sum + p.stock_quantity, 0) ?? 0;
        return { name: ind.name, quantidade: total };
      }).filter(item => item.quantidade > 0);
      setStockByIndustry(byIndustry);

      const inStock = productList?.filter(p => p.stock_quantity > p.min_stock).length ?? 0;
      const low = productList?.filter(p => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock).length ?? 0;
      const out = productList?.filter(p => p.stock_quantity === 0).length ?? 0;
      setStockStatus([
        { name: 'Em estoque', value: inStock, color: '#16a34a' },
        { name: 'Estoque baixo', value: low, color: '#f59e0b' },
        { name: 'Sem estoque', value: out, color: '#dc2626' },
      ]);
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Total de Produtos', value: stats.totalProducts, icon: Package, color: 'text-blue-400' },
    { label: 'Estoque Baixo', value: stats.lowStock, icon: AlertTriangle, color: 'text-warning-500' },
    { label: 'Indústrias', value: stats.totalIndustries, icon: Building2, color: 'text-purple-400' },
    { label: 'Solicitações Pendentes', value: stats.pendingRequests, icon: FileText, color: 'text-primary' },
    { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'text-green-400' },
    { label: 'Itens em Estoque', value: stats.totalStockValue, icon: TrendingUp, color: 'text-cyan-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-dark-400 text-sm mt-1">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-dark-900 border border-dark-800 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-400 text-sm">{card.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
                </div>
                <Icon size={32} className={card.color} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Estoque por Indústria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stockByIndustry}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
              <YAxis stroke="#71717a" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
              <Bar dataKey="quantidade" fill="#C00000" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Status do Estoque</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={stockStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                {stockStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Solicitações Recentes</h3>
        {recentRequests.length === 0 ? (
          <p className="text-dark-400 text-sm text-center py-8">Nenhuma solicitação encontrada</p>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between py-3 border-b border-dark-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{req.total_items} item(s)</p>
                  <p className="text-dark-400 text-xs">{new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'error'}>
                  {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
