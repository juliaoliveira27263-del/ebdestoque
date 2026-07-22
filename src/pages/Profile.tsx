import { useEffect, useState, useRef } from 'react';
import { User, Camera, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { toast } from 'sonner';
import { roleLabels } from '../lib/types';

export default function Profile() {
  const { profile, refreshProfile, user } = useAuth();
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhone(profile.phone ?? '');
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas arquivos de imagem');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      refreshProfile();
      toast.success('Avatar atualizado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload do avatar';
      toast.error(message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          phone: phone || null,
        })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="text-center py-12 text-dark-400">Carregando perfil...</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-dark-400 mt-1">Gerenciar suas informações</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 max-w-2xl">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-dark-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-dark-700 flex items-center justify-center border-2 border-dark-600">
                <User className="text-dark-400" size={40} />
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50"
              title="Alterar avatar"
            >
              <Camera className="text-white" size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          {uploading && (
            <p className="text-dark-400 text-sm mt-2">Enviando...</p>
          )}
        </div>

        {/* Profile Info */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-dark-900/50 rounded-lg">
          <div>
            <p className="text-dark-400 text-sm">Email</p>
            <p className="text-white">{user?.email ?? '-'}</p>
          </div>
          <div>
            <p className="text-dark-400 text-sm">Perfil</p>
            <p className="text-white">{roleLabels[profile.role]}</p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">Nome *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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
