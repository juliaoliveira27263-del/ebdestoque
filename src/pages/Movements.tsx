import { useEffect, useState } from 'react';
import { Plus, Search, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { exportToCSV } from '../lib/csv';
import type { Movement, MovementType, Product, Profile } from '../lib/types';
import { movementTypeLabels } from '../lib/types';

interface MovementWithDetails extends Movement {
  productName: string;
  userName: string;
}

interface MovementFormData {
  product_id: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

const emptyForm: MovementFormData = {
  product_id: '',
  type: 'in',
  quantity: 0,
  reason: '',
};

export default function Movements() {
  const [movements, setMovements] = useState<MovementWithDetails[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<MovementFormData>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMovements();
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;

      setProducts((data as Product[] | null) ?? []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }

  async function fetchMovements() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const movs = (data as Movement[] | null) ?? [];

      if (movs.length === 0) {
        setMovements([]);
        return;
      }

      // Fetch products and profiles separately (NO supabase join)
      const productIds = [...new Set(movs.map((m) => m.product_id))];
      const userIds = [...new Set(movs.map((m) => m.user_id).filter((id): id is string => id !== null))];

      const [productsRes, profilesRes] = await Promise.all([
        supabase.from('products').select('id, name').in('id', productIds),
        userIds.length > 0
          ? supabase.from('profiles').select('id, name').in('id', userIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const productsData = (productsRes.data as Product[] | null) ?? [];
      const profilesData = (profilesRes.data as Profile[] | null) ?? [];

      const productMap = new Map<string, string>();
      productsData.forEach((p) => productMap.set(p.id, p.name));

      const profileMap = new Map<string, string>();
      profilesData.forEach((p) => profileMap.set(p.id, p.name));

      const withDetails: MovementWithDetails[] = movs.map((m) => ({
        ...m,
        productName: productMap.get(m.product_id) ?? 'Produto desconhecido',
        userName: m.user_id ? (profileMap.get(m.user_id) ?? 'Usuário desconhecido') : '-',
      }));

      setMovements(withDetails);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast.error('Erro ao carregar movimentações');
    } finally {
      setLoading(false);
    }
  }

  const filtered = movements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      (m.reason ?? '').toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  function badgeVariant(type: MovementType): 'default' | 'success' | 'warning' | 'error' | 'info' {
    switch (type) {
      case 'in':
        return 'success';
      case 'out':
        return 'error';
      case 'adjustment':
        return 'warning';
      default:
        return 'default';
    }
  }

  function openCreate() {
    setForm(emptyForm);
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
    if (!form.product_id) {
      toast.error('Selecione um produto');
      return;
    }
    if (form.quantity <= 0) {
      toast.error('A quantidade deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      // Fetch current product
      const { data: productData, error: prodError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', form.product_id)
        .single();

      if (prodError) throw prodError;

      const currentStock = (productData as Product).stock_quantity;
      let newStock: number;

      switch (form.type) {
        case 'in':
          newStock = currentStock + form.quantity;
          break;
        case 'out':
          if (currentStock < form.quantity) {
            toast.error('Estoque insuficiente para saída');
            setSaving(false);
            return;
          }
          newStock = currentStock - form.quantity;
          break;
        case 'adjustment':
          newStock = form.quantity;
          break;
        default:
          newStock = currentStock;
      }

      // Update product stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', form.product_id);

      if (updateError) throw updateError;

      // Insert movement record
      const { error: movementError } = await supabase.from('movements').insert({
        product_id: form.product_id,
        type: form.type,
        quantity: form.quantity,
        reason: form.reason || null,
      });

      if (movementError) throw movementError;

      toast.success('Movimentação registrada com sucesso');
      setModalOpen(false);
      fetchMovements();
    } catch (error) {
      console.error('Error saving movement:', error);
      toast.error('Erro ao registrar movimentação');
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const headers = ['Produto', 'Tipo', 'Quantidade', 'Motivo', 'Usuário', 'Data'];
    const rows = filtered.map((m) => [
      m.productName,
      movementTypeLabels[m.type as MovementType],
      m.quantity,
      m.reason ?? '',
      m.userName,
      new Date(m.created_at).toLocaleDateString('pt-BR'),
    ]);
    exportToCSV('movimentacoes', headers, rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Movimentações</h1>
          <p className="text-dark-400 mt-1">Registro de entradas, saídas e ajustes</p>
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
            <Plus size={18} /> Nova movimentação
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
          <input
            type="text"
            placeholder="Buscar por produto ou motivo..."
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
          className="px-4 py-2 bg-dark-900 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Todos os tipos</option>
          <option value="in">Entrada</option>
          <option value="out">Saída</option>
          <option value="adjustment">Ajuste</option>
        </select>
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
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Produto</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Tipo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Quantidade</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Motivo</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Usuário</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-dark-400">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-dark-400">
                      Nenhuma movimentação encontrada
                    </td>
                  </tr>
                ) : (
                  filtered.map((m) => (
                    <tr key={m.id} className="hover:bg-dark-950">
                      <td className="px-4 py-3 text-white">{m.productName}</td>
                      <td className="px-4 py-3">
                        <Badge variant={badgeVariant(m.type as MovementType)}>
                          {movementTypeLabels[m.type as MovementType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-white">
                        {m.type === 'out' ? '-' : m.type === 'in' ? '+' : '='}
                        {m.quantity}
                      </td>
                      <td className="px-4 py-3 text-dark-400">{m.reason ?? '-'}</td>
                      <td className="px-4 py-3 text-dark-400">{m.userName}</td>
                      <td className="px-4 py-3 text-dark-400">
                        {new Date(m.created_at).toLocaleDateString('pt-BR')}
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
        title="Nova movimentação"
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-dark-400 mb-1">Produto *</label>
            <select
              name="product_id"
              required
              value={form.product_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Tipo *</label>
            <select
              name="type"
              required
              value={form.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="in">Entrada</option>
              <option value="out">Saída</option>
              <option value="adjustment">Ajuste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">
              {form.type === 'adjustment' ? 'Novo estoque' : 'Quantidade'} *
            </label>
            <input
              type="number"
              name="quantity"
              min={0}
              required
              value={form.quantity}
              onChange={handleNumberChange}
              className="w-full px-3 py-2 bg-dark-950 border border-dark-800 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-dark-400 mb-1">Motivo</label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleInputChange}
              rows={3}
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
