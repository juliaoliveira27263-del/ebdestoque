import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Movement, Product, MovementType } from '../lib/types';
import { movementTypeLabels } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

export default function Movements() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { session } = useAuth();

  const [form, setForm] = useState({
    product_id: '',
    type: 'in' as MovementType,
    quantity: 0,
    reason: '',
  });

  async function fetchData() {
    const [{ data: movData }, { data: prodData }] = await Promise.all([
      supabase.from('movements').select('*, products(name, sku)').order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('active', true),
    ]);
    setMovements((movData as Movement[]) || []);
    setProducts((prodData as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error: movError } = await supabase.from('movements').insert({
      ...form,
      user_id: session?.user?.id,
    });
    if (movError) {
      toast.error(movError.message);
      return;
    }

    const product = products.find((p) => p.id === form.product_id);
    if (product) {
      const delta = form.type === 'in' ? form.quantity : form.type === 'out' ? -form.quantity : 0;
      const newQty = form.type === 'adjustment' ? form.quantity : product.quantity + delta;
      const { error: prodError } = await supabase
        .from('products')
        .update({ quantity: newQty })
        .eq('id', form.product_id);
      if (prodError) toast.error(prodError.message);
    }

    toast.success('Movimentação registrada');
    setModalOpen(false);
    setForm({ product_id: '', type: 'in', quantity: 0, reason: '' });
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Movimentações</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova Movimentação
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Produto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Tipo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Qtd</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Motivo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">
                  {m.products?.name || 'N/A'}
                  <span className="text-slate-400 ml-2">{m.products?.sku}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={m.type === 'in' ? 'success' : m.type === 'out' ? 'error' : 'warning'}>
                    {movementTypeLabels[m.type]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">{m.quantity}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{m.reason}</td>
                <td className="px-4 py-3 text-sm text-slate-500">
                  {new Date(m.created_at).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Movimentação">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Produto</label>
            <select
              value={form.product_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, product_id: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Tipo</label>
            <select
              value={form.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, type: e.target.value as MovementType })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="in">Entrada</option>
              <option value="out">Saída</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Quantidade</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Motivo</label>
            <input
              type="text"
              value={form.reason}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, reason: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            Registrar
          </button>
        </form>
      </Modal>
    </div>
  );
}
