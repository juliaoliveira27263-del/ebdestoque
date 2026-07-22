import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, Industry } from '../../lib/supabase'
import { Building2, ChevronRight, Package, Loader2, Search } from 'lucide-react'

export default function StaffIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([])
  const [loading, setLoading] = useState(true)
  const [productCounts, setProductCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data: inds } = await supabase.from('industries').select('*').eq('active', true).order('name')
    if (inds) {
      setIndustries(inds as Industry[])
      const counts: Record<string, number> = {}
      for (const ind of inds) {
        const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('industry_id', ind.id).eq('active', true)
        counts[ind.id] = count ?? 0
      }
      setProductCounts(counts)
    }
    setLoading(false)
  }

  const filtered = industries.filter((ind) => ind.name.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-neutral-900">Solicitar Materiais</h2>
        <p className="text-neutral-500 text-sm mt-1">Selecione uma industria para ver os produtos disponiveis e fazer sua solicitacao</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar industria..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-neutral-400"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Nenhuma industria encontrada</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((industry, i) => (
            <button key={industry.id} onClick={() => navigate(`/industria/${industry.id}`)}
              className="group bg-white rounded-2xl border border-neutral-200 p-6 text-left card-hover hover:border-ebd-300 animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-start justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-ebd-50 flex items-center justify-center overflow-hidden">
                  {industry.logo_url ? <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-ebd-700" />}
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-300 group-hover:text-ebd-700 group-hover:translate-x-1 transition-all" />
              </div>
              <h3 className="font-bold text-lg text-neutral-900 mb-2">{industry.name.trim()}</h3>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Package className="w-4 h-4" />
                <span>{productCounts[industry.id] ?? 0} produtos disponiveis</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
