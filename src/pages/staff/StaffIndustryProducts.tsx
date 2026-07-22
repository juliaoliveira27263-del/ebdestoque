import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, Industry, Product } from '../../lib/supabase'
import { useAuth } from '../../lib/auth'
import { ArrowLeft, Building2, Loader2, ShoppingCart, Search, Minus, Plus, Check } from 'lucide-react'

type CartItem = {
  product: Product
  quantity: number
}

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

  useEffect(() => {
    fetchData()
  }, [industryId])

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

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  )

  function updateQty(productId: string, delta: number) {
    setCart((prev) => {
      const current = prev[productId] ?? 0
      const next = Math.max(0, current + delta)
      const updated = { ...prev }
      if (next === 0) delete updated[productId]
      else updated[productId] = next
      return updated
    })
  }

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const updated = { ...prev }
      if (qty <= 0) delete updated[productId]
      else updated[productId] = qty
      return updated
    })
  }

  const cartCount = Object.keys(cart).length
  const cartTotalItems = Object.values(cart).reduce((a, b) => a + b, 0)

  async function submitRequest() {
    if (!profile || cartCount === 0) return
    setSubmitting(true)

    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        user_id: profile.id,
        status: 'pending',
        total_items: cartTotalItems,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating request:', error)
      setSubmitting(false)
      return
    }

    const items = Object.entries(cart).map(([productId, quantity]) => ({
      request_id: request.id,
      product_id: productId,
      quantity,
      industry_id: industryId,
    }))

    const { error: itemsError } = await supabase.from('request_items').insert(items)

    if (itemsError) {
      console.error('Error creating request items:', itemsError)
    }

    setSubmitting(false)
    setSuccess(true)
    setCart({})

    setTimeout(() => {
      navigate('/minhas-solicitacoes')
    }, 1500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-scaleIn">
        <div className="w-16 h-16 rounded-full bg-accent-100 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-accent-600" />
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-1">Solicitação enviada!</h3>
        <p className="text-neutral-500 text-sm">Redirecionando para suas solicitações...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto animate-fadeIn">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Voltar para indústrias
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center overflow-hidden">
          {industry?.logo_url ? (
            <img src={industry.logo_url} alt={industry.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-6 h-6 text-primary-600" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">{industry?.name.trim()}</h2>
          <p className="text-neutral-500 text-sm">{products.length} produtos disponíveis</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto por nome ou SKU..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none"
        />
      </div>

      {/* Products grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-neutral-400">
          <p>Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-28">
          {filtered.map((product) => {
            const qty = cart[product.id] ?? 0
            return (
              <div
                key={product.id}
                className={`bg-white rounded-2xl border p-4 transition-all ${
                  qty > 0 ? 'border-primary-300 shadow-md' : 'border-neutral-200'
                }`}
              >
                <div className="aspect-square rounded-xl bg-neutral-100 mb-3 overflow-hidden flex items-center justify-center">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingCart className="w-10 h-10 text-neutral-300" />
                  )}
                </div>
                <div className="mb-1">
                  <span className="text-xs text-neutral-400 font-mono">SKU: {product.sku}</span>
                </div>
                <h3 className="font-medium text-neutral-900 text-sm mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-xs text-neutral-500 mb-3">Estoque: {product.stock_quantity} {product.unit}</p>

                {qty > 0 ? (
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => updateQty(product.id, -1)}
                      className="w-9 h-9 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={qty}
                      onChange={(e) => setQty(product.id, parseInt(e.target.value) || 0)}
                      className="w-14 text-center font-semibold text-neutral-900 border border-neutral-200 rounded-lg py-1.5 outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <button
                      onClick={() => updateQty(product.id, 1)}
                      className="w-9 h-9 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => updateQty(product.id, 1)}
                    className="w-full py-2 rounded-lg bg-primary-50 text-primary-700 font-medium text-sm hover:bg-primary-100 transition-colors"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-56 bg-white border-t border-neutral-200 p-4 shadow-lg animate-fadeIn z-30">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-semibold">
                {cartTotalItems}
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm">{cartCount} produto(s) selecionado(s)</p>
                <p className="text-xs text-neutral-500">{cartTotalItems} itens no total</p>
              </div>
            </div>
            <button
              onClick={submitRequest}
              disabled={submitting}
              className="bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
              {submitting ? 'Enviando...' : 'Enviar Solicitação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
