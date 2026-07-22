import { useEffect, useState } from 'react';
import { Factory, Plus, Edit2, Trash2, AlertCircle, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Industry } from '../lib/types';
import Modal from '../components/Modal';

export default function Industries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', active: true });

  useEffect(() => { fetchIndustries(); }, []);
  const fetchIndustries = async () => { const { data } = await supabase.from('industries').select('*').order('name'); setIndustries(data as Industry[] ?? []); setLoading(false); };
  const openCreate = () => { setEditing(null); setForm({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', active: true }); setError(null); setModalOpen(true); };
  const openEdit = (ind: Industry) => { setEditing(ind); setForm({ name: ind.name, cnpj: ind.cnpj ?? '', contact_name: ind.contact_name ?? '', contact_email: ind.contact_email ?? '', contact_phone: ind.contact_phone ?? '', address: ind.address ?? '', active: ind.active }); setError(null); setModalOpen(true); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setSubmitting(true); setError(null); const payload = { name: form.name, cnpj: form.cnpj || null, contact_name: form.contact_name || null, contact_email: form.contact_email || null, contact_phone: form.contact_phone || null, address: form.address || null, active: form.active }; try { if (editing) { const { error } = await supabase.from('industries').update(payload).eq('id', editing.id); if (error) throw error; } else { const { error } = await supabase.from('industries').insert(payload); if (error) throw error; } setModalOpen(false); await fetchIndustries(); } catch (err: any) { setError(err.message); } finally { setSubmitting(false); } };
  const handleDelete = async () => { if (!deleteId) return; const { error } = await supabase.from('industries').delete().eq('id', deleteId); if (error) { setError(error.message); } else { setDeleteId(null); await fetchIndustries(); } };

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><h1 className="text-2xl font-bold text-white">Indústrias</h1><p className="text-dark-400 text-sm mt-1">{industries.length} indústrias cadastradas</p></div><button onClick={openCreate} className="btn-primary"><Plus className="w-5 h-5" />Nova Indústria</button></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {industries.map((ind) => (<div key={ind.id} className="card p-4"><div className="flex items-start justify-between gap-2 mb-3"><div className="flex items-center gap-3 min-w-0"><div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center shrink-0"><Factory className="w-5 h-5 text-primary-500" /></div><div className="min-w-0"><p className="text-white font-semibold truncate">{ind.name.trim()}</p>{ind.cnpj && <p className="text-dark-400 text-xs">CNPJ: {ind.cnpj}</p>}</div></div><div className="flex items-center gap-1 shrink-0"><button onClick={() => openEdit(ind)} className="p-1.5 rounded-lg text-dark-400 hover:text-primary-500 hover:bg-dark-700 transition-colors"><Edit2 className="w-4 h-4" /></button><button onClick={() => setDeleteId(ind.id)} className="p-1.5 rounded-lg text-dark-400 hover:text-error-500 hover:bg-dark-700 transition-colors"><Trash2 className="w-4 h-4" /></button></div></div><div className="space-y-1 text-sm text-dark-300">{ind.contact_name && <p className="truncate">{ind.contact_name}</p>}{ind.contact_phone && <p className="flex items-center gap-2 truncate"><Phone className="w-3.5 h-3.5 text-dark-400 shrink-0" />{ind.contact_phone}</p>}{ind.contact_email && <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-dark-400 shrink-0" />{ind.contact_email}</p>}{ind.address && <p className="flex items-center gap-2 truncate"><MapPin className="w-3.5 h-3.5 text-dark-400 shrink-0" />{ind.address}</p>}</div><div className="mt-3">{ind.active ? <span className="badge-success">Ativa</span> : <span className="badge-neutral">Inativa</span>}</div></div>))}
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Indústria' : 'Nova Indústria'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Nome *</label><input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" required /></div>
          <div><label className="label">CNPJ</label><input type="text" value={form.cnpj} onChange={(e) => setForm((p) => ({ ...p, cnpj: e.target.value }))} className="input" /></div>
          <div><label className="label">Contato</label><input type="text" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} className="input" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="label">Telefone</label><input type="text" value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} className="input" /></div><div><label className="label">E-mail</label><input type="email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} className="input" /></div></div>
          <div><label className="label">Endereço</label><input type="text" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} className="input" /></div>
          <div><label className="label">Status</label><select value={form.active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'true' }))} className="input"><option value="true">Ativa</option><option value="false">Inativa</option></select></div>
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
          <div className="flex gap-3 pt-2"><button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editing ? 'Salvar' : 'Criar'}</button><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button></div>
        </form>
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Indústria" size="sm"><p className="text-dark-300 mb-4">Tem certeza que deseja excluir esta indústria? Esta ação não pode ser desfeita.</p><div className="flex gap-3"><button onClick={handleDelete} className="btn-danger flex-1"><Trash2 className="w-4 h-4" />Excluir</button><button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button></div></Modal>
    </div>
  );
}
