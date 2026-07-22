import { useState } from 'react';
import { User, Mail, Phone, Save, Camera } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { roleLabels } from '../lib/types';

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [loading, setLoading] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    const { error } = await supabase.from('profiles').update({
      name, phone: phone || null,
    }).eq('id', profile.id);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Perfil atualizado!');
    refreshProfile();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    setLoading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    if (uploadError) { toast.error(uploadError.message); setLoading(false); return; }
    const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const avatarUrl = data.publicUrl;
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', profile.id);
    toast.success('Foto atualizada!');
    refreshProfile();
    setLoading(false);
  };

  if (!profile) return null;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-dark-400 text-sm mt-1">Gerenciar seu perfil</p>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-dark-700 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{profile.name.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={loading} />
            </label>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{profile.name}</h3>
            <p className="text-dark-400 text-sm">{roleLabels[profile.role]}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Nome</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Telefone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
            <Save size={18} /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
