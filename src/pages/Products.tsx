import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { exportToCSV } from '../lib/csv';
import type { Product, Industry, Category } from '../lib/types';

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  stock_quantity: number;
  min_stock: number;
  unit: string;
  industry_id: string;
  category_id: string;
  image_url: string;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  sku: '',
  stock_quantity: 0,
  min_stock: 0,
  unit: 'un',
  industry_id: '',
  category_id: '',
  image_url: '',
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [productsRes, industriesRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('created_at', { ascending: false }),
        supabase.from('industries').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ]);
      setProducts((productsRes.data as Product[] | null) ?? []);
      setIndustries((industriesRes.data as Industry[] | null) ?? []);
      setCategories((categoriesRes.data as Category[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  function getIndustryName(id: string | null): string {
    if (!id) return '-';
    const ind = industries.find((i) => i.id === id);
    return ind ? ind.name : '-';
  }

  function getCategoryName(id: string | null): string {
    if (!id) return '-';
    const cat = categories.find((c) => c.id === id);
    return cat ? cat.name : '-';
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      stock_quantity: product.stock_quantity,
      min_stock: product.min_stock,
      unit: product.unit,
      industry_id: product.industry_id ?? '',
      category_id: product.category_id ?? '',
      image_url: product.image_url ?? '',
    });
    setModalOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: Number(value) }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || null,
        sku: form.sku || null,
        stock_quantity: form.stock_quantity,
        min_stock: form.min_stock,
        unit: form.unit,
        industry_id: form.industry_id || null,
        category_id: form.category_id || null,
        image_url: form.image_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingId);
        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Produto criado com sucesso');
      }
      setModalOpen(false);
      fetchAll();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Desativar o produto "${product.name}"?`)) return;
    try {
      const { error } = await supabase.from('products').update({ active: false }).eq('id', product.id);
      if (error) throw error;
      toast.success('Produto desativado');
      fetchAll();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao desativar produto');
    }
  }

  function handleExport() {
    const headers = ['Nome', 'SKU', 'Indústria', 'Categoria', 'Estoque', 'Estoque Mín', 'Unidade', 'Status'];
    const rows = filtered.map((p) => [
      p.name,
      p.sku ?? '',
      getIndustryName(p.industry_id),
      getCategoryName(p.category_id),
      p.stock_quantity,
      p.min_stock,
      p.unit,
      p.active ? 'Ativo' : 'Inativo',
    ]);
    exportToCSV('produtos', headers, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-dark-400 mt-1">Gerencie os produtos do sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition"
          >
            <Download size={18} /> Exportar
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={18} /> Novo produto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
        <input
          type="text"
          placeholder="Buscar por nome ou SKU..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-dark-400">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-950 border-b border-dark-800">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Nome</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">SKU</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Indústria</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Estoque</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Mín</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Status</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-dark-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-dark-400">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-dark-950">
                      <td className="px-4 py-3 text-white">{product.name}</td>
                      <td className="px-4 py-3 text-dark-400">{product.sku ?? '-'}</td>
                      <td className="px-4 py-3 text-dark-400">{getIndustryName(product.industry_id)}</td>
                      <td className="px-4 py-3 text-white">{product.stock_quantity} {product.unit}</td>
                      <td className="px-4 py-3 text-dark-400">{product.min_stock}</td>
                      <td className="px-4 py-3">
                        {product.active ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="error">Inativo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(product)}
                            className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="p-2 text-dark-400 hover:text-red-400 hover:bg-dark-800 rounded transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar produto' : 'Novo produto'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Nome *</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Descrição</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Unidade</label>
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Quantidade em estoque</label>
              <input
                type="number"
                name="stock_quantity"
                min={0}
                value={form.stock_quantity}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Estoque mínimo</label>
              <input
                type="number"
                name="min_stock"
                min={0}
                value={form.min_stock}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dark-400 mb-1">Indústria</label>
              <select
                name="industry_id"
                value={form.industry_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecione...</option>
                {industries.map((ind) => (
                  <option key={ind.id} value={ind.id}>{ind.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-dark-400 mb-1">Categoria</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Selecione...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">URL da imagem</label>
            <input
              type="text"
              name="image_url"
              value={form.image_url}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 bg-dark-800 text-white rounded-lg hover:bg-dark-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
