import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Industry } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [name, setName] = useState('');

  async function fetchData() {
    const { data } = await supabase.from('industries').select('*').order('name');
    setIndustries((data as Industry[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setName('');
    setModalOpen(true);
  }

  function openEdit(i: Industry) {
    setEditing(i);
    setName(i.name);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('industries').update({ name }).eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success('Indústria atualizada');
    } else {
      const { error } = await supabase.from('industries').insert({ name, active: true });
      if (error) toast.error(error.message);
      else toast.success('Indústria criada');
    }
    setModalOpen(false);
    fetchData();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('industries').update({ active: false }).eq('id', id);
    if (error) toast.error(error.message);
    else toast.success('Indústria removida');
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
        <h1 className="text-2xl font-bold text-slate-900">Indústrias</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Nova Indústria
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {industries.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">{i.name}</td>
                <td className="px-4 py-3">
                  {i.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="error">Inativo</Badge>}
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(i)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(i.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Indústria' : 'Nova Indústria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-700 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
