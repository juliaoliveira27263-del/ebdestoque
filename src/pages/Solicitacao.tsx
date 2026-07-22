import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Factory, ChevronRight, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Industry, Product } from '../lib/types';
import { useTheme } from '../lib/theme';

export default function Solicitacao() {
  const { theme } = useTheme();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const isDark = theme === 'dark';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: industriesData }, { data: productsData }] = await Promise.all([
        supabase.from('industries').select('*').eq('active', true).order('name'),
        supabase.from('products').select('id, industry_id, active, stock_quantity').eq('active', true),
      ]);
      const indList = (industriesData as Industry[] | null) ?? [];
      const prodList = (productsData as Product[] | null) ?? [];
      setIndustries(indList);
      const counts: Record<string, number> = {};
      prodList.forEach((p: Product) => {
        if (p.industry_id && p.stock_quantity > 0) { counts[p.industry_id] = (counts[p.industry_id] ?? 0) + 1; }
      });
      setProductCounts(counts);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Carregando indústrias...</div></div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Solicitação de Materiais</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Selecione uma indústria para visualizar os materiais disponíveis</p>
      </div>
      {industries.length === 0 ? (
        <div className="text-center py-16"><Factory size={48} className={`mx-auto mb-4 ${isDark ? 'text-dark-600' : 'text-gray-300'}`} /><p className={`text-sm ${isDark ? 'text-dark-400' : 'text-gray-500'}`}>Nenhuma indústria disponível</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {industries.map((industry: Industry) => {
            const count = productCounts[industry.id] ?? 0;
            return (
              <Link key={industry.id} to={`/industria/${industry.id}`} className={`group p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${isDark ? 'bg-dark-900 border-dark-800 hover:border-dark-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {industry.logo_url ? <img src={industry.logo_url} alt={industry.name} className="w-12 h-12 rounded-xl object-cover shrink-0" /> : <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-dark-800' : 'bg-gray-100'}`}><Factory size={24} className={isDark ? 'text-dark-400' : 'text-gray-400'} /></div>}
                    <div className="min-w-0"><h3 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{industry.name}</h3><div className={`flex items-center gap-1 text-xs mt-0.5 ${isDark ? 'text-dark-400' : 'text-gray-500'}`}><Package size={12} /><span>{count} {count === 1 ? 'material' : 'materiais'}</span></div></div>
                  </div>
                  <div className={`p-2 rounded-lg transition-colors ${isDark ? 'group-hover:bg-dark-800' : 'group-hover:bg-gray-100'}`}><ChevronRight size={20} className={isDark ? 'text-dark-400 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'} /></div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
