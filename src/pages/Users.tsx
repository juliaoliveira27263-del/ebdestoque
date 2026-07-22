import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../lib/types';
import { roleLabels } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [form, setForm] = useState<{ name: string; role: UserRole; phone: string; email: string; password: string }>({
    name: '', role: 'vendedor', phone: '', email: '', password: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', role: 'vendedor', phone: '', email: '', password: '' });
    setModalOpen(true);
  };

  const openEdit = (user: Profile) => {
    setEditing(user);
    setForm({ name: user.name, role: user.role, phone: user.phone ?? '', email: '', password: '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('profiles').update({
        name: form.name, role: form.role, phone: form.phone || null,
      }).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Usuário atualizado!');
    } else {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { toast.error('Sessão expirada'); return; }

      const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          name: form.name,
          role: form.role,
          phone: form.phone,
        }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro ao criar usuário' }));
        toast.error(err.error || 'Erro ao criar usuário');
        return;
      }
      toast.success('Usuário criado!');
    }
    setModalOpen(false);
    fetchUsers();
  };

  const handleToggleActive = async (user: Profile) => {
    await supabase.from('profiles').update({ active: !user.active }).eq('id', user.id);
    toast.success(user.active ? 'Usuário desativado' : 'Usuário ativado');
    fetchUsers();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Usuários</h1>
          <p className="text-dark-400 text-sm mt-1">Gerenciar usuários do sistema</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhum usuário encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-900 border border-dark-800 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Nome</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Cargo</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Telefone</th>
                <th className="text-center p-4 text-dark-300 text-sm font-semibold">Status</th>
                <th className="text-right p-4 text-dark-300 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{user.name.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-dark-400" />
                      <Badge variant={user.role === 'admin' ? 'error' : 'info'}>{roleLabels[user.role]}</Badge>
                    </div>
                  </td>
                  <td className="p-4 text-dark-300 text-sm">{user.phone ?? '-'}</td>
                  <td className="p-4 text-center">
                    <Badge variant={user.active ? 'success' : 'default'}>{user.active ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-white transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleToggleActive(user)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-warning-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          {!editing && (
            <>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-1.5">Senha *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Cargo *</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary">
              <option value="vendedor">Vendedor</option>
              <option value="promotor">Promotor</option>
              <option value="supervisor">Supervisor</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Telefone</label>
            <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
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
