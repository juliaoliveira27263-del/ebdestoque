import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import type { Profile, UserRole } from '../lib/types';
import { roleLabels } from '../lib/types';

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  city: string;
}

const emptyForm: UserFormData = {
  name: '',
  email: '',
  role: 'vendedor',
  phone: '',
  city: '',
};

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers((data as Profile[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(user: Profile) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: '',
      role: user.role,
      phone: user.phone ?? '',
      city: user.city ?? '',
    });
    setModalOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        // Edit existing user - update profile
        const payload = {
          name: form.name,
          role: form.role,
          phone: form.phone || null,
          city: form.city || null,
        };
        const { error } = await supabase.from('profiles').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Usuário atualizado com sucesso');
      } else {
        // Create new user via edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token ?? ''}`,
            },
            body: JSON.stringify({
              name: form.name,
              email: form.email,
              role: form.role,
              phone: form.phone,
              city: form.city,
            }),
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(errData.error ?? 'Erro ao criar usuário');
        }

        toast.success('Usuário criado com sucesso');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(user: Profile) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !user.active })
        .eq('id', user.id);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u)),
      );
      toast.success(user.active ? 'Usuário desativado' : 'Usuário ativado');
    } catch (error) {
      console.error('Error toggling user active:', error);
      toast.error('Erro ao atualizar usuário');
    }
  }

  function badgeVariant(role: UserRole): 'default' | 'success' | 'warning' | 'error' | 'info' {
    switch (role) {
      case 'admin':
        return 'error';
      case 'supervisor':
        return 'warning';
      case 'promotor':
        return 'info';
      case 'vendedor':
        return 'default';
      default:
        return 'default';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-dark-400 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={18} /> Novo usuário
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dark-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-950 border-b border-dark-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Perfil</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Telefone</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Cidade</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-dark-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-400">
                      <UsersIcon size={32} className="mx-auto mb-2 text-dark-600" />
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-dark-950">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-dark-800 flex items-center justify-center text-dark-400 text-sm font-bold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' && <Shield size={14} className="text-red-400" />}
                          <Badge variant={badgeVariant(user.role as UserRole)}>
                            {roleLabels[user.role as UserRole]}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-dark-400">{user.phone ?? '-'}</td>
                      <td className="px-4 py-3 text-dark-400">{user.city ?? '-'}</td>
                      <td className="px-4 py-3">
                        {user.active ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="error">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(user)}
                            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => toggleActive(user)}
                            className="p-2 text-dark-400 hover:text-amber-400 hover:bg-dark-800 rounded transition"
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
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar usuário' : 'Novo usuário'}
        maxWidth="lg"
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
          {!editingId && (
            <div>
              <label className="block text-sm text-dark-400 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-dark-400 mb-1">Perfil *</label>
            <select
              name="role"
              required
              value={form.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Telefone</label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Cidade</label>
            <input
              type="text"
              name="city"
              value={form.city}
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
