import { useEffect, useState } from 'react';
import { Save, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

interface SettingsData {
  company_name: string;
  cnpj: string;
}

export default function Settings() {
  const [companyName, setCompanyName] = useState<string>('');
  const [cnpj, setCnpj] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .maybeSingle();
      if (error) throw error;
      if (data) {
        const settings = data as SettingsData;
        setCompanyName(settings.company_name ?? '');
        setCnpj(settings.cnpj ?? '');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar configurações';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        id: 1,
        company_name: companyName,
        cnpj: cnpj || null,
      });
      if (error) throw error;
      toast.success('Configurações salvas com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar configurações';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-dark-400 mt-1">Configurações da empresa</p>
      </div>

      <div className="bg-dark-800 border border-dark-700 rounded-xl p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg bg-dark-700 flex items-center justify-center">
            <Building className="text-blue-400" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Dados da Empresa</h2>
            <p className="text-dark-400 text-sm">Informações exibidas no sistema</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-dark-400">Carregando...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-dark-300 text-sm mb-1">Nome da Empresa *</label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="Digite o nome da empresa"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-sm mb-1">CNPJ</label>
              <input
                type="text"
                value={cnpj}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCnpj(e.target.value)}
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
                placeholder="00.000.000/0000-00"
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
        )}
      </div>
    </div>
  );
}
