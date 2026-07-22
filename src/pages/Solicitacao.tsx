import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, ChevronRight, Package, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import type { Industry, Product } from '../lib/types';

export default function Solicitacao() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      const [i, p] = await Promise.all([
        supabase.from('industries').select('*').eq('active', true).order('name'),
        supabase.from('products').select('*, industry:industries(*)').eq('active', true),
      ]);
      setIndustries(i.data as Industry[] ?? []);
      setProducts(p.data as Product[] ?? []);
      setLoading(false);
    })();
  }, []);

  const productCountByIndustry = useMemo(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      const id = p.industry_id ?? 'no-industry';
      map[id] = (map[id] ?? 0) + 1;
    });
    return map;
  }, [products]);

  const filteredIndustries = useMemo(() => {
    if (!search) return industries;
    const q = search.toLowerCase();
    return industries.filter((ind) => ind.name.toLowerCase().includes(q));
  }, [industries, search]);

  if (loading) return (<div className="flex items-center justify-center h-full p-8"><div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" /></div>);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl lg:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitação</h1>
        <p className={`mt-1.5 text-sm lg:text-base ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
          Escolha uma indústria para visualizar os materiais disponíveis.
        </p>
      </div>

      {industries.length > 6 && (
        <div className="relative mb-6 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar indústria..."
          />
        </div>
      )}

      {filteredIndustries.length === 0 ? (
        <div className={`card p-12 text-center ${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white border-gray-200 shadow-sm'}`}>
          <Factory className={`w-14 h-14 mx-auto mb-4 ${isDark ? 'text-dark-500' : 'text-gray-300'}`} />
          <p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Nenhuma indústria disponível.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {filteredIndustries.map((ind) => {
            const count = productCountByIndustry[ind.id] ?? 0;
            return (
              <button
                key={ind.id}
                onClick={() => navigate(`/industria/${ind.id}`)}
                className={`card p-5 flex items-center gap-4 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 animate-fade-in ${isDark ? 'bg-dark-800 border-dark-700 hover:border-primary-600/50' : 'bg-white border-gray-200 shadow-sm hover:border-primary-600/50'}`}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-primary-600/10 border border-primary-600/20">
                  {ind.logo_url ? (
                    <img src={ind.logo_url} alt={ind.name} className="w-full h-full object-contain p-1" />
                  ) : (
                    <Factory className="w-7 h-7 text-primary-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{ind.name.trim()}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Package className={`w-3.5 h-3.5 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
                    <p className={`text-xs ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>
                      {count} {count === 1 ? 'material disponível' : 'materiais disponíveis'}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 shrink-0 transition-transform group-hover:translate-x-1 ${isDark ? 'text-dark-400' : 'text-gray-400'}`} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
