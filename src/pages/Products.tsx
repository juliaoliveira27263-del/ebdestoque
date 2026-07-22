import { useEffect, useState, useMemo } from 'react';
import {
  Package, Plus, Search, Edit2, Trash2, ImagePlus, X, AlertCircle, ChevronDown, ChevronRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import type { Product, Industry, Category } from '../lib/types';
import Modal from '../components/Modal';

const units = ['un', 'kg', 'g', 'L', 'mL', 'cx', 'pct', 'm', 'm²'];

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [form, setForm] = useState({
    name: '', description: '', sku: '', industry_id: '', category_id: '',
    stock_quantity: '0', min_stock: '0', unit: 'un', active: true, image_url: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [p, i, c] = await Promise.all([
      supabase.from('products').select('*, industry:industries(*), category:categories(*)').order('name'),
      supabase.from('industries').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts(p.data as Product[] ?? []);
    setIndustries(i.data as Industry[] ?? []);
    setCategories(c.data as Category[] ?? []);
    setLoading(false);
  };

  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const q = search.toLowerCase();
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.industry?.name.toLowerCase().includes(q)
    );
  }, [products, search]);

  const industryNames: Record<string, string> = useMemo(() => {
    const names: Record<string, string> = {};
    filteredProducts.forEach((p) => {
      const indId = p.industry_id ?? 'no-industry';
      names[indId] = p.industry?.name?.trim() ?? 'Sem Indústria';
    });
    return names;
  }, [filteredProducts]);

  const productsByIndustry = useMemo(() => {
    const map: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      const indId = p.industry_id ?? 'no-industry';
      if (!map[indId]) map[indId] = [];
      map[indId].push(p);
    });
    return map;
  }, [filteredProducts]);

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', sku: '', industry_id: '', category_id: '', stock_quantity: '0', min_stock: '0', unit: 'un', active: true, image_url: '' });
    setImagePreview(null); setError(null); setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description ?? '', sku: product.sku ?? '',
      industry_id: product.industry_id ?? '', category_id: product.category_id ?? '',
      stock_quantity: String(product.stock_quantity), min_stock: String(product.min_stock),
      unit: product.unit, active: product.active, image_url: product.image_url ?? '',
    });
    setImagePreview(product.image_url); setError(null); setModalOpen(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true); setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 12)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
      setImagePreview(publicUrl);
      setForm((prev) => ({ ...prev, image_url: publicUrl }));
    } catch (err: any) {
      setError('Erro ao fazer upload da imagem: ' + err.message);
    } finally { setUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setError(null);
    if (!form.industry_id) { setError('Selecione uma indústria'); setSubmitting(false); return; }
    const payload = {
      name: form.name, description: form.description || null, sku: form.sku || null,
      industry_id: form.industry_id, category_id: form.category_id || null,
      stock_quantity: parseInt(form.stock_quantity) || 0, min_stock: parseInt(form.min_stock) || 0,
      unit: form.unit, active: form.active, image_url: form.image_url || null,
    };
    try {
      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }
      setModalOpen(false); await fetchData();
    } catch (err: any) { setError(err.message); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteId);
    if (error) { setError(error.message); } else { setDeleteId(null); await fetchData(); }
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
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-dark-400 text-sm mt-1">{products.length} produtos cadastrados</p>
        </div>
        {isAdmin && <button onClick={openCreate} className="btn-primary"><Plus className="w-5 h-5" />Novo Produto</button>}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" placeholder="Buscar por nome, SKU ou indústria..." />
      </div>

      <div className="space-y-3">
        {Object.keys(industryNames).length === 0 ? (
          <div className="card p-8 text-center">
            <Package className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400">Nenhum produto encontrado.</p>
          </div>
        ) : (
          Object.entries(industryNames).map(([indId, indName]) => {
            const indProducts = productsByIndustry[indId] ?? [];
            const isExpanded = expandedIndustry === indId || !!search;
            return (
              <div key={indId} className="card overflow-hidden">
                <button onClick={() => setExpandedIndustry(isExpanded ? null : indId)} className="w-full flex items-center gap-3 p-4 hover:bg-dark-700/50 transition-colors">
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-primary-500" /> : <ChevronRight className="w-5 h-5 text-dark-400" />}
                  <div className="w-10 h-10 rounded-lg bg-primary-600/15 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-semibold">{indName}</p>
                    <p className="text-dark-400 text-xs">{indProducts.length} produto(s)</p>
                  </div>
                  <span className="text-dark-300 text-sm font-medium">{indProducts.reduce((s, p) => s + p.stock_quantity, 0)} em estoque</span>
                </button>
                {isExpanded && (
                  <div className="border-t border-dark-700 divide-y divide-dark-700/50">
                    {indProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 hover:bg-dark-700/30 transition-colors">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0 bg-dark-600" loading="lazy" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-dark-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-white text-sm font-medium truncate">{product.name}</p>
                            {!product.active && <span className="badge-neutral">Inativo</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-dark-400 mt-0.5">
                            {product.sku && <span>SKU: {product.sku}</span>}
                            <span>{product.unit}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {product.stock_quantity <= product.min_stock ? (
                            <span className="badge-error">{product.stock_quantity} {product.unit}</span>
                          ) : (
                            <span className="badge-success">{product.stock_quantity} {product.unit}</span>
                          )}
                          <p className="text-dark-400 text-xs mt-1">mín: {product.min_stock}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEdit(product)} className="p-2 rounded-lg text-dark-400 hover:text-primary-500 hover:bg-dark-700 transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteId(product.id)} className="p-2 rounded-lg text-dark-400 hover:text-error-500 hover:bg-dark-700 transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Foto do Produto</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg overflow-hidden bg-dark-700 border border-dark-600 flex items-center justify-center shrink-0">
                {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-dark-400" />}
              </div>
              <div className="flex-1">
                <label className="btn-secondary cursor-pointer">
                  <ImagePlus className="w-4 h-4" />{uploadingImage ? 'Enviando...' : 'Enviar imagem'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handleImageUpload(file); }} disabled={uploadingImage} />
                </label>
                {imagePreview && (
                  <button type="button" onClick={() => { setImagePreview(null); setForm((prev) => ({ ...prev, image_url: '' })); }} className="btn-ghost ml-2 text-sm">
                    <X className="w-4 h-4" />Remover
                  </button>
                )}
                <p className="text-dark-400 text-xs mt-1">JPG, PNG ou WEBP. Máx 5MB.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nome *</label>
              <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input" required />
            </div>
            <div>
              <label className="label">SKU / Código</label>
              <input type="text" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="label">Indústria *</label>
              <select value={form.industry_id} onChange={(e) => setForm((p) => ({ ...p, industry_id: e.target.value }))} className="input" required>
                <option value="">Selecione...</option>
                {industries.map((ind) => <option key={ind.id} value={ind.id}>{ind.name.trim()}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Categoria</label>
              <select value={form.category_id} onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))} className="input">
                <option value="">Sem categoria</option>
                {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unidade de Medida *</label>
              <select value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} className="input" required>
                {units.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantidade em Estoque *</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm((p) => ({ ...p, stock_quantity: e.target.value }))} className="input" required min="0" />
            </div>
            <div>
              <label className="label">Estoque Mínimo *</label>
              <input type="number" value={form.min_stock} onChange={(e) => setForm((p) => ({ ...p, min_stock: e.target.value }))} className="input" required min="0" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Descrição</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="input min-h-[80px] resize-y" rows={3} />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.active ? 'true' : 'false'} onChange={(e) => setForm((p) => ({ ...p, active: e.target.value === 'true' }))} className="input">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-500/10 border border-error-500/30 text-error-500 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : editingProduct ? 'Salvar' : 'Criar Produto'}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Produto" size="sm">
        <p className="text-dark-300 mb-4">Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.</p>
        <div className="flex gap-3">
          <button onClick={handleDelete} className="btn-danger flex-1"><Trash2 className="w-4 h-4" />Excluir</button>
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancelar</button>
        </div>
      </Modal>
    </div>
  );
}
