import { useEffect, useState } from 'react';
import { Search, Check, X, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import type { Request, RequestStatus, Profile, RequestItem, Product } from '../lib/types';
import { statusLabels } from '../lib/types';

interface RequestWithProfile extends Request {
  profileName: string;
}

interface RequestItemWithProduct extends RequestItem {
  productName: string;
}

export default function Requests() {
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RequestWithProfile | null>(null);
  const [requestItems, setRequestItems] = useState<RequestItemWithProduct[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const reqs = (data as Request[] | null) ?? [];

      if (reqs.length === 0) {
        setRequests([]);
        return;
      }

      // Fetch profiles separately
      const userIds = [...new Set(reqs.map((r) => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      const profiles = (profilesData as Profile[] | null) ?? [];
      const profileMap = new Map<string, string>();
      profiles.forEach((p) => profileMap.set(p.id, p.name));

      const withProfiles: RequestWithProfile[] = reqs.map((r) => ({
        ...r,
        profileName: profileMap.get(r.user_id) ?? 'Usuário desconhecido',
      }));
      setRequests(withProfiles);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  }

  const filtered = requests.filter((r) => {
    const matchesSearch = r.profileName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function badgeVariant(status: RequestStatus): 'default' | 'success' | 'warning' | 'error' | 'info' {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  }

  async function openDetail(req: RequestWithProfile) {
    setSelectedRequest(req);
    setDetailOpen(true);
    setLoadingItems(true);
    try {
      const { data: itemsData, error } = await supabase
        .from('request_items')
        .select('*')
        .eq('request_id', req.id);

      if (error) throw error;

      const items = (itemsData as RequestItem[] | null) ?? [];

      if (items.length === 0) {
        setRequestItems([]);
        return;
      }

      // Fetch products separately
      const productIds = [...new Set(items.map((i) => i.product_id))];
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);
      const products = (productsData as Product[] | null) ?? [];
      const productMap = new Map<string, string>();
      products.forEach((p) => productMap.set(p.id, p.name));

      const withProducts: RequestItemWithProduct[] = items.map((i) => ({
        ...i,
        productName: productMap.get(i.product_id) ?? 'Produto desconhecido',
      }));
      setRequestItems(withProducts);
    } catch (error) {
      console.error('Error fetching request items:', error);
      toast.error('Erro ao carregar itens do pedido');
    } finally {
      setLoadingItems(false);
    }
  }

  async function approveRequest(req: RequestWithProfile) {
    if (!confirm(`Aprovar o pedido de "${req.profileName}"? O estoque será decrementado.`)) return;
    setProcessing(true);
    try {
      // Fetch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('request_items')
        .select('*')
        .eq('request_id', req.id);

      if (itemsError) throw itemsError;

      const items = (itemsData as RequestItem[] | null) ?? [];

      // Decrement stock for each item and create movements
      for (const item of items) {
        // Fetch current product
        const { data: productData, error: prodError } = await supabase
          .from('products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (prodError) throw prodError;

        const currentStock = (productData as Product).stock_quantity;
        const newStock = currentStock - item.quantity;

        if (newStock < 0) {
          toast.error(`Estoque insuficiente para o produto ${item.product_id}`);
          return;
        }

        const { error: updateError } = await supabase
          .from('products')
          .update({ stock_quantity: newStock })
          .eq('id', item.product_id);

        if (updateError) throw updateError;

        // Create movement
        const { error: movementError } = await supabase.from('movements').insert({
          product_id: item.product_id,
          type: 'out',
          quantity: item.quantity,
          reason: `Pedido aprovado: ${req.id}`,
          user_id: req.user_id,
          request_id: req.id,
        });

        if (movementError) throw movementError;
      }

      // Update request status
      const { error: statusError } = await supabase
        .from('requests')
        .update({ status: 'approved' })
        .eq('id', req.id);

      if (statusError) throw statusError;

      toast.success('Pedido aprovado com sucesso');
      setDetailOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Erro ao aprovar pedido');
    } finally {
      setProcessing(false);
    }
  }

  async function rejectRequest(req: RequestWithProfile) {
    if (!confirm(`Rejeitar o pedido de "${req.profileName}"?`)) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('requests')
        .update({ status: 'rejected' })
        .eq('id', req.id);

      if (error) throw error;

      toast.success('Pedido rejeitado');
      setDetailOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Erro ao rejeitar pedido');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pedidos</h1>
        <p className="text-dark-400 mt-1">Gerencie os pedidos do sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar por usuário..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovado</option>
          <option value="rejected">Rejeitado</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dark-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-950 border-b border-dark-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Usuário</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Itens</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Data</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-dark-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-dark-400">
                      Nenhum pedido encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr key={req.id} className="hover:bg-dark-950">
                      <td className="px-4 py-3 text-white">{req.profileName}</td>
                      <td className="px-4 py-3 text-dark-400">{req.total_items}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariant(req.status as RequestStatus)}>
                          {statusLabels[req.status as RequestStatus]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-dark-400">
                        {new Date(req.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openDetail(req)}
                            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded transition"
                            title="Ver detalhes"
                          >
                            <Eye size={16} />
                          </button>
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveRequest(req)}
                                className="p-2 text-dark-400 hover:text-emerald-400 hover:bg-dark-800 rounded transition"
                                title="Aprovar"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => rejectRequest(req)}
                                className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition"
                                title="Rejeitar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={`Pedido - ${selectedRequest?.profileName ?? ''}`}
        maxWidth="2xl"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-400">Status</p>
                <Badge variant={badgeVariant(selectedRequest.status as RequestStatus)}>
                  {statusLabels[selectedRequest.status as RequestStatus]}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-dark-400">Data</p>
                <p className="text-white">
                  {new Date(selectedRequest.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="text-sm text-dark-400 mb-1">Observações</p>
                <p className="text-white bg-dark-950 p-3 rounded-lg border border-dark-800">
                  {selectedRequest.notes}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-dark-400 mb-2">Itens do pedido</p>
              {loadingItems ? (
                <div className="text-center py-4 text-dark-400">Carregando itens...</div>
              ) : requestItems.length === 0 ? (
                <div className="text-center py-4 text-dark-400">Nenhum item encontrado</div>
              ) : (
                <div className="space-y-2">
                  {requestItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-dark-950 rounded-lg border border-dark-800"
                    >
                      <span className="text-white">{item.productName}</span>
                      <span className="text-dark-400">Qtd: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedRequest.status === 'pending' && (
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => rejectRequest(selectedRequest)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <X size={16} /> Rejeitar
                </button>
                <button
                  onClick={() => approveRequest(selectedRequest)}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  <Check size={16} /> Aprovar
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
