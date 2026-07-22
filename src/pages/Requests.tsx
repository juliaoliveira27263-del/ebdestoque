import { useEffect, useState } from 'react';
import { Check, X, FileText, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Request, RequestItem, Product, Profile } from '../lib/types';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/csv';

interface RequestWithDetails extends Request {
  user_name?: string;
  items?: (RequestItem & { product_name?: string; product_sku?: string })[];
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailModal, setDetailModal] = useState<RequestWithDetails | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    const { data: requestsData } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
    const reqList = (requestsData as Request[] | null) ?? [];

    const userIds = [...new Set(reqList.map(r => r.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
    const profileMap = new Map<string, string>();
    (profiles as Profile[] | null)?.forEach(p => profileMap.set(p.id, p.name));

    const enriched = reqList.map(r => ({ ...r, user_name: profileMap.get(r.user_id) ?? 'Desconhecido' }));
    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const fetchDetails = async (req: RequestWithDetails) => {
    const { data: items } = await supabase.from('request_items').select('*').eq('request_id', req.id);
    const itemList = (items as RequestItem[] | null) ?? [];
    const productIds = [...new Set(itemList.map(i => i.product_id))];
    const { data: products } = await supabase.from('products').select('id, name, sku').in('id', productIds);
    const productMap = new Map<string, { name: string; sku: string | null }>();
    (products as Product[] | null)?.forEach(p => productMap.set(p.id, { name: p.name, sku: p.sku }));

    const itemsWithProducts = itemList.map(item => ({
      ...item,
      product_name: productMap.get(item.product_id)?.name ?? 'Desconhecido',
      product_sku: productMap.get(item.product_id)?.sku ?? undefined,
    }));
    setDetailModal({ ...req, items: itemsWithProducts });
  };

  const handleApprove = async (req: Request) => {
    const { data: items } = await supabase.from('request_items').select('*').eq('request_id', req.id);
    const itemList = (items as RequestItem[] | null) ?? [];

    for (const item of itemList) {
      const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
      const currentStock = (product as Product | null)?.stock_quantity ?? 0;
      if (currentStock < item.quantity) {
        toast.error(`Estoque insuficiente para um dos produtos.`);
        return;
      }
      await supabase.from('products').update({ stock_quantity: currentStock - item.quantity }).eq('id', item.product_id);
      await supabase.from('movements').insert({
        product_id: item.product_id, type: 'out', quantity: item.quantity,
        reason: `Saída - Solicitação aprovada`, user_id: req.user_id, request_id: req.id,
      });
    }

    await supabase.from('requests').update({ status: 'approved' }).eq('id', req.id);
    await supabase.from('notifications').insert({
      user_id: req.user_id, type: 'request_approved', title: 'Solicitação Aprovada',
      message: 'Sua solicitação foi aprovada.', related_id: req.id, read: false,
    });
    toast.success('Solicitação aprovada!');
    setDetailModal(null);
    fetchRequests();
  };

  const handleReject = async (req: Request) => {
    await supabase.from('requests').update({ status: 'rejected' }).eq('id', req.id);
    await supabase.from('notifications').insert({
      user_id: req.user_id, type: 'request_rejected', title: 'Solicitação Rejeitada',
      message: 'Sua solicitação foi rejeitada.', related_id: req.id, read: false,
    });
    toast.success('Solicitação rejeitada!');
    setDetailModal(null);
    fetchRequests();
  };

  const filtered = requests.filter(r => {
    const matchSearch = r.user_name?.toLowerCase().includes(search.toLowerCase()) ?? false;
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleExport = () => {
    exportToCSV('solicitacoes.csv', ['Usuário', 'Itens', 'Status', 'Data'],
      filtered.map(r => [r.user_name ?? '', r.total_items, r.status, new Date(r.created_at).toLocaleDateString('pt-BR')]));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitações</h1>
          <p className="text-dark-400 text-sm mt-1">Gerenciar solicitações de materiais</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
          Exportar CSV
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por usuário..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900 border border-dark-800 text-white outline-none focus:border-primary" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-dark-900 border border-dark-800 text-white outline-none focus:border-primary">
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhuma solicitação encontrada</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="bg-dark-900 border border-dark-800 rounded-xl p-5 hover:border-dark-700 transition-colors cursor-pointer"
              onClick={() => fetchDetails(req)}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-white font-medium">{req.user_name}</p>
                  <p className="text-dark-400 text-sm">{req.total_items} item(s) - {new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={req.status === 'pending' ? 'warning' : req.status === 'approved' ? 'success' : 'error'}>
                    {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
                  </Badge>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(req); }}
                        className="p-2 rounded-lg bg-success-700 text-white hover:bg-success-600 transition-colors">
                        <Check size={16} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleReject(req); }}
                        className="p-2 rounded-lg bg-error-600 text-white hover:bg-error-500 transition-colors">
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Detalhes da Solicitação" maxWidth="max-w-lg">
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{detailModal.user_name}</p>
                <p className="text-dark-400 text-sm">{new Date(detailModal.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Badge variant={detailModal.status === 'pending' ? 'warning' : detailModal.status === 'approved' ? 'success' : 'error'}>
                {detailModal.status === 'pending' ? 'Pendente' : detailModal.status === 'approved' ? 'Aprovado' : 'Rejeitado'}
              </Badge>
            </div>
            {detailModal.notes && (
              <div className="p-3 rounded-lg bg-dark-800">
                <p className="text-dark-300 text-sm">{detailModal.notes}</p>
              </div>
            )}
            <div>
              <h4 className="text-white text-sm font-semibold mb-2">Itens</h4>
              <div className="space-y-2">
                {detailModal.items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-dark-800">
                    <div>
                      <p className="text-white text-sm font-medium">{item.product_name}</p>
                      <p className="text-dark-400 text-xs">{item.product_sku ?? '-'}</p>
                    </div>
                    <span className="text-white text-sm font-medium">{item.quantity} un</span>
                  </div>
                ))}
              </div>
            </div>
            {detailModal.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleReject(detailModal)} className="flex-1 py-2.5 rounded-lg bg-error-600 text-white font-semibold hover:bg-error-500 transition-colors">
                  Rejeitar
                </button>
                <button onClick={() => handleApprove(detailModal)} className="flex-1 py-2.5 rounded-lg bg-success-700 text-white font-semibold hover:bg-success-600 transition-colors">
                  Aprovar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
