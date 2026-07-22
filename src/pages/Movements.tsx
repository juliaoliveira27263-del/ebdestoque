import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Sliders, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Movement, Product, Profile } from '../lib/types';
import Badge from '../components/Badge';
import { exportToCSV } from '../lib/csv';
import { toast } from 'sonner';

interface MovementWithDetails extends Movement {
  product_name?: string;
  user_name?: string;
}

export default function Movements() {
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({ product_id: '', type: 'in', quantity: 0, reason: '' });
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: movementsData }, { data: productsData }] = await Promise.all([
      supabase.from('movements').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('products').select('*').eq('active', true).order('name'),
    ]);
    const moveList = (movementsData as Movement[] | null) ?? [];
    setProducts((productsData as Product[] | null) ?? []);

    const productIds = [...new Set(moveList.map(m => m.product_id))];
    const userIds = [...new Set(moveList.map(m => m.user_id).filter(Boolean) as string[])];

    const [{ data: prods }, { data: profiles }] = await Promise.all([
      supabase.from('products').select('id, name').in('id', productIds),
      userIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', userIds) : Promise.resolve({ data: null }),
    ]);

    const productMap = new Map<string, string>();
    (prods as Product[] | null)?.forEach(p => productMap.set(p.id, p.name));
    const profileMap = new Map<string, string>();
    (profiles as Profile[] | null)?.forEach(p => profileMap.set(p.id, p.name));

    const enriched = moveList.map(m => ({
      ...m,
      product_name: productMap.get(m.product_id) ?? 'Desconhecido',
      user_name: m.user_id ? (profileMap.get(m.user_id) ?? 'Desconhecido') : undefined,
    }));
    setMovements(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.product_id || form.quantity <= 0) return;
    const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', form.product_id).single();
    const currentStock = (product as Product | null)?.stock_quantity ?? 0;
    let newStock = currentStock;
    if (form.type === 'in') newStock = currentStock + Number(form.quantity);
    else if (form.type === 'out') {
      newStock = currentStock - Number(form.quantity);
      if (newStock < 0) { toast.error('Estoque insuficiente.'); return; }
    } else newStock = Number(form.quantity);

    await supabase.from('products').update({ stock_quantity: newStock }).eq('id', form.product_id);
    await supabase.from('movements').insert({
      product_id: form.product_id, type: form.type, quantity: Number(form.quantity),
      reason: form.reason || null,
    });
    toast.success('Movimentação registrada!');
    setModalOpen(false);
    setForm({ product_id: '', type: 'in', quantity: 0, reason: '' });
    fetchData();
  };

  const filtered = movements.filter(m => {
    const matchSearch = m.product_name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchType = typeFilter === 'all' || m.type === typeFilter;
    return matchSearch && matchType;
  });

  const handleExport = () => {
    exportToCSV('movimentacoes.csv', ['Produto', 'Tipo', 'Quantidade', 'Motivo', 'Usuário', 'Data'],
      filtered.map(m => [m.product_name ?? '', m.type, m.quantity, m.reason ?? '', m.user_name ?? '', new Date(m.created_at).toLocaleDateString('pt-BR')]));
  };

  const typeIcon = (type: string) => {
    if (type === 'in') return <ArrowDown size={16} className="text-success-500" />;
    if (type === 'out') return <ArrowUp size={16} className="text-error-500" />;
    return <Sliders size={16} className="text-blue-400" />;
  };

  const typeLabel = (type: string) => type === 'in' ? 'Entrada' : type === 'out' ? 'Saída' : 'Ajuste';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Movimentações</h1>
          <p className="text-dark-400 text-sm mt-1">Histórico de entradas e saídas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
            Exportar CSV
          </button>
          <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
            Nova Movimentação
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por produto..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900 border border-dark-800 text-white outline-none focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-800 text-white outline-none focus:border-primary">
          <option value="all">Todos</option>
          <option value="in">Entradas</option>
          <option value="out">Saídas</option>
          <option value="adjustment">Ajustes</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Sliders size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhuma movimentação encontrada</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-900 border border-dark-800 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Produto</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Tipo</th>
                <th className="text-right p-4 text-dark-300 text-sm font-semibold">Qtd</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Motivo</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Usuário</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50">
                  <td className="p-4 text-white text-sm">{m.product_name}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {typeIcon(m.type)}
                      <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'error' : 'info'}>
                        {typeLabel(m.type)}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-4 text-right text-white text-sm font-medium">{m.quantity}</td>
                  <td className="p-4 text-dark-300 text-sm">{m.reason ?? '-'}</td>
                  <td className="p-4 text-dark-300 text-sm">{m.user_name ?? '-'}</td>
                  <td className="p-4 text-dark-300 text-sm">{new Date(m.created_at).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative w-full max-w-md bg-dark-900 rounded-2xl shadow-2xl border border-dark-800 animate-scale-in">
            <div className="p-5 border-b border-dark-800">
              <h2 className="text-lg font-bold text-white">Nova Movimentação</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Produto *</label>
                <select value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary">
                  <option value="">Selecione...</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock_quantity})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Tipo *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary">
                  <option value="in">Entrada</option>
                  <option value="out">Saída</option>
                  <option value="adjustment">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Quantidade *</label>
                <input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} min={1} required
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Motivo</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-dark-800 text-white font-medium hover:bg-dark-700 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
