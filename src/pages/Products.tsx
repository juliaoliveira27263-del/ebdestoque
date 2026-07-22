import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product, Industry, Category } from '../lib/types';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/csv';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', sku: '', stock_quantity: 0, min_stock: 0,
    unit: 'un', industry_id: '', category_id: '', image_url: '',
  });

  const fetchData = async () => {
    setLoading(true);
    const [{ data: productsData }, { data: industriesData }, { data: categoriesData }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('industries').select('*').eq('active', true).order('name'),
      supabase.from('categories').select('*').order('name'),
    ]);
    setProducts((productsData as Product[] | null) ?? []);
    setIndustries((industriesData as Industry[] | null) ?? []);
    setCategories((categoriesData as Category[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditingProduct(null);
    setForm({ name: '', description: '', sku: '', stock_quantity: 0, min_stock: 0, unit: 'un', industry_id: '', category_id: '', image_url: '' });
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name, description: product.description ?? '', sku: product.sku ?? '',
      stock_quantity: product.stock_quantity, min_stock: product.min_stock, unit: product.unit,
      industry_id: product.industry_id ?? '', category_id: product.category_id ?? '',
      image_url: product.image_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: form.name, description: form.description || null, sku: form.sku || null,
      stock_quantity: Number(form.stock_quantity), min_stock: Number(form.min_stock),
      unit: form.unit, industry_id: form.industry_id || null,
      category_id: form.category_id || null, image_url: form.image_url || null,
      active: true,
    };
    if (editingProduct) {
      const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto atualizado!');
    } else {
      const { error } = await supabase.from('products').insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success('Produto criado!');
    }
    setModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    const { error } = await supabase.from('products').update({ active: false }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Produto desativado!');
    fetchData();
  };

  const handleExport = () => {
    exportToCSV('produtos.csv', ['Nome', 'SKU', 'Estoque', 'Estoque Min', 'Unidade', 'Indústria'],
      filtered.map(p => [
        p.name, p.sku ?? '', p.stock_quantity, p.min_stock, p.unit,
        industries.find(i => i.id === p.industry_id)?.name ?? '',
      ]));
  };

  const getIndustryName = (id: string | null) => industries.find(i => i.id === id)?.name ?? '-';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-dark-400 text-sm mt-1">Gerenciar produtos do estoque</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-dark-800 text-white text-sm font-medium hover:bg-dark-700 transition-colors">
            Exportar CSV
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-700 transition-colors">
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou SKU..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-dark-900 border border-dark-800 text-white outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-400">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Package size={48} className="text-dark-600 mx-auto mb-4" />
          <p className="text-dark-400">Nenhum produto encontrado</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-dark-900 border border-dark-800 rounded-xl">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-800">
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Produto</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">SKU</th>
                <th className="text-left p-4 text-dark-300 text-sm font-semibold">Indústria</th>
                <th className="text-right p-4 text-dark-300 text-sm font-semibold">Estoque</th>
                <th className="text-right p-4 text-dark-300 text-sm font-semibold">Min</th>
                <th className="text-center p-4 text-dark-300 text-sm font-semibold">Status</th>
                <th className="text-right p-4 text-dark-300 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-dark-800 last:border-0 hover:bg-dark-800/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                          <Package size={18} className="text-dark-400" />
                        </div>
                      )}
                      <span className="text-white text-sm font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-dark-300 text-sm">{product.sku ?? '-'}</td>
                  <td className="p-4 text-dark-300 text-sm">{getIndustryName(product.industry_id)}</td>
                  <td className="p-4 text-right text-white text-sm font-medium">{product.stock_quantity} {product.unit}</td>
                  <td className="p-4 text-right text-dark-300 text-sm">{product.min_stock}</td>
                  <td className="p-4 text-center">
                    {product.stock_quantity === 0 ? (
                      <Badge variant="error">Sem estoque</Badge>
                    ) : product.stock_quantity <= product.min_stock ? (
                      <Badge variant="warning">Baixo</Badge>
                    ) : (
                      <Badge variant="success">Normal</Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-white transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded-lg hover:bg-dark-700 text-dark-300 hover:text-error-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Nome *</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">SKU</label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Unidade</label>
              <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Estoque</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: Number(e.target.value) })} min={0}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-1.5">Estoque Mínimo</label>
              <input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })} min={0}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Indústria</label>
            <select value={form.industry_id} onChange={(e) => setForm({ ...form, industry_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary">
              <option value="">Selecione...</option>
              {industries.map(ind => <option key={ind.id} value={ind.id}>{ind.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">Categoria</label>
            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary">
              <option value="">Selecione...</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-200 mb-1.5">URL da Imagem</label>
            <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-dark-800 border border-dark-700 text-white outline-none focus:border-primary" placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-lg bg-dark-800 text-white font-medium hover:bg-dark-700 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="flex-1 py-2.5 rounded-lg bg-primary text-white font-semibold hover:bg-primary-700 transition-colors">
              {editingProduct ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
