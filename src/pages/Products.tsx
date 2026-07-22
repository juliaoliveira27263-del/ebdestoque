import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/csv';
import { Product, Industry, Category } from '../lib/types';

interface ProductWithRelations extends Product {
  industries: { name: string } | null;
  categories: { name: string } | null;
}

export default function Products() {
  const [products, setProducts] = useState<ProductWithRelations[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    industry_id: '',
    stock_quantity: '0',
    min_stock: '0',
    unit: 'un',
    image_url: '',
  });

  useEffect(() => {
    fetchProducts();
    fetchIndustries();
    fetchCategories();
  }, []);

  const fetchProducts = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, industries(name), categories(name)')
        .order('name');
      if (error) throw error;
      setProducts((data ?? []) as ProductWithRelations[]);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar produtos';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchIndustries = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) {
      toast.error('Erro ao carregar indústrias');
      return;
    }
    setIndustries(data ?? []);
  };

  const fetchCategories = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (error) {
      toast.error('Erro ao carregar categorias');
      return;
    }
    setCategories(data ?? []);
  };

  const handleOpenCreate = (): void => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      sku: '',
      category_id: '',
      industry_id: '',
      stock_quantity: '0',
      min_stock: '0',
      unit: 'un',
      image_url: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product): void => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description ?? '',
      sku: product.sku ?? '',
      category_id: product.category_id ?? '',
      industry_id: product.industry_id ?? '',
      stock_quantity: String(product.stock_quantity),
      min_stock: String(product.min_stock),
      unit: product.unit,
      image_url: product.image_url ?? '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        sku: formData.sku || null,
        category_id: formData.category_id || null,
        industry_id: formData.industry_id || null,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        min_stock: parseInt(formData.min_stock, 10) || 0,
        unit: formData.unit,
        image_url: formData.image_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        toast.success('Produto criado com sucesso');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar produto';
      toast.error(message);
    }
  };

  const handleDelete = async (product: Product): Promise<void> => {
    if (!confirm(`Desativar o produto "${product.name}"?`)) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({ active: false })
        .eq('id', product.id);
      if (error) throw error;
      toast.success('Produto desativado');
      fetchProducts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao desativar produto';
      toast.error(message);
    }
  };

  const handleExportCSV = (): void => {
    const headers = ['Nome', 'SKU', 'Indústria', 'Categoria', 'Estoque', 'Estoque Mín', 'Unidade', 'Status'];
    const rows = filteredProducts.map((p: ProductWithRelations) => [
      p.name,
      p.sku ?? '',
      p.industries?.name ?? '',
      p.categories?.name ?? '',
      p.stock_quantity,
      p.min_stock,
      p.unit,
      p.active ? 'Ativo' : 'Inativo',
    ]);
    exportToCSV('produtos.csv', headers, rows);
  };

  const filteredProducts = products.filter((p: ProductWithRelations) => {
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      (p.sku ?? '').toLowerCase().includes(searchLower) ||
      (p.industries?.name ?? '').toLowerCase().includes(searchLower)
    );
  });

  const stockVariant = (product: Product): 'success' | 'warning' | 'error' => {
    if (product.stock_quantity === 0) return 'error';
    if (product.stock_quantity <= product.min_stock) return 'warning';
    return 'success';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Produtos</h1>
          <p className="text-dark-400 mt-1">Gerenciar produtos do catálogo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-dark-800 border border-dark-700 text-white rounded-lg hover:bg-dark-700 transition-colors"
          >
            <Download size={18} />
            Exportar
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, SKU ou indústria..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-dark-400"
        />
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left p-4 text-dark-300 font-semibold">Nome</th>
                <th className="text-left p-4 text-dark-300 font-semibold">SKU</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Indústria</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Estoque</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Status</th>
                <th className="text-right p-4 text-dark-300 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product: ProductWithRelations) => (
                  <tr
                    key={product.id}
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="p-4 text-white">{product.name}</td>
                    <td className="p-4 text-dark-300">{product.sku ?? '-'}</td>
                    <td className="p-4 text-dark-300">
                      {product.industries?.name ?? '-'}
                    </td>
                    <td className="p-4">
                      <span className="text-white">
                        {product.stock_quantity} {product.unit}
                      </span>
                      {product.stock_quantity <= product.min_stock && (
                        <span className="text-warning-500 text-xs ml-2">Mín: {product.min_stock}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Badge variant={stockVariant(product)}>
                          {product.stock_quantity === 0
                            ? 'Sem estoque'
                            : product.stock_quantity <= product.min_stock
                            ? 'Estoque baixo'
                            : 'Em estoque'}
                        </Badge>
                        {!product.active && <Badge variant="default">Inativo</Badge>}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="p-2 text-dark-300 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="p-2 text-dark-300 hover:text-error-500 hover:bg-dark-700 rounded-lg transition-colors"
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
      </div>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">Nome *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-300 text-sm mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-sm mb-1">Unidade</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Indústria</label>
            <select
              value={formData.industry_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, industry_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {industries.map((industry: Industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Categoria</label>
            <select
              value={formData.category_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, category_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {categories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-dark-300 text-sm mb-1">Estoque</label>
              <input
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-dark-300 text-sm mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, min_stock: e.target.value })
                }
                className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-dark-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {editingProduct ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
