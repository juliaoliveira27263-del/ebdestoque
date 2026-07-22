import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Industry } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [form, setForm] = useState({
    name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', logo_url: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('industries').select('*').order('name');
    setIndustries((data as Industry[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', logo_url: '' });
    setModalOpen(true);
  };

  const openEdit = (ind: Industry) => {
    setEditing(ind);
    setForm({
      name: ind.name, cnpj: ind.cnpj ?? '', contact_name: ind.contact_name ?? '',
      contact_email: ind.contact_email ?? '', contact_phone: ind.contact_phone ?? '',
      address: ind.address ?? '', logo_url: ind.logo_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, cnpj: form.cnpj || null, contact_name: form.contact_name || null,
      contact_email: form.contact_email || null, contact_phone: form.contact_phone || null,
      address: form.address || null, logo_url: form.logo_url || null, active: true,
    };
    if (editing) {
      const { error } = await supabase.from('industries').update(data).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Indústria atualizada!');
    } else {
      const { error } = await supabase.from('industries').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Indústria criada!');
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar esta indústria?')) return;
    const { error } = await supabase.from('industries').update({ active: false }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Indústria desativada!');
    fetchData();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Indústrias</h1>
          <p className="text-dark-400 text-sm mt-1">Gerenciar indústrias fornecedoras</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus size={18} /> Nova Indústria
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : industries.length === 0 ? (
        <div className="text-center py-12">
          <Building2 size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhuma indústria encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((ind) => (
            <div key={ind.id} className="bg-dark-900 border border-dark-800 rounded-xl p-5 hover:border-dark-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {ind.logo_url ? (
                    <img src={ind.logo_url} alt={ind.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center">
                      <Building2 size={24} className="text-dark-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold text-sm">{ind.name}</h3>
                    <p className="text-dark-400 text-xs">{ind.cnpj ?? 'Sem CNPJ'}</p>
                  </div>
                </div>
                <Badge variant={ind.active ? 'success' : 'default'}>{ind.active ? 'Ativa' : 'Inativa'}</Badge>
              </div>
              <div className="space-y-1 text-xs text-dark-400">
                {ind.contact_name && <p>Contato: {ind.contact_name}</p>}
                {ind.contact_email && <p>Email: {ind.contact_email}</p>}
                {ind.contact_phone && <p>Telefone: {ind.contact_phone}</p>}
                {ind.address && <p>Endereço: {ind.address}</p>}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={() => openEdit(ind)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-dark-800 text-white text-sm hover:bg-dark-700 transition-colors">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => handleDelete(ind.id)} className="px-3 py-2 rounded-lg bg-dark-800 text-dark-300 hover:text-error-500 hover:bg-dark-700 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Indústria' : 'Nova Indústria'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">CNPJ</label>
            <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Contato</label>
              <input type="text" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Telefone</label>
              <input type="text" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Email</label>
            <input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Endereço</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">URL do Logo</label>
            <input type="url" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-dark-800 text-white font-medium hover:bg-dark-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors">
              {editing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
