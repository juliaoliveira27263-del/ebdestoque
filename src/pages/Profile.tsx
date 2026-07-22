import { useState } from 'react';
import { User, Mail, Phone, Save, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const roleLabels: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', vendedor: 'Vendedor', promotor: 'Promotor' };

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => { e.preventDefault(); setSaving(true); setError(null); setSuccess(false); const { error } = await supabase.from('profiles').update({ name, phone: phone || null }).eq('id', profile!.id); if (error) { setError(error.message); } else { setSuccess(true); await refreshProfile(); setTimeout(() => setSuccess(false), 3000); } setSaving(false); };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-4">
      <div><h1 className="text-2xl font-bold text-white">Perfil</h1><p className="text-dark-400 text-sm mt-1">Gerencie suas informações</p></div>
      <div className="card p-5">
        <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 rounded-full bg-primary-600/15 flex items-center justify-center"><span className="text-primary-500 font-bold text-xl">{profile?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}</span></div><div><p className="text-white font-semibold text-lg">{profile?.name}</p><div className="flex items-center gap-2 mt-1"><Shield className="w-4 h-4 text-primary-500" /><span className="text-dark-300 text-sm">{roleLabels[profile?.role ?? ''] ?? ''}</span></div></div></div>
        <form onSubmit={handleSave} className="space-y-4">
          <div><label className="label">Nome</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" /><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input pl-10" required /></div></div>
          <div><label className="label">E-mail</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" /><input type="email" value={user?.email ?? ''} disabled className="input pl-10 opacity-50" /></div><p className="text-dark-400 text-xs mt-1">O e-mail não pode ser alterado</p></div>
          <div><label className="label">Telefone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" /><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="input pl-10" placeholder="(00) 00000-0000" /></div></div>
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
          {success && <div className="p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-500 text-sm">Perfil atualizado com sucesso!</div>}
          <button type="submit" disabled={saving} className="btn-primary">{saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}</button>
        </form>
      </div>
    </div>
  );
}
