import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Product, Industry } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const { isAdmin } = useAuth();

  const [form, setForm] = useState({
    name: '',
    sku: '',
    industry_id: '',
    quantity: 0,
    min_quantity: 0,
    unit: 'un',
  });

  async function fetchData() {
    const [{ data: prodData }, { data: indData }] = await Promise.all([
      supabase.from('products').select('*, industries(name)').eq('active', true),
      supabase.from('industries').select('*').eq('active', true),
    ]);
    setProducts((prodData as Product[]) || []);
    setIndustries((indData as Industry[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', sku: '', industry_id: '', quantity: 0, min_quantity: 0, unit: 'un' });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      sku: p.sku,
      industry_id: p.industry_id,
      quantity: p.quantity,
      min_quantity: p.min_quantity,
      unit: p.unit,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('products').update(form).eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success('Produto atualizado');
    } else {
      const { error } = await supabase.from('products').insert({ ...form, active: true });
      if (error) toast.error(error.message);
      else toast.success('Produto criado');
    }
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Produto removido');
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
        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">SKU</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Indústria</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Qtd</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Mín</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => {
              const indName = p.industries?.[0]?.name || 'N/A';
              const isLow = p.quantity <= p.min_quantity;
              return (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.sku}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{indName}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{p.quantity} {p.unit}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{p.min_quantity}</td>
                  <td className="px-4 py-3">
                    {isLow ? <Badge variant="warning">Estoque baixo</Badge> : <Badge variant="success">OK</Badge>}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 flex gap-2 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-primary-700">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">SKU</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, sku: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Indústria</label>
            <select
              value={form.industry_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, industry_id: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="">Selecione...</option>
              {industries.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
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
              <label className="block text-sm text-slate-700 mb-1">Mín</label>
              <input
                type="number"
                value={form.min_quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, min_quantity: Number(e.target.value) })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Unidade</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, unit: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
              />
            </div>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
