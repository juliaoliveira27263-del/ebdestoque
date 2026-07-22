import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Request as Req, Product, RequestStatus } from '../lib/types';
import { statusLabels } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

export default function Requests() {
  const [requests, setRequests] = useState<Req[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { isAdmin, session } = useAuth();

  const [form, setForm] = useState({
    product_id: '',
    quantity: 1,
    notes: '',
  });

  async function fetchData() {
    const { data } = await supabase
      .from('requests')
      .select('*, products(name, sku), profiles(name)')
      .order('created_at', { ascending: false });
    setRequests((data as Req[]) || []);

    const { data: prodData } = await supabase.from('products').select('*').eq('active', true);
    setProducts((prodData as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const { error } = await supabase.from('requests').insert({
      ...form,
      status: 'pending' as RequestStatus,
      user_id: session?.user?.id,
    });
    if (error) toast.error(error.message);
    else toast.success('Solicitação criada');
    setModalOpen(false);
    setForm({ product_id: '', quantity: 1, notes: '' });
    fetchData();
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const { error } = await supabase.from('requests').update({ status }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Status atualizado');
    fetchData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  const badgeVariant = (status: RequestStatus): 'default' | 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'info';
      case 'rejected': return 'error';
      case 'fulfilled': return 'success';
      default: return 'default';
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Solicitações</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova Solicitação
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Produto</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Qtd</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Solicitante</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Notas</th>
              {isAdmin && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">
                  {r.products?.name || 'N/A'}
                  <span className="text-slate-400 ml-2">{r.products?.sku}</span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">{r.quantity}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.profiles?.name || 'N/A'}</td>
                <td className="px-4 py-3">
                  <Badge variant={badgeVariant(r.status)}>{statusLabels[r.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{r.notes}</td>
                {isAdmin && (
                  <td className="px-4 py-3 flex gap-2 justify-end">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(r.id, 'approved')} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => updateStatus(r.id, 'rejected')} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => updateStatus(r.id, 'fulfilled')} className="p-1.5 rounded-lg hover:bg-green-100 text-green-600">
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Solicitação">
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
            <label className="block text-sm text-slate-700 mb-1">Quantidade</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, quantity: Number(e.target.value) })}
              required
              min={1}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Notas</label>
            <textarea
              value={form.notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            Solicitar
          </button>
        </form>
      </Modal>
    </div>
  );
}
