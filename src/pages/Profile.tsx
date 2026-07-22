import { useState, useRef } from 'react';
import { Upload, Save, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth';

interface ProfileFormData {
  name: string;
  phone: string;
}

export default function Profile() {
  const { profile, refreshProfile } = useAuth();
  const [form, setForm] = useState<ProfileFormData>({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!profile) {
      toast.error('Usuário não encontrado');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      await refreshProfile();
      toast.success('Avatar atualizado com sucesso');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Erro ao fazer upload do avatar');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
      };

      const { error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-dark-400">Carregando perfil...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-dark-400 mt-1">Gerencie suas informações</p>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 max-w-2xl">
        {/* Avatar */}
        <div className="flex items-center gap-6 mb-8">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover border-2 border-dark-800"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-dark-800 flex items-center justify-center">
              <User size={40} className="text-dark-400" />
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition disabled:opacity-50"
            >
              <Upload size={18} />
              {uploading ? 'Enviando...' : 'Alterar avatar'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

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
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
