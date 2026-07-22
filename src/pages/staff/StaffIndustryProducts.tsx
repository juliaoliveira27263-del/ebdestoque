import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Industry, Product } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ArrowLeft, Building2, Loader2, ShoppingCart, Search, Minus, Plus, Check, X, Package } from 'lucide-react'

export default function StaffIndustryProducts() {
  const { industryId } = useParams<{ industryId: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [industry, setIndustry] = useState<Industry | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showCart, setShowCart] = useState(false)

  useEffect(() => { fetchData() }, [industryId])

  async function fetchData() {
    setLoading(true)
    const [{ data: ind }, { data: prods }] = await Promise.all([
      supabase.from('industries').select('*').eq('id', industryId).single(),
      supabase.from('products').select('*').eq('industry_id', industryId).eq('active', true).order('name')
    ])
    setIndustry(ind as Industry | null)
    setProducts(prods as Product[] ?? [])
    setLoading(false)
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()))

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const next = Math.max(0, (prev[productId] ?? 0) + delta)
      const updated = { ...prev }
      if (next === 0) delete updated[productId]; else updated[productId] = next
      return updated
    })
  }
  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const updated = { ...prev }
      if (qty <= 0) delete updated[productId]; else updated[productId] = qty
      return updated
    })
  }

  const cartCount = Object.keys(cart).length
  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartProducts = Object.entries(cart).map(([pid, qty]) => ({ product: products.find((p) => p.id === pid)!, qty })).filter((c) => c.product)

  async function submitRequest() {
    if (!profile || cartCount === 0) return
    setSubmitting(true)
    const { data: request, error } = await supabase.from('requests').insert({ user_id: profile.id, status: 'pending', total_items: cartTotalItems }).select().single()
    if (error) { console.error(error); setSubmitting(false); return }
    const items = Object.entries(cart).map(([productId, quantity]) => ({ request_id: request.id, product_id: productId, quantity, industry_id: industryId }))
    const { error: itemsError } = await supabase.from('request_items').insert(items)
    if (itemsError) console.error(itemsError)
    setSubmitting(false); setSuccess(true); setCart({}); setShowCart(false)
    setTimeout(() => navigate('/minhas-solicitacoes'), 1500)
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-ebd-700 animate-spin" /></div>

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-success-100 flex items-center justify-center mb-4"><Check className="w-10 h-10 text-success-600" /></div>
        <h3 className="text-2xl font-bold text-neutral-900 mb-1">Solicitacao enviada!</h3>
        <p className="text-neutral-500 text-sm">Redirecionando para suas solicitacoes...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-ebd-700 mb-4 transition-colors"><ArrowLeft className="w-4 h-4" /> Voltar para industrias</button>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-ebd-50 flex items-center justify-center overflow-hidden">
          {industry?.logo_url ? <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-cover" /> : <Building2 className="w-8 h-8 text-ebd-700" />}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{industry?.name.trim()}</h2>
          <p className="text-neutral-500 text-sm">{products.length} produtos disponiveis</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto por nome ou codigo..." className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 bg-white focus:ring-2 focus:ring-ebd-700 focus:border-transparent transition-all outline-none" />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhum produto encontrado</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-32">
          {filtered.map((product, i) => {
            const qty = cart[product.id] ?? 0
            return (
              <div key={product.id} className={`bg-white rounded-2xl border p-4 transition-all animate-slide-up ${qty > 0 ? 'border-ebd-300 shadow-card' : 'border-neutral-200'}`} style={{ animationDelay: `${i * 40}ms` }}>
                <div className="aspect-square rounded-xl bg-neutral-100 mb-3 overflow-hidden flex items-center justify-center">
                  {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-10 h-10 text-neutral-300" />}
                </div>
                <div className="mb-1"><span className="text-xs text-neutral-400 font-mono">Cod: {product.sku}</span></div>
                <h3 className="font-medium text-neutral-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
                {product.description && <p className="text-xs text-neutral-500 mb-3 line-clamp-2">{product.description}</p>}
                {qty > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <button onClick={() => updateQty(product.id, -1)} className="w-9 h-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"><Minus className="w-4 h-4" /></button>
                    <input type="number" value={qty} onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)} className="w-14 text-center font-semibold text-neutral-900 border border-neutral-200 rounded-xl py-1.5 outline-none focus:ring-2 focus:ring-ebd-700" />
                    <button onClick={() => updateQty(product.id, 1)} className="w-9 h-9 rounded-xl gradient-ebd text-white flex items-center justify-center transition-all shadow-ebd"><Plus className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => updateQty(product.id, 1)} className="w-full py-2 rounded-xl bg-ebd-50 text-ebd-700 font-medium text-sm hover:bg-ebd-100 transition-colors">Adicionar</button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 bg-white border-t border-neutral-200 p-4 shadow-elevated animate-fade-in z-30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full gradient-ebd text-white flex items-center justify-center font-semibold shadow-ebd">{cartTotalItems}</div>
              <div><p className="font-semibold text-neutral-900 text-sm">{cartCount} produto(s) selecionado(s)</p><p className="text-xs text-neutral-500">{cartTotalItems} itens no total</p></div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCart(true)} className="px-4 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-medium text-sm hover:bg-neutral-50 transition-colors">Ver resumo</button>
              <button onClick={submitRequest} disabled={submitting} className="gradient-ebd hover:opacity-90 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-ebd disabled:opacity-50 flex items-center gap-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                {submitting ? 'Enviando...' : 'Enviar Solicitacao'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowCart(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-neutral-900">Resumo da Solicitacao</h3><button onClick={() => setShowCart(false)} className="p-2 rounded-lg hover:bg-neutral-100"><X className="w-5 h-5 text-neutral-400" /></button></div>
            <div className="space-y-2 mb-4">
              {cartProducts.map(({ product, qty }) => (
                <div key={product.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-neutral-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-neutral-300" />}
                    </div>
                    <div><p className="text-sm font-medium text-neutral-900">{product.name}</p><p className="text-xs text-neutral-400">Cod: {product.sku}</p></div>
                  </div>
                  <span className="font-semibold text-neutral-900">{qty} un</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-4 pt-3 border-t border-neutral-200"><span className="text-sm text-neutral-500">Total de itens</span><span className="font-bold text-lg text-neutral-900">{cartTotalItems}</span></div>
            <button onClick={submitRequest} disabled={submitting} className="w-full gradient-ebd hover:opacity-90 text-white font-medium py-3 rounded-xl transition-all shadow-ebd disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
              {submitting ? 'Enviando...' : 'Enviar Solicitacao'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
