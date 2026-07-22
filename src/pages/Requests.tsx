import { useEffect, useState } from 'react';
import { Search, Download, Eye, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/csv';
import { Request, RequestStatus, RequestItem, statusLabels } from '../lib/types';

interface RequestWithUser extends Request {
  user_name: string;
}

interface RequestItemWithProduct extends RequestItem {
  product_name: string | undefined;
  product_sku: string | undefined;
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestWithUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailModal, setDetailModal] = useState<boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithUser | null>(null);
  const [requestItems, setRequestItems] = useState<RequestItemWithProduct[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map((r: Request & { profiles: { name: string } | null }) => ({
        ...r,
        user_name: r.profiles?.name ?? 'Usuário',
      }));
      setRequests(mapped);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar pedidos';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (request: RequestWithUser): Promise<void> => {
    setSelectedRequest(request);
    setDetailModal(true);
    try {
      const { data, error } = await supabase
        .from('request_items')
        .select('*, products(name, sku)')
        .eq('request_id', request.id);
      if (error) throw error;
      const mapped = (data ?? []).map((item: RequestItem & { products: { name: string; sku: string | null } | null }) => ({
        ...item,
        product_name: item.products?.name,
        product_sku: item.products?.sku ?? undefined,
      }));
      setRequestItems(mapped);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar itens';
      toast.error(message);
    }
  };

  const handleApprove = async (request: RequestWithUser): Promise<void> => {
    setActionLoading(true);
    try {
      // Fetch items
      const { data: items, error: itemsError } = await supabase
        .from('request_items')
        .select('*, products(id, name, stock_quantity)')
        .eq('request_id', request.id);
      if (itemsError) throw itemsError;

      const requestItems = (items ?? []) as (RequestItem & {
        products: { id: string; name: string; stock_quantity: number } | null;
      })[];

      // Decrement stock and create movements
      for (const item of requestItems) {
        if (!item.products) continue;
        const newStock = item.products.stock_quantity - item.quantity;
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.products.id);
        if (updateError) throw updateError;

        const { error: movementError } = await supabase.from('movements').insert({
          product_id: item.product_id,
          type: 'out' as const,
          quantity: item.quantity,
          reason: `Saída referente ao pedido ${request.id}`,
          request_id: request.id,
        });
        if (movementError) throw movementError;
      }

      // Update request status
      const { error: statusError } = await supabase
        .from('requests')
        .update({ status: 'approved' as RequestStatus })
        .eq('id', request.id);
      if (statusError) throw statusError;

      toast.success('Pedido aprovado com sucesso');
      setDetailModal(false);
      fetchRequests();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao aprovar pedido';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (request: RequestWithUser): Promise<void> => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'rejected' as RequestStatus })
        .eq('id', request.id);
      if (error) throw error;
      toast.success('Pedido rejeitado');
      setDetailModal(false);
      fetchRequests();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao rejeitar pedido';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = (): void => {
    const headers = ['ID', 'Usuário', 'Status', 'Itens', 'Data'];
    const rows = filteredRequests.map((r: RequestWithUser) => [
      r.id,
      r.user_name,
      statusLabels[r.status],
      r.total_items,
      new Date(r.created_at).toLocaleDateString('pt-BR'),
    ]);
    exportToCSV('pedidos.csv', headers, rows);
  };

  const filteredRequests = requests.filter((r: RequestWithUser) => {
    const matchesSearch =
      r.user_name.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusVariant = (status: RequestStatus): 'warning' | 'success' | 'error' => {
    if (status === 'pending') return 'warning';
    if (status === 'approved') return 'success';
    return 'error';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Pedidos</h1>
          <p className="text-dark-400 mt-1">Gerenciar pedidos de produtos</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700 transition-colors"
        >
          <Download size={18} />
          Exportar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por usuário ou ID..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-dark-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left p-4 text-dark-300 font-semibold">ID</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Usuário</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Itens</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Status</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Data</th>
                <th className="text-right p-4 text-dark-300 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request: RequestWithUser) => (
                  <tr
                    key={request.id}
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="p-4 text-dark-300 font-mono text-sm">
                      {request.id.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-white">{request.user_name}</td>
                    <td className="p-4 text-dark-300">{request.total_items}</td>
                    <td className="p-4">
                      <Badge variant={statusVariant(request.status)}>
                        {statusLabels[request.status]}
                      </Badge>
                    </td>
                    <td className="p-4 text-dark-300">
                      {new Date(request.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleOpenDetail(request)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailModal}
        onClose={() => setDetailModal(false)}
        title="Detalhes do Pedido"
        maxWidth="max-w-2xl"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-dark-900/50 rounded-lg">
              <div>
                <p className="text-dark-400 text-sm">Usuário</p>
                <p className="text-white font-medium">{selectedRequest.user_name}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Status</p>
                <Badge variant={statusVariant(selectedRequest.status)}>
                  {statusLabels[selectedRequest.status]}
                </Badge>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Total de Itens</p>
                <p className="text-white font-medium">{selectedRequest.total_items}</p>
              </div>
              <div>
                <p className="text-dark-400 text-sm">Data</p>
                <p className="text-white font-medium">
                  {new Date(selectedRequest.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {selectedRequest.notes && (
                <div className="col-span-2">
                  <p className="text-dark-400 text-sm">Observações</p>
                  <p className="text-white">{selectedRequest.notes}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">Itens do Pedido</h3>
              <div className="border border-dark-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-900/50">
                      <th className="text-left p-3 text-dark-300 text-sm font-semibold">Produto</th>
                      <th className="text-left p-3 text-dark-300 text-sm font-semibold">SKU</th>
                      <th className="text-right p-3 text-dark-300 text-sm font-semibold">Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requestItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-dark-400">
                          Nenhum item
                        </td>
                      </tr>
                    ) : (
                      requestItems.map((item: RequestItemWithProduct) => (
                        <tr key={item.id} className="border-b border-dark-700">
                          <td className="p-3 text-white">{item.product_name ?? 'Produto removido'}</td>
                          <td className="p-3 text-dark-300">{item.product_sku ?? '-'}</td>
                          <td className="p-3 text-right text-white">{item.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleReject(selectedRequest)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                  Rejeitar
                </button>
                <button
                  onClick={() => handleApprove(selectedRequest)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50"
                >
                  <Check size={18} />
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
