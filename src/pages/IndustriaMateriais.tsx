import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, Search, AlertCircle, CheckCircle2, ShoppingCart } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { useAuth } from '../lib/auth';
import type { Product, Industry } from '../lib/types';
import Modal from '../components/Modal';

export default function IndustriaMateriais() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { profile } = useAuth();
  const isDark = theme === 'dark';
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      const [ind, prods] = await Promise.all([
        supabase.from('industries').select('*').eq('id', id).maybeSingle(),
        supabase.from('products').select('*, industry:industries(*)').eq('industry_id', id).eq('active', true).order('name'),
      ]);
      setIndustry(ind.data as Industry | null);
      setProducts(prods.data as Product[] ?? []);
      setLoading(false);
    })();
  }, [id]);

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }, [products, search]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity('1');
    setObservation('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !profile) return;
    const qty = parseInt(quantity);
    if (qty <= 0) { setError('A quantidade deve ser maior que zero.'); return; }
    if (qty > selectedProduct.stock_quantity) { setError('Quantidade indisponível em estoque.'); return; }
    setSubmitting(true); setError(null);
    try {
      const { data: newRequest, error: reqError } = await supabase.from('requests').insert({
        user_id: profile.id, status: 'pending', notes: observation || null, total_items: qty,
      }).select().single();
      if (reqError) throw reqError;
      const { error: itemsError } = await supabase.from('request_items').insert({
        request_id: newRequest.id, product_id: selectedProduct.id, quantity: qty, industry_id: selectedProduct.industry_id,
      });
      if (itemsError) throw itemsError;
      await supabase.from('notifications').insert({
        user_id: null, type: 'new_request', title: 'Nova solicitação',
        message: `${profile.name} solicitou ${qty}x ${selectedProduct.name}`, related_id: newRequest.id,
      });
      setSuccess(true);
      setTimeout(() => { setSelectedProduct(null); }, 2000);
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <button
        onClick={() => navigate('/solicitacao')}
        className={`inline-flex items-center gap-2 text-sm font-medium mb-4 transition-colors ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <ArrowLeft className="w-4 h-4" />Voltar
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-primary-600/10 border border-primary-600/20">
          {industry?.logo_url ? (
            <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-contain p-1" />
          ) : (
            <Package className="w-7 h-7 text-primary-600" />
          )}
        </div>
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{industry?.name?.trim() ?? 'Indústria'}</h1>
          <p className={`mt-0.5 text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>{products.length} materiais disponíveis</p>
        </div>
      </div>

      {products.length > 6 && (
        <div className="relative mb-6 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Buscar material..." />
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className={`card p-12 text-center ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <Package className={`w-14 h-14 mx-auto mb-4 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Nenhum material disponível nesta indústria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`card p-4 flex flex-col transition-all duration-200 hover:shadow-lg animate-fade-in ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}
            >
              <div className="w-full h-32 rounded-lg overflow-hidden mb-3 flex items-center justify-center bg-gray-100 dark:bg-dark-700">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <Package className={`w-12 h-12 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} />
                )}
              </div>
              <div className="flex-1">
                <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                {product.sku && <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Código: {product.sku}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <span className={product.stock_quantity <= product.min_stock ? 'badge-error' : 'badge-success'}>
                    {product.stock_quantity} {product.unit} disponível
                  </span>
                </div>
              </div>
              <button
                onClick={() => openModal(product)}
                disabled={product.stock_quantity === 0}
                className="btn-primary mt-3 w-full text-sm py-2"
              >
                {product.stock_quantity === 0 ? 'Indisponível' : 'Solicitar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!selectedProduct} onClose={() => setSelectedProduct(null)} title="Solicitação de Material" size="sm">
        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-500/15 mb-2">
              <CheckCircle2 className="w-8 h-8 text-success-500" />
            </div>
            <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitação enviada!</p>
            <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Sua solicitação foi enviada para o Administrador aprovar. Você receberá uma notificação quando for analisada.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {selectedProduct && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gray-100 dark:bg-dark-700">
                    {selectedProduct.image_url ? (
                      <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className={`w-8 h-8 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.name}</p>
                    {selectedProduct.sku && <p className={`text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Código: {selectedProduct.sku}</p>}
                    <span className={selectedProduct.stock_quantity <= selectedProduct.min_stock ? 'badge-error mt-1' : 'badge-success mt-1'}>
                      {selectedProduct.stock_quantity} {selectedProduct.unit} disponível
                    </span>
                  </div>
                </div>
                <div>
                  <label className="label">Quantidade desejada *</label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="input"
                    min="1"
                    max={selectedProduct.stock_quantity}
                    required
                    autoFocus
                  />
                  <p className={`text-xs mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Máximo disponível: {selectedProduct.stock_quantity} {selectedProduct.unit}</p>
                </div>
                <div>
                  <label className="label">Observação (opcional)</label>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    className="input min-h-[60px] resize-y"
                    placeholder="Alguma observação sobre esta solicitação?"
                    rows={2}
                  />
                </div>
                {error && (
                  <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><ShoppingCart className="w-4 h-4" />Confirmar Solicitação</>}
                  </button>
                  <button type="button" onClick={() => setSelectedProduct(null)} className="btn-secondary">Cancelar</button>
                </div>
              </>
            )}
          </form>
        )}
      </Modal>
    </div>
  );
}
