import { useEffect, useState, useMemo } from 'react';
import { ArrowLeftRight, Plus, Search, AlertCircle, ArrowUp, ArrowDown, Sliders } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Movement, Product } from '../lib/types';
import Modal from '../components/Modal';

const typeConfig = {
  in: { label: 'Entrada', icon: ArrowDown, color: 'text-success-500', bg: 'bg-success-500/15' },
  out: { label: 'Saída', icon: ArrowUp, color: 'text-error-500', bg: 'bg-error-500/15' },
  adjustment: { label: 'Ajuste', icon: Sliders, color: 'text-warning-500', bg: 'bg-warning-500/15' },
};

export default function Movements() {
  const { profile } = useAuth();
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ product_id: '', type: 'in' as 'in' | 'out' | 'adjustment', quantity: '1', reason: '' });

  useEffect(() => { fetchData(); }, []);
  const fetchData = async () => { const [m, p] = await Promise.all([supabase.from('movements').select('*, product:products(*), profile:profiles(*)').order('created_at', { ascending: false }), supabase.from('products').select('*, industry:industries(*)').order('name')]); setMovements(m.data as Movement[] ?? []); setProducts(p.data as Product[] ?? []); setLoading(false); };

  const filteredMovements = useMemo(() => { if (!search) return movements; const q = search.toLowerCase(); return movements.filter((m) => m.product?.name?.toLowerCase().includes(q) || m.profile?.name?.toLowerCase().includes(q) || m.reason?.toLowerCase().includes(q)); }, [movements, search]);

  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); setError(null); const product = products.find((p) => p.id === form.product_id); if (!product) { setError('Selecione um produto'); setSubmitting(false); return; } const qty = parseInt(form.quantity); if (qty <= 0) { setError('Quantidade deve ser maior que zero'); setSubmitting(false); return; } try { const { error: movError } = await supabase.from('movements').insert({ product_id: form.product_id, type: form.type, quantity: qty, reason: form.reason || null, user_id: profile?.id ?? null }); if (movError) throw movError; let newStock = product.stock_quantity; if (form.type === 'in') newStock += qty; else if (form.type === 'out') newStock -= qty; else newStock = qty; const { error: prodError } = await supabase.from('products').update({ stock_quantity: Math.max(0, newStock) }).eq('id', form.product_id); if (prodError) throw prodError; setModalOpen(false); setForm({ product_id: '', type: 'in', quantity: '1', reason: '' }); await fetchData(); } catch (err: any) { setError(err.message); } finally { setSubmitting(false); } };

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-white">Movimentações</h1><p className="text-dark-400 text-sm mt-1">{movements.length} movimentação(ões)</p></div><button onClick={() => { setForm({ product_id: '', type: 'in', quantity: '1', reason: '' }); setError(null); setModalOpen(true); }} className="btn-primary"><Plus className="w-5 h-5" />Nova Movimentação</button></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Buscar movimentações..." /></div>
      <div className="space-y-2">
        {filteredMovements.length === 0 ? (<div className="card p-8 text-center"><ArrowLeftRight className="w-12 h-12 text-dark-500 mx-auto mb-3" /><p className="text-dark-400">Nenhuma movimentação encontrada.</p></div>) : (
          filteredMovements.map((mov) => { const TypeIcon = typeConfig[mov.type].icon; return (
            <div key={mov.id} className="card p-3 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${typeConfig[mov.type].bg}`}><TypeIcon className={`w-5 h-5 ${typeConfig[mov.type].color}`} /></div>
              <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{mov.product?.name ?? 'Produto'}</p><div className="flex items-center gap-2 text-xs text-dark-400 mt-0.5"><span className={typeConfig[mov.type].color}>{typeConfig[mov.type].label}</span>{mov.profile && <span>· {mov.profile.name}</span>}<span>· {new Date(mov.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>{mov.reason && <p className="text-dark-400 text-xs mt-1 truncate">{mov.reason}</p>}</div>
              <div className="text-right shrink-0"><span className={`text-lg font-bold ${typeConfig[mov.type].color}`}>{mov.type === 'in' ? '+' : mov.type === 'out' ? '−' : '='}{mov.quantity}</span><p className="text-dark-400 text-xs">{mov.product?.unit ?? 'un'}</p></div>
            </div>
          ); })
        )}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Movimentação" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Produto *</label><select value={form.product_id} onChange={(e) => setForm((p) => ({ ...p, product_id: e.target.value }))} className="input" required><option value="">Selecione...</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} (Estoque: {p.stock_quantity} {p.unit})</option>)}</select></div>
          <div><label className="label">Tipo *</label><select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as any }))} className="input" required><option value="in">Entrada</option><option value="out">Saída</option><option value="adjustment">Ajuste de Estoque</option></select></div>
          <div><label className="label">{form.type === 'adjustment' ? 'Nova Quantidade *' : 'Quantidade *'}</label><input type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="input" required min="1" /></div>
          <div><label className="label">Motivo / Observação</label><textarea value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className="input min-h-[60px] resize-y" rows={2} /></div>
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2"><button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Registrar'}</button><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button></div>
        </form>
      </Modal>
    </div>
  );
}
