import { useEffect, useState } from 'react';
import { Plus, Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from 'sonner';
import { exportToCSV } from '../lib/csv';
import { Movement, MovementType, Product, movementTypeLabels } from '../lib/types';

interface MovementWithProduct extends Movement {
  product_name: string | undefined;
  product_sku: string | undefined;
}

export default function Movements() {
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    product_id: '',
    type: 'in' as MovementType,
    quantity: '1',
    reason: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, []);

  const fetchMovements = async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*, products(name, sku)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map((m: Movement & { products: { name: string; sku: string | null } | null }) => ({
        ...m,
        product_name: m.products?.name,
        product_sku: m.products?.sku ?? undefined,
      }));
      setMovements(mapped);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar movimentações';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (): Promise<void> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');
    if (error) {
      toast.error('Erro ao carregar produtos');
      return;
    }
    setProducts(data ?? []);
  };

  const handleOpenCreate = (): void => {
    setFormData({
      product_id: '',
      type: 'in',
      quantity: '1',
      reason: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    try {
      const product = products.find((p: Product) => p.id === formData.product_id);
      if (!product) {
        toast.error('Selecione um produto');
        return;
      }

      const quantity = parseInt(formData.quantity, 10);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('Quantidade inválida');
        return;
      }

      // Create movement
      const { error: movementError } = await supabase.from('movements').insert({
        product_id: formData.product_id,
        type: formData.type,
        quantity,
        reason: formData.reason || null,
      });
      if (movementError) throw movementError;

      // Update stock
      let newStock = product.stock_quantity;
      if (formData.type === 'in') {
        newStock += quantity;
      } else if (formData.type === 'out') {
        newStock = Math.max(0, newStock - quantity);
      } else {
        // adjustment: set to the quantity value directly
        newStock = quantity;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', product.id);
      if (updateError) throw updateError;

      toast.success('Movimentação registrada com sucesso');
      setModalOpen(false);
      fetchMovements();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar movimentação';
      toast.error(message);
    }
  };

  const handleExportCSV = (): void => {
    const headers = ['Produto', 'SKU', 'Tipo', 'Quantidade', 'Motivo', 'Data'];
    const rows = filteredMovements.map((m: MovementWithProduct) => [
      m.product_name ?? '',
      m.product_sku ?? '',
      movementTypeLabels[m.type],
      m.quantity,
      m.reason ?? '',
      new Date(m.created_at).toLocaleDateString('pt-BR'),
    ]);
    exportToCSV('movimentacoes.csv', headers, rows);
  };

  const filteredMovements = movements.filter((m: MovementWithProduct) => {
    const matchesSearch =
      (m.product_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.product_sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (m.reason ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeVariant = (type: MovementType): 'success' | 'error' | 'info' => {
    if (type === 'in') return 'success';
    if (type === 'out') return 'error';
    return 'info';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Movimentações</h1>
          <p className="text-dark-400 mt-1">Registrar entradas, saídas e ajustes</p>
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
            Nova Movimentação
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por produto, SKU ou motivo..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500 placeholder-dark-400"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-dark-800 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">Todos os Tipos</option>
          <option value="in">Entrada</option>
          <option value="out">Saída</option>
          <option value="adjustment">Ajuste</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left p-4 text-dark-300 font-semibold">Produto</th>
                <th className="text-left p-4 text-dark-300 font-semibold">SKU</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Tipo</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Quantidade</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Motivo</th>
                <th className="text-left p-4 text-dark-300 font-semibold">Data</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Carregando...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-dark-400">
                    Nenhuma movimentação encontrada
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement: MovementWithProduct) => (
                  <tr
                    key={movement.id}
                    className="border-b border-dark-700 hover:bg-dark-700/50 transition-colors"
                  >
                    <td className="p-4 text-white">{movement.product_name ?? 'Produto removido'}</td>
                    <td className="p-4 text-dark-300">{movement.product_sku ?? '-'}</td>
                    <td className="p-4">
                      <Badge variant={typeVariant(movement.type)}>
                        {movementTypeLabels[movement.type]}
                      </Badge>
                    </td>
                    <td className="p-4 text-white">
                      {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : '='}
                      {movement.quantity}
                    </td>
                    <td className="p-4 text-dark-300">{movement.reason ?? '-'}</td>
                    <td className="p-4 text-dark-300">
                      {new Date(movement.created_at).toLocaleDateString('pt-BR')}
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
        title="Nova Movimentação"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-1">Produto *</label>
            <select
              required
              value={formData.product_id}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, product_id: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Selecione...</option>
              {products.map((product: Product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (Estoque: {product.stock_quantity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Tipo *</label>
            <select
              value={formData.type}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, type: e.target.value as MovementType })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="in">Entrada</option>
              <option value="out">Saída</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">
              {formData.type === 'adjustment' ? 'Nova Quantidade *' : 'Quantidade *'}
            </label>
            <input
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-dark-300 text-sm mb-1">Motivo</label>
            <textarea
              value={formData.reason}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 text-white rounded-lg focus:outline-none focus:border-blue-500"
            />
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
              Registrar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
