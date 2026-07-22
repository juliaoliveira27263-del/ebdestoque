import { useState } from 'react';
import { Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsFormData {
  companyName: string;
  cnpj: string;
}

export default function Settings() {
  const [form, setForm] = useState<SettingsFormData>({
    companyName: '',
    cnpj: '',
  });
  const [saving, setSaving] = useState(false);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-dark-400 mt-1">Configurações da empresa</p>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-lg p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
            <Building2 size={20} className="text-emerald-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Dados da empresa</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Nome da empresa *</label>
            <input
              type="text"
              name="companyName"
              required
              value={form.companyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">CNPJ</label>
            <input
              type="text"
              name="cnpj"
              value={form.cnpj}
              onChange={handleInputChange}
              placeholder="00.000.000/0000-00"
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
              {saving ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
