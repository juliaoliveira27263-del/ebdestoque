import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { Profile, UserRole, roleLabels } from '../lib/types';

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'vendedor' as UserRole,
    phone: '',
    city: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw error;
      setUsers(data ?? []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar usuários';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = (): void => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'vendedor',
      phone: '',
      city: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: Profile): void => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: '',
      role: user.role,
      phone: user.phone ?? '',
      city: user.city ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update({
            name: formData.name,
            role: formData.role,
            phone: formData.phone || null,
            city: formData.city || null,
          })
          .eq('id', editingUser.id);
        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Create user via edge function
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            phone: formData.phone || null,
            city: formData.city || null,
          }),
        });

        const result = await response.json() as { error?: string };
        if (!response.ok) {
          throw new Error(result.error ?? 'Erro ao criar usuário');
        }
        toast.success('Usuário criado com sucesso');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar usuário';
      toast.error(message);
    }
  };

  const handleToggleActive = async (user: Profile): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !user.active })
        .eq('id', user.id);
      if (error) throw error;
      toast.success(user.active ? 'Usuário desativado' : 'Usuário ativado');
      fetchUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
      toast.error(message);
    }
  };

  const roleVariant = (role: UserRole): 'info' | 'success' | 'warning' | 'default' => {
    if (role === 'admin') return 'info';
    if (role === 'supervisor') return 'success';
    if (role === 'promotor') return 'warning';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-dark-400 mt-1">Gerenciar usuários do sistema</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          Novo Usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left p-4 text-dark-300 font-semibold">Nome</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Telefone</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Cidade</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Perfil</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Status</th>
                <th className="text-right p-4 text-dark-300 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Carregando...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Nenhum usuário encontrado
                  </td>
                </tr>
              ) : (
                users.map((user: Profile) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center">
                          {user.role === 'admin' ? (
                            <Shield className="text-blue-400" size={16} />
                          ) : (
                            <UsersIcon className="text-dark-400" size={16} />
                          )}
                        </div>
                        <span className="text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-dark-300">{user.phone ?? '-'}</td>
                    <td className="p-4 text-dark-300">{user.city ?? '-'}</td>
                    <td className="p-4">
                      <Badge variant={roleVariant(user.role)}>
                        {roleLabels[user.role]}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.active ? 'success' : 'default'}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-2 text-dark-300 hover:text-warning-500 hover:bg-dark-700 rounded-lg transition-colors"
                          title={user.active ? 'Desativar' : 'Ativar'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        maxWidth="max-w-md"
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
          {!editingUser && (
            <div>
              <label className="block text-dark-300 text-sm mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-dark-300 text-sm mb-1">Perfil *</label>
            <select
              value={formData.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, role: e.target.value as UserRole })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((role: UserRole) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Telefone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Cidade</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, city: e.target.value })
              }
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
              {editingUser ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
