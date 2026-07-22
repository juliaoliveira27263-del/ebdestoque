import { Settings as SettingsIcon, Info } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-dark-400 text-sm mt-1">Configurações do sistema</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <SettingsIcon className="w-5 h-5 text-primary-400" />
          <h2 className="text-white font-semibold">Informações do Sistema</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">Versão</span>
            <span className="text-white font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">Ambiente</span>
            <span className="text-white font-medium">Produção</span>
          </div>
          <div className="flex justify-between py-2 border-b border-dark-700">
            <span className="text-dark-400">PWA</span>
            <span className="badge-success">Ativo</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-dark-400">Modo Offline</span>
            <span className="badge-success">Disponível</span>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-primary-400" />
          <h2 className="text-white font-semibold">Sobre o Sistema</h2>
        </div>
        <p className="text-dark-300 text-sm leading-relaxed">
          Sistema de Controle de Estoque e Solicitações. Plataforma para gestão de produtos,
          indústrias, solicitações e relatórios. Desenvolvido como PWA (Progressive Web App),
          permitindo instalação como aplicativo em dispositivos móveis e desktop.
        </p>
      </div>
    </div>
  );
}
