import { useState } from 'react';
import {
  User, Mail, Phone, MapPin, Calendar, Camera, Edit2, KeyRound, Save,
  AlertCircle, CheckCircle2, Shield,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';

const roleLabels: Record<string, string> = {
  admin: 'Administrador', supervisor: 'Supervisor', vendedor: 'Vendedor', promotor: 'Promotor',
};

export default function MeuPerfil() {
  const { profile, user, refreshProfile, updatePassword } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: profile?.name ?? '', phone: profile?.phone ?? '', city: profile?.city ?? '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true); setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${profile!.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile!.id);
      if (updateError) throw updateError;
      await refreshProfile();
    } catch (err: any) { setError(err.message); } finally { setUploadingAvatar(false); }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    const { error } = await supabase.from('profiles').update({
      name: editForm.name, phone: editForm.phone || null, city: editForm.city || null,
    }).eq('id', profile!.id);
    if (error) { setError(error.message); } else {
      await refreshProfile(); setEditOpen(false); setSuccess('Perfil atualizado com sucesso!'); setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    if (passwordForm.new.length < 8) { setError('A nova senha deve ter no mínimo 8 caracteres.'); setSaving(false); return; }
    if (passwordForm.new !== passwordForm.confirm) { setError('As senhas não coincidem.'); setSaving(false); return; }
    const { error } = await updatePassword(passwordForm.new);
    if (error) { setError(error); } else {
      setPasswordOpen(false); setPasswordForm({ current: '', new: '', confirm: '' }); setSuccess('Senha alterada com sucesso!'); setTimeout(() => setSuccess(null), 3000);
    }
    setSaving(false);
  };

  const initials = profile?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() ?? '';
  const cardClass = isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm';
  const labelClass = isDark ? 'text-dark-400' : 'text-gray-500';
  const valueClass = isDark ? 'text-white' : 'text-gray-900';

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto">
      <h1 className={`text-2xl lg:text-3xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Meu Perfil</h1>

      {success && (
        <div className="mb-4 p-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-500 text-sm flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}
      {error && !editOpen && !passwordOpen && (
        <div className="mb-4 p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}
        </div>
      )}

      {/* Profile card */}
      <div className={`card p-6 mb-4 ${cardClass}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-primary-600/10 border-2 border-primary-600/20">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary-600 font-bold text-3xl">{initials}</span>
              )}
            </div>
            <label className={`absolute bottom-0 right-0 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md ${isDark ? 'bg-dark-700 hover:bg-dark-600 border-2 border-dark-800' : 'bg-white hover:bg-gray-100 border-2 border-white'}`}>
              <Camera className="w-4 h-4 text-primary-600" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleAvatarUpload(file); }} disabled={uploadingAvatar} />
            </label>
            {uploadingAvatar && <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /></div>}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3 w-full">
            <div className="flex items-center gap-3">
              <User className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>Nome</p><p className={`font-medium ${valueClass}`}>{profile?.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>E-mail</p><p className={`font-medium ${valueClass}`}>{user?.email}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>Cargo</p><p className={`font-medium ${valueClass}`}>{roleLabels[profile?.role ?? ''] ?? ''}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>Telefone</p><p className={`font-medium ${valueClass}`}>{profile?.phone ?? 'Não informado'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>Cidade</p><p className={`font-medium ${valueClass}`}>{profile?.city ?? 'Não informado'}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className={`w-5 h-5 shrink-0 ${labelClass}`} />
              <div><p className={`text-xs ${labelClass}`}>Data de Cadastro</p><p className={`font-medium ${valueClass}`}>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={() => { setEditForm({ name: profile?.name ?? '', phone: profile?.phone ?? '', city: profile?.city ?? '' }); setError(null); setEditOpen(true); }} className="btn-primary flex-1">
          <Edit2 className="w-4 h-4" />Editar Perfil
        </button>
        <button onClick={() => { setPasswordForm({ current: '', new: '', confirm: '' }); setError(null); setPasswordOpen(true); }} className="btn-secondary flex-1">
          <KeyRound className="w-4 h-4" />Alterar Senha
        </button>
      </div>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar Perfil" size="sm">
        <form onSubmit={handleEditSave} className="space-y-4">
          <div><label className="label">Nome *</label><input type="text" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} className="input" required /></div>
          <div><label className="label">Telefone</label><input type="text" value={editForm.phone} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} className="input" placeholder="(00) 00000-0000" /></div>
          <div><label className="label">Cidade</label><input type="text" value={editForm.city} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))} className="input" placeholder="Sua cidade" /></div>
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Salvar</>}</button>
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {/* Password modal */}
      <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Alterar Senha" size="sm">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <div><label className="label">Nova Senha *</label><input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))} className="input" placeholder="Mínimo 8 caracteres" required minLength={8} autoFocus /></div>
          <div><label className="label">Confirmar Nova Senha *</label><input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))} className="input" placeholder="Repita a nova senha" required minLength={8} /></div>
          {passwordForm.confirm && passwordForm.new !== passwordForm.confirm && <p className="text-error-500 text-xs">As senhas não coincidem.</p>}
          {error && <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><KeyRound className="w-4 h-4" />Alterar</>}</button>
            <button type="button" onClick={() => setPasswordOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
