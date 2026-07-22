import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, AlertCircle, UserCheck, UserX, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Profile, UserRole } from '../lib/types';
import Modal from '../components/Modal';

const roleLabels: Record<UserRole, string> = { admin: 'Administrador', supervisor: 'Supervisor', vendedor: 'Vendedor', promotor: 'Promotor' };
const roleBadges: Record<UserRole, string> = { admin: 'badge-primary', supervisor: 'badge-warning', vendedor: 'badge-success', promotor: 'badge-neutral' };

export default function Users() {
  const { profile: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', role: 'vendedor' as UserRole, phone: '', active: true });

  useEffect(() => { fetchProfiles(); }, []);

  const fetchProfiles = async () => { const { data } = await supabase.from('profiles').select('*').order('created_at'); setProfiles(data as Profile[] ?? []); setLoading(false); };

  const openCreate = () => { setEditing(null); setForm({ name: '', email: '', role: 'vendedor', phone: '', active: true }); setError(null); setModalOpen(true); };
  const openEdit = (p: Profile) => { setEditing(p); setForm({ name: p.name, email: '', role: p.role, phone: p.phone ?? '', active: p.active }); setError(null); setModalOpen(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    try {
      if (editing) {
        const { error } = await supabase.from('profiles').update({ name: form.name, role: form.role, phone: form.phone || null, active: form.active }).eq('id', editing.id);
        if (error) throw error;
      } else {
        if (!form.email) { setError('E-mail é obrigatório para novos usuários'); setSubmitting(false); return; }
        const tempPassword = Math.random().toString(36).slice(2) + 'A1!';
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`;
        const session = (await supabase.auth.getSession()).data.session;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
          body: JSON.stringify({ email: form.email, password: tempPassword, name: form.name, role: form.role, phone: form.phone, active: form.active }),
        });
        if (!response.ok) { const errData = await response.json(); throw new Error(errData.error || 'Failed to create user'); }
      }
      setModalOpen(false); await fetchProfiles();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteId === currentUser?.id) { setError('Você não pode excluir seu próprio usuário'); return; }
    const { error } = await supabase.from('profiles').delete().eq('id', deleteId);
    if (error) { setError(error.message); } else { setDeleteId(null); await fetchProfiles(); }
  };

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-white">Usuários</h1><p className="text-dark-400 text-sm mt-1">{profiles.length} usuário(s) cadastrado(s)</p></div>
        <button onClick={openCreate} className="btn-primary"><Plus className="w-5 h-5" />Novo Usuário</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {profiles.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-primary-600/15 flex items-center justify-center shrink-0"><span className="text-primary-500 font-bold text-sm">{p.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span></div>
                <div className="min-w-0"><p className="text-white font-semibold truncate">{p.name}</p>{p.phone && <p className="text-dark-400 text-xs">{p.phone}</p>}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-dark-400 hover:text-primary-500 hover:bg-dark-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                {p.id !== currentUser?.id && <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-dark-400 hover:text-error-500 hover:bg-dark-700 transition-colors"><Trash2 className="w-4 h-4" /></button>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={roleBadges[p.role]}>{roleLabels[p.role]}</span>
              {p.active ? <span className="badge-success"><UserCheck className="w-3 h-3 mr-1" />Ativo</span> : <span className="badge-neutral"><UserX className="w-3 h-3 mr-1" />Inativo</span>}
            </div>
          </div>
        ))}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Nome *</label><input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" required /></div>
          {!editing && <div><label className="label">E-mail *</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" /><input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="input pl-10" required /></div></div>}
          <div><label className="label">Perfil *</label><select value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))} className="input" required><option value="admin">Administrador</option><option value="supervisor">Supervisor</option><option value="vendedor">Vendedor</option><option value="promotor">Promotor</option></select></div>
          <div><label className="label">Telefone</label><input type="text" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} className="input" /></div>
          <div><label className="label">Status</label><select value={form.active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'true' }))} className="input"><option value="true">Ativo</option><option value="false">Inativo</option></select></div>
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2"><button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editing ? 'Salvar' : 'Criar'}</button><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button></div>
        </form>
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Usuário" size="sm">
        <p className="text-dark-300 mb-4">Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.</p>
        {error && <p className="text-error-500 text-sm mb-3">{error}</p>}
        <div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1"><Trash2 className="w-4 h-4" />Excluir</button><button onClick={() => { setDeleteId(null); setError(null); }} className="btn-secondary">Cancelar</button></div>
      </Modal>
    </div>
  );
}
