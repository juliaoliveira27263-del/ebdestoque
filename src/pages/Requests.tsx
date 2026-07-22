import { useEffect, useState, useMemo } from 'react';
import {
  ClipboardList, Plus, Search, Package, ChevronDown, ChevronRight, Trash2,
  AlertCircle, CheckCircle2, XCircle, Clock, ShoppingCart, Factory,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Product, Industry, Request, RequestItem } from '../lib/types';
import Modal from '../components/Modal';

const statusConfig = {
  pending: { label: 'Pendente', icon: Clock, badge: 'badge-warning' },
  approved: { label: 'Aprovada', icon: CheckCircle2, badge: 'badge-success' },
  rejected: { label: 'Rejeitada', icon: XCircle, badge: 'badge-error' },
  completed: { label: 'Concluída', icon: CheckCircle2, badge: 'badge-primary' },
};

export default function Requests() {
  const { isAdmin, profile } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    let query = supabase.from('requests').select('*, profile:profiles(*), request_items(*, product:products(*), industry:industries(*))').order('created_at', { ascending: false });
    if (!isAdmin && profile?.id) {
      query = query.eq('user_id', profile.id);
    }
    const { data } = await query;
    setRequests(data as Request[] ?? []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const [
        { data: productsData },
        { data: industriesData },
      ] = await Promise.all([
        supabase.from('products').select('*, industry:industries(*)').eq('active', true).order('name'),
        supabase.from('industries').select('*').order('name'),
      ]);
      setProducts(productsData as Product[] ?? []);
      setIndustries(industriesData as Industry[] ?? []);
    })();
  }, []);

  const filteredRequests = useMemo(() => {
    let filtered = requests;
    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r) =>
        r.profile?.name?.toLowerCase().includes(q) ||
        r.request_items?.some((item) => item.product?.name.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [requests, search, filterStatus]);

  const productsByIndustry = useMemo(() => {
    const map: Record<string, Product[]> = {};
    products.forEach((p) => {
      const indId = p.industry_id ?? 'no-industry';
      if (!map[indId]) map[indId] = [];
      map[indId].push(p);
    });
    return map;
  }, [products]);

  const industryNames: Record<string, string> = useMemo(() => {
    const names: Record<string, string> = {};
    products.forEach((p) => {
      const indId = p.industry_id ?? 'no-industry';
      names[indId] = p.industry?.name?.trim() ?? 'Sem Indústria';
    });
    return names;
  }, [products]);

  const cartCount = Object.values(cart).reduce((s, q) => s + q, 0);

  const openCreate = () => {
    setCart({});
    setNotes('');
    setError(null);
    setExpandedIndustry(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartCount === 0) {
      setError('Adicione pelo menos um produto');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const { data: newRequest, error: reqError } = await supabase
        .from('requests')
        .insert({
          user_id: profile!.id,
          status: 'pending',
          notes: notes || null,
          total_items: cartCount,
        })
        .select()
        .single();

      if (reqError) throw reqError;

      const items = Object.entries(cart).map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return {
          request_id: newRequest.id,
          product_id: productId,
          quantity,
          industry_id: product?.industry_id ?? null,
        };
      });

      const { error: itemsError } = await supabase.from('request_items').insert(items);
      if (itemsError) throw itemsError;

      // Create notification for admin
      await supabase.from('notifications').insert({
        user_id: null,
        type: 'new_request',
        title: 'Nova solicitação',
        message: `${profile?.name} criou uma solicitação com ${cartCount} item(s)`,
        related_id: newRequest.id,
      });

      setModalOpen(false);
      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: Request['status']) => {
    const { error } = await supabase.from('requests').update({ status }).eq('id', requestId);
    if (error) {
      setError(error.message);
    } else {
      // Notify the requesting user
      const req = requests.find((r) => r.id === requestId);
      if (req?.user_id) {
        await supabase.from('notifications').insert({
          user_id: req.user_id,
          type: 'request_update',
          title: `Solicitação ${statusConfig[status].label}`,
          message: `Sua solicitação foi ${statusConfig[status].label.toLowerCase()}`,
          related_id: requestId,
        });
      }
      await fetchRequests();
    }
  };

  const handleDelete = async (requestId: string) => {
    const { error } = await supabase.from('requests').delete().eq('id', requestId);
    if (error) {
      setError(error.message);
    } else {
      await fetchRequests();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Solicitações</h1>
          <p className="text-dark-400 text-sm mt-1">{filteredRequests.length} solicitação(ões)</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-5 h-5" />
          Nova Solicitação
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar solicitações..."
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input sm:w-48">
          <option value="all">Todos os status</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovadas</option>
          <option value="rejected">Rejeitadas</option>
          <option value="completed">Concluídas</option>
        </select>
      </div>

      {/* Requests list */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="card p-8 text-center">
            <ClipboardList className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">Nenhuma solicitação encontrada.</p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isExpanded = expandedRequest === req.id;
            const StatusIcon = statusConfig[req.status].icon;
            return (
              <div key={req.id} className="card overflow-hidden">
                <button
                  onClick={() => setExpandedRequest(isExpanded ? null : req.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-dark-700/50 transition-colors"
                >
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-primary-400" /> : <ChevronRight className="w-5 h-5 text-dark-400" />}
                  <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-5 h-5 text-primary-400" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white font-medium text-sm">
                        {req.profile?.name ?? 'Usuário'}
                      </p>
                      <span className={statusConfig[req.status].badge}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[req.status].label}
                      </span>
                    </div>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {req.total_items} item(s) · {new Date(req.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-dark-700 p-4 space-y-3">
                    {req.notes && (
                      <div className="p-3 rounded-lg bg-dark-700/50">
                        <p className="text-dark-400 text-xs mb-1">Observações:</p>
                        <p className="text-dark-200 text-sm">{req.notes}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {req.request_items?.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-dark-700/30">
                          {item.product?.image_url ? (
                            <img src={item.product.image_url} alt={item.product.name} className="w-10 h-10 rounded-lg object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                              <Package className="w-5 h-5 text-dark-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.product?.name ?? 'Produto'}</p>
                            <p className="text-dark-400 text-xs">{item.industry?.name?.trim() ?? ''}</p>
                          </div>
                          <span className="badge-primary shrink-0">{item.quantity} {item.product?.unit ?? 'un'}</span>
                        </div>
                      ))}
                    </div>

                    {isAdmin && req.status === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button onClick={() => handleUpdateStatus(req.id, 'approved')} className="btn-secondary text-sm">
                          <CheckCircle2 className="w-4 h-4 text-success-500" />
                          Aprovar
                        </button>
                        <button onClick={() => handleUpdateStatus(req.id, 'rejected')} className="btn-secondary text-sm">
                          <XCircle className="w-4 h-4 text-error-500" />
                          Rejeitar
                        </button>
                        <button onClick={() => handleUpdateStatus(req.id, 'completed')} className="btn-secondary text-sm">
                          <CheckCircle2 className="w-4 h-4 text-primary-400" />
                          Concluir
                        </button>
                      </div>
                    )}

                    {!isAdmin && req.status === 'pending' && (
                      <div className="pt-2">
                        <button onClick={() => handleDelete(req.id)} className="btn-ghost text-sm text-error-500">
                          <Trash2 className="w-4 h-4" />
                          Cancelar solicitação
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova Solicitação" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cart summary */}
          {cartCount > 0 && (
            <div className="p-3 rounded-lg bg-primary-600/10 border border-primary-600/30">
              <div className="flex items-center justify-between">
                <span className="text-primary-400 text-sm font-medium">{cartCount} item(s) no carrinho</span>
                <button type="button" onClick={() => setCart({})} className="text-dark-400 hover:text-error-500 text-xs">
                  Limpar
                </button>
              </div>
            </div>
          )}

          {/* Products grouped by industry */}
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {Object.entries(industryNames).map(([indId, indName]) => {
              const indProducts = productsByIndustry[indId] ?? [];
              const isExp = expandedIndustry === indId;
              return (
                <div key={indId} className="border border-dark-700 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setExpandedIndustry(isExp ? null : indId)}
                    className="w-full flex items-center gap-2 p-3 hover:bg-dark-700/50 transition-colors"
                  >
                    {isExp ? <ChevronDown className="w-4 h-4 text-primary-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                    <Factory className="w-4 h-4 text-primary-400" />
                    <span className="text-white text-sm font-medium flex-1 text-left">{indName}</span>
                    <span className="text-dark-400 text-xs">{indProducts.length} produto(s)</span>
                  </button>
                  {isExp && (
                    <div className="border-t border-dark-700 divide-y divide-dark-700/50">
                      {indProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-2.5">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-9 h-9 rounded-lg object-cover shrink-0" loading="lazy" />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4 text-dark-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm truncate">{product.name}</p>
                            <p className="text-dark-400 text-xs">Estoque: {product.stock_quantity} {product.unit}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                const current = cart[product.id] ?? 0;
                                if (current > 0) setCart((p) => ({ ...p, [product.id]: current - 1 }));
                              }}
                              className="w-7 h-7 rounded-md bg-dark-700 text-white hover:bg-dark-600 flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-8 text-center text-white text-sm font-medium">
                              {cart[product.id] ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const current = cart[product.id] ?? 0;
                                setCart((p) => ({ ...p, [product.id]: current + 1 }));
                              }}
                              className="w-7 h-7 rounded-md bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input min-h-[60px] resize-y"
              placeholder="Observações sobre a solicitação..."
              rows={2}
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting || cartCount === 0} className="btn-primary flex-1">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Enviar Solicitação'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      {error && !modalOpen && (
        <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

