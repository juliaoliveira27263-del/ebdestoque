import { useState } from 'react';
import { Settings as SettingsIcon, Building2, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const [companyName, setCompanyName] = useState('EBD Petrolina');
  const [cnpj, setCnpj] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Configurações salvas!');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-dark-400 text-sm mt-1">Configurações do sistema</p>
      </div>

      <div className="bg-dark-900 border border-dark-800 rounded-xl p-6 max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
            <Building2 size={20} className="text-dark-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Dados da Empresa</h3>
            <p className="text-dark-400 text-sm">Informações gerais</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Nome da Empresa</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">CNPJ</label>
            <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00"
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <button type="submit" className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors">
            <Save size={18} /> Salvar
          </button>
        </form>
      </div>
    </div>
  );
}
