import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Camera, Lock, Pencil, Save, X } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { supabase } from '../lib/supabase';
import { roleLabels } from '../lib/types';
import { toast } from 'sonner';

export default function MeuPerfil() {
  const { profile, refreshProfile, updatePassword } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [editModal, setEditModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', city: '' });
  const [passwordForm, setPasswordForm] = useState({ new: '', confirm: '' });
  const [error, setError] = useState('');

  if (!profile) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setLoading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', profile.id);
    toast.success('Foto atualizada!');
    refreshProfile();
    setLoading(false);
  };

  const openEdit = () => {
    setEditForm({ name: profile.name, phone: profile.phone ?? '', city: profile.city ?? '' });
    setEditModal(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      name: editForm.name, phone: editForm.phone || null, city: editForm.city || null,
    }).eq('id', profile.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Perfil atualizado!');
    setEditModal(false);
    refreshProfile();
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (passwordForm.new !== passwordForm.confirm) { setError('As senhas não coincidem.'); return; }
    if (passwordForm.new.length < 6) { setError('A senha deve ter no mínimo 6 caracteres.'); return; }
    setLoading(true);
    const { error } = await updatePassword(passwordForm.new);
    setLoading(false);
    if (error) { setError(error); return; }
    toast.success('Senha alterada com sucesso!');
    setPasswordModal(false);
    setPasswordForm({ new: '', confirm: '' });
  };

  const infoItems = [
    { icon: User, label: 'Nome', value: profile.name },
    { icon: Mail, label: 'Email', value: profile.id },
    { icon: Pencil, label: 'Cargo', value: roleLabels[profile.role] },
    { icon: Phone, label: 'Telefone', value: profile.phone ?? 'Não informado' },
    { icon: MapPin, label: 'Cidade', value: profile.city ?? 'Não informado' },
    { icon: Calendar, label: 'Cadastro', value: new Date(profile.created_at).toLocaleDateString('pt-BR') },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Meu Perfil</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Gerencie suas informações pessoais</p>
      </div>

      <div className={`rounded-2xl border p-6 sm:p-8 ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200 shadow-sm'}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDark ? 'bg-dark-700' : 'bg-gray-100'}`}>
                <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-400'}`}>
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
              <Camera size={16} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={loading} />
            </label>
          </div>
          <div className="text-center sm:text-left flex-1">
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.name}</h2>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{roleLabels[profile.role]}</p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <button onClick={openEdit} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
                <Pencil size={16} /> Editar Perfil
              </button>
              <button onClick={() => setPasswordModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <Lock size={16} /> Alterar Senha
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {infoItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
                  <Icon size={18} className={isDark ? 'text-dark-300' : 'text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{item.label}</p>
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border animate-scale-in ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Editar Perfil</h2>
              <button onClick={() => setEditModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleEditSave} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Nome</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Telefone</label>
                <input type="text" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Cidade</label>
                <input type="text" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                  <Save size={16} /> {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPasswordModal(false)} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border animate-scale-in ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'}`}>
            <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
              <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Alterar Senha</h2>
              <button onClick={() => setPasswordModal(false)} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handlePasswordSave} className="p-5 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Nova Senha</label>
                <input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} required minLength={6}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} placeholder="Mínimo 6 caracteres" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Confirmar Senha</label>
                <input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required minLength={6}
                  className={`w-full px-4 py-2.5 rounded-xl border outline-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} placeholder="Repita a senha" />
              </div>
              {error && <p className="text-error-500 text-sm">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setPasswordModal(false)} className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
