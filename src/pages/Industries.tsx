import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import type { Industry } from '../lib/types';

interface IndustryFormData {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  logo_url: string;
}

const emptyForm: IndustryFormData = {
  name: '',
  cnpj: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  logo_url: '',
};

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<IndustryFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchIndustries();
  }, []);

  async function fetchIndustries() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setIndustries((data as Industry[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching industries:', error);
      toast.error('Erro ao carregar indústrias');
    } finally {
      setLoading(false);
    }
  }

  const filtered = industries.filter((ind) =>
    ind.name.toLowerCase().includes(search.toLowerCase()) ||
    (ind.cnpj ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(industry: Industry) {
    setEditingId(industry.id);
    setForm({
      name: industry.name,
      cnpj: industry.cnpj ?? '',
      contact_name: industry.contact_name ?? '',
      contact_email: industry.contact_email ?? '',
      contact_phone: industry.contact_phone ?? '',
      address: industry.address ?? '',
      logo_url: industry.logo_url ?? '',
    });
    setModalOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        cnpj: form.cnpj || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        address: form.address || null,
        logo_url: form.logo_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from('industries').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Indústria atualizada com sucesso');
      } else {
        const { error } = await supabase.from('industries').insert(payload);
        if (error) throw error;
        toast.success('Indústria criada com sucesso');
      }
      setModalOpen(false);
      fetchIndustries();
    } catch (error) {
      console.error('Error saving industry:', error);
      toast.error('Erro ao salvar indústria');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(industry: Industry) {
    if (!confirm(`Desativar a indústria "${industry.name}"?`)) return;
    try {
      const { error } = await supabase.from('industries').update({ active: false }).eq('id', industry.id);
      if (error) throw error;
      toast.success('Indústria desativada');
      fetchIndustries();
    } catch (error) {
      console.error('Error deleting industry:', error);
      toast.error('Erro ao desativar indústria');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Indústrias</h1>
          <p className="text-dark-400 mt-1">Gerencie as indústrias parceiras</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={18} /> Nova indústria
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou CNPJ..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Card grid */}
      {loading ? (
        <div className="text-center py-8 text-dark-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-dark-400">Nenhuma indústria encontrada</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((industry) => (
            <div
              key={industry.id}
              className="bg-dark-900 border border-dark-800 rounded-lg p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {industry.logo_url ? (
                    <img
                      src={industry.logo_url}
                      alt={industry.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 text-lg font-bold">
                      {industry.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-semibold">{industry.name}</h3>
                    <p className="text-sm text-dark-400">{industry.cnpj ?? 'Sem CNPJ'}</p>
                  </div>
                </div>
                {industry.active ? (
                  <Badge variant="success">Ativo</Badge>
                ) : (
                  <Badge variant="error">Inativo</Badge>
                )}
              </div>

              {(industry.contact_name || industry.contact_email || industry.contact_phone) && (
                <div className="space-y-1 text-sm text-dark-400 border-t border-dark-800 pt-3">
                  {industry.contact_name && <p>Contato: {industry.contact_name}</p>}
                  {industry.contact_email && <p>Email: {industry.contact_email}</p>}
                  {industry.contact_phone && <p>Telefone: {industry.contact_phone}</p>}
                </div>
              )}

              {industry.address && (
                <p className="text-sm text-dark-400 border-t border-dark-800 pt-3">
                  {industry.address}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t border-dark-800 pt-3">
                <button
                  onClick={() => openEdit(industry)}
                  className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded transition"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(industry)}
                  className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar indústria' : 'Nova indústria'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Nome *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              value={form.cnpj}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Nome do contato</label>
              <input
                type="text"
                name="contact_name"
                value={form.contact_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Email do contato</label>
              <input
                type="email"
                name="contact_email"
                value={form.contact_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Telefone do contato</label>
            <input
              type="text"
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Endereço</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">URL do logo</label>
            <input
              type="text"
              name="logo_url"
              value={form.logo_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
