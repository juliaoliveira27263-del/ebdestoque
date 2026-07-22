import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../lib/types';
import { roleLabels } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { Plus, Pencil, Trash2, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function Users() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'non_admin' as UserRole,
  });

  async function fetchData() {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', email: '', password: '', role: 'non_admin' });
    setModalOpen(true);
  }

  function openEdit(u: Profile) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editing) {
      const { error } = await supabase.from('profiles').update({
        name: form.name,
        role: form.role,
      }).eq('id', editing.id);
      if (error) toast.error(error.message);
      else toast.success('Usuário atualizado');
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Erro ao criar usuário');
      } else {
        toast.success('Usuário criado');
      }
    }
    setModalOpen(false);
    fetchData();
  }

  async function handleToggleActive(u: Profile) {
    const { error } = await supabase.from('profiles').update({ active: !u.active }).eq('id', u.id);
    if (error) toast.error(error.message);
    else toast.success(u.active ? 'Usuário desativado' : 'Usuário ativado');
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
        <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Nome</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">E-mail</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Perfil</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm text-slate-900">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-primary-500" />
                    {u.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'admin' ? 'info' : 'default'}>
                    {roleLabels[u.role as UserRole]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {u.active ? <Badge variant="success">Ativo</Badge> : <Badge variant="error">Inativo</Badge>}
                </td>
                <td className="px-4 py-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleToggleActive(u)} className="p-1.5 rounded-lg hover:bg-red-100 text-primary-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'}>
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
            <label className="block text-sm text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
              required
              disabled={!!editing}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none disabled:bg-slate-100"
            />
          </div>
          {!editing && (
            <div>
              <label className="block text-sm text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={form.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, password: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-slate-700 mb-1">Perfil</label>
            <select
              value={form.role}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, role: e.target.value as UserRole })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-primary-500 focus:outline-none"
            >
              <option value="non_admin">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700">
            {editing ? 'Salvar' : 'Criar'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
