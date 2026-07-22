import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { Industry } from '../lib/types';

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingIndustry, setEditingIndustry] = useState<Industry | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    logo_url: '',
  });

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .order('name');
      if (error) throw error;
      setIndustries(data ?? []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar indústrias';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (): void => {
    setEditingIndustry(null);
    setFormData({
      name: '',
      cnpj: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      address: '',
      logo_url: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (industry: Industry): void => {
    setEditingIndustry(industry);
    setFormData({
      name: industry.name,
      cnpj: industry.cnpj ?? '',
      contact_name: industry.contact_name ?? '',
      contact_email: industry.contact_email ?? '',
      contact_phone: industry.contact_phone ?? '',
      address: industry.address ?? '',
      logo_url: industry.logo_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        cnpj: formData.cnpj || null,
        contact_name: formData.contact_name || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address: formData.address || null,
        logo_url: formData.logo_url || null,
      };

      if (editingIndustry) {
        const { error } = await supabase
          .from('industries')
          .update(payload)
          .eq('id', editingIndustry.id);
        if (error) throw error;
        toast.success('Indústria atualizada com sucesso');
      } else {
        const { error } = await supabase.from('industries').insert(payload);
        if (error) throw error;
        toast.success('Indústria criada com sucesso');
      }
      setModalOpen(false);
      fetchIndustries();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar indústria';
      toast.error(message);
    }
  };

  const handleDelete = async (industry: Industry): Promise<void> => {
    if (!confirm(`Desativar a indústria "${industry.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('industries')
        .update({ active: false })
        .eq('id', industry.id);
      if (error) throw error;
      toast.success('Indústria desativada');
      fetchIndustries();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao desativar indústria';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Indústrias</h1>
          <p className="text-dark-400 mt-1">Gerenciar indústrias parceiras</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Nova Indústria
        </button>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : industries.length === 0 ? (
        <div className="text-center py-12 text-dark-400">Nenhuma indústria encontrada</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((industry: Industry) => (
            <div
              key={industry.id}
              className="bg-dark-800 border border-dark-700 rounded-xl p-5 hover:border-dark-600 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center">
                    <Building2 className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{industry.name}</h3>
                    {industry.cnpj && (
                      <p className="text-dark-400 text-sm">CNPJ: {industry.cnpj}</p>
                    )}
                  </div>
                </div>
                <Badge variant={industry.active ? 'success' : 'default'}>
                  {industry.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm">
                {industry.contact_name && (
                  <p className="text-dark-300">Contato: {industry.contact_name}</p>
                )}
                {industry.contact_email && (
                  <p className="text-dark-300">Email: {industry.contact_email}</p>
                )}
                {industry.contact_phone && (
                  <p className="text-dark-300">Telefone: {industry.contact_phone}</p>
                )}
                {industry.address && (
                  <p className="text-dark-300">Endereço: {industry.address}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-dark-700">
                <button
                  onClick={() => handleOpenEdit(industry)}
                  className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(industry)}
                  className="p-2 text-dark-300 hover:text-error-500 hover:bg-dark-700 rounded-lg transition-colors"
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
        title={editingIndustry ? 'Editar Indústria' : 'Nova Indústria'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">CNPJ</label>
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, cnpj: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-300 text-sm mb-1">Nome do Contato</label>
              <input
                type="text"
                value={formData.contact_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, contact_name: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-sm mb-1">Telefone</label>
              <input
                type="text"
                value={formData.contact_phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, contact_phone: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Email do Contato</label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, contact_email: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Endereço</label>
            <textarea
              value={formData.address}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, address: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingIndustry ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
