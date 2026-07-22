import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Industry } from '../../lib/supabase'
import { Building2, ChevronRight, Package, Loader2 } from 'lucide-react'

export default function StaffIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: inds } = await supabase
      .from('industries')
      .select('*')
      .eq('active', true)
      .order('name')

    if (inds) {
      setIndustries(inds as Industry[])

      const counts: Record<string, number> = {}
      for (const ind of inds) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('industry_id', ind.id)
          .eq('active', true)
        counts[ind.id] = count ?? 0
      }
      setProductCounts(counts)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Indústrias</h2>
        <p className="text-neutral-500 text-sm mt-1">Selecione uma indústria para ver os produtos e fazer sua solicitação</p>
      </div>

      {industries.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nenhuma indústria disponível</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {industries.map((industry) => (
            <button
              key={industry.id}
              onClick={() => navigate(`/industria/${industry.id}`)}
              className="group bg-white rounded-2xl border border-neutral-200 p-5 text-left hover:border-primary-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden">
                  {industry.logo_url ? (
                    <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-7 h-7 text-primary-600" />
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1">{industry.name.trim()}</h3>
              <div className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Package className="w-4 h-4" />
                <span>{productCounts[industry.id] ?? 0} produtos</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
