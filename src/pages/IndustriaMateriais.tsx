import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Check, AlertCircle, Minus, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Industry, Product, Request as RequestType } from '../lib/types';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { toast } from 'sonner';

interface RequestItemWithProduct {
  id: string;
  request_id: string;
  product_id: string;
  quantity: number;
  industry_id: string | null;
  created_at: string;
  product_name?: string;
  product_sku?: string;
}

export default function IndustriaMateriais() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [industry, setIndustry] = useState<Industry | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [observation, setObservation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      const [{ data: indData }, { data: prodData }] = await Promise.all([
        supabase.from('industries').select('*').eq('id', id).maybeSingle(),
        supabase.from('products').select('*').eq('industry_id', id).eq('active', true).order('name'),
      ]);
      setIndustry(indData as Industry | null);
      setProducts((prodData as Product[] | null) ?? []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setObservation('');
    setSuccess(false);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedProduct || !profile) return;
    if (quantity > selectedProduct.stock_quantity) {
      toast.error('Quantidade indisponível em estoque');
      return;
    }
    setSubmitting(true);
    const { data: requestData, error: reqError } = await supabase.from('requests').insert({
      user_id: profile.id, status: 'pending', total_items: quantity, notes: observation || null,
    }).select().single();
    if (reqError) { toast.error(reqError.message); setSubmitting(false); return; }
    const request = requestData as RequestType;
    await supabase.from('request_items').insert({
      request_id: request.id, product_id: selectedProduct.id, quantity, industry_id: id ?? null,
    });
    const { data: adminProfiles } = await supabase.from('profiles').select('id').eq('role', 'admin');
    const admins = (adminProfiles as { id: string }[] | null) ?? [];
    if (admins.length > 0) {
      await supabase.from('notifications').insert(
        admins.map((a: { id: string }) => ({
          user_id: a.id, type: 'new_request', title: 'Nova Solicitação',
          message: `${profile.name} solicitou ${quantity}x ${selectedProduct.name}`,
          related_id: request.id, read: false,
        }))
      );
    }
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => { closeModal(); }, 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Carregando materiais...</div>
      </div>
    );
  }

  if (!industry) {
    return (
      <div className="p-6 text-center">
        <p className={isDark ? 'text-dark-400' : 'text-gray-500'}>Indústria não encontrada</p>
        <button onClick={() => navigate('/solicitacao')} className="mt-4 text-primary hover:underline">Voltar</button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/solicitacao')}
        className={`flex items-center gap-2 text-sm mb-6 transition-colors ${isDark ? 'text-dark-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
      >
        <ArrowLeft size={18} /> Voltar
      </button>

      <div className="flex items-center gap-4 mb-6">
        {industry.logo_url ? (
          <img src={industry.logo_url} alt={industry.name} className="w-16 h-16 rounded-2xl object-cover" />
        ) : (
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}>
            <Package size={28} className={isDark ? 'text-dark-400' : 'text-gray-400'} />
          </div>
        )}
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{industry.name}</h1>
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
            {products.length} {products.length === 1 ? 'material disponível' : 'materiais disponíveis'}
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className={`mx-auto mb-4 ${isDark ? 'text-dark-600' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Nenhum material disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {products.map((product: Product) => (
            <div key={product.id} className={`rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200 shadow-sm'}`}>
              <div className={`aspect-square flex items-center justify-center ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={48} className={isDark ? 'text-dark-600' : 'text-gray-300'} />
                )}
              </div>
              <div className="p-4">
                <h3 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</h3>
                <p className={`text-xs mb-2 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Código: {product.sku ?? 'N/A'}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Estoque: {product.stock_quantity} {product.unit}</span>
                  {product.stock_quantity === 0 && <span className="text-xs text-error-500 font-medium">Esgotado</span>}
                </div>
                <button
                  onClick={() => openModal(product)}
                  disabled={product.stock_quantity === 0}
                  className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Solicitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl border animate-scale-in max-h-[90vh] overflow-y-auto ${isDark ? 'bg-dark-900 border-dark-800' : 'bg-white border-gray-200'}`}>
            {success ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-success-500 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                  <Check size={32} className="text-white" />
                </div>
                <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitação Enviada!</h3>
                <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Sua solicitação foi enviada para aprovação.</p>
              </div>
            ) : (
              <>
                <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-dark-800' : 'border-gray-200'}`}>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitar Material</h2>
                  <button onClick={closeModal} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-dark-800 text-dark-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                  <div className={`p-3 rounded-xl ${isDark ? 'bg-dark-800' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      {selectedProduct.image_url ? (
                        <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? 'bg-dark-700' : 'bg-gray-200'}`}>
                          <Package size={20} className={isDark ? 'text-dark-400' : 'text-gray-400'} />
                        </div>
                      )}
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedProduct.name}</p>
                        <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Estoque: {selectedProduct.stock_quantity} {selectedProduct.unit}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Quantidade</label>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white hover:bg-dark-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                        <Minus size={16} />
                      </button>
                      <input type="number" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(Math.max(1, Number(e.target.value)))} min={1} max={selectedProduct.stock_quantity}
                        className={`flex-1 px-4 py-2.5 rounded-xl border outline-none text-center font-semibold ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`} />
                      <button type="button" onClick={() => setQuantity(Math.min(selectedProduct.stock_quantity, quantity + 1))}
                        className={`p-2.5 rounded-xl border transition-colors ${isDark ? 'bg-dark-800 border-dark-700 text-white hover:bg-dark-700' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}>
                        <Plus size={16} />
                      </button>
                    </div>
                    {quantity > selectedProduct.stock_quantity && (
                      <div className="flex items-center gap-2 mt-2 text-error-500 text-sm">
                        <AlertCircle size={16} /> Quantidade indisponível em estoque
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-dark-200' : 'text-gray-700'}`}>Observação</label>
                    <textarea value={observation} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setObservation(e.target.value)} rows={3}
                      className={`w-full px-4 py-2.5 rounded-xl border outline-none resize-none ${isDark ? 'bg-dark-800 border-dark-700 text-white focus:border-primary' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary'}`}
                      placeholder="Alguma observação sobre a solicitação?" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={closeModal}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${isDark ? 'bg-dark-800 text-white hover:bg-dark-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={submitting || quantity > selectedProduct.stock_quantity}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50">
                      {submitting ? 'Enviando...' : 'Confirmar'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
