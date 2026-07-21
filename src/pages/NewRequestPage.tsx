import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';

export function NewRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<{ product_id: string; quantity: number; industry_id?: string | null }[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');

  const { data: products = [], isLoading: productsLoading, error: productsError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const mutation = useMutation({
    mutationFn: ({ items, notes }: { items: { product_id: string; quantity: number; industry_id?: string | null }[]; notes?: string }) =>
      createRequestWithItems(items, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Solicitação enviada! O administrador foi notificado.');
      navigate('/requests');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao criar solicitação.');
    },
  });

  const addItem = () => {
    if (!selectedProduct) return;
    const industryId = selectedIndustry && selectedIndustry !== 'none' ? selectedIndustry : null;
    const existing = items.find((i) => i.product_id === selectedProduct && (i.industry_id ?? null) === industryId);
    if (existing) {
      setItems(items.map((i) =>
        i.product_id === selectedProduct && (i.industry_id ?? null) === industryId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setItems([...items, { product_id: selectedProduct, quantity: 1, industry_id: industryId }]);
    }
    setSelectedProduct('');
    setSelectedIndustry('');
  };

  const updateQty = (index: number, qty: number) => {
    if (qty < 1) {
      setItems(items.filter((_, i) => i !== index));
      return;
    }
    setItems(items.map((it, i) => (i === index ? { ...it, quantity: qty } : it)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item.');
      return;
    }
    mutation.mutate({ items, notes: notes || undefined });
  };

  if (productsError) {
    return <ErrorState message={productsError.message} onRetry={() => refetch()} />;
  }

  const activeProducts = products.filter((p) => p.active);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Nova Solicitação</h2>
        <p className="text-sm text-muted-foreground">Selecione os materiais que deseja solicitar do estoque.</p>
      </div>

      {productsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : activeProducts.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto disponível" description="Não há produtos ativos no momento." />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label>Adicionar item</Label>
            <div className="flex gap-2">
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione um produto..." />
                </SelectTrigger>
                <SelectContent>
                  {activeProducts.map((p) => (
                    <SelectItem key={p.id} value={p.id} disabled={p.stock_quantity <= 0}>
                      {p.name} ({p.stock_quantity} {p.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Indústria (destino)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem destino</SelectItem>
                  {industries.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <RippleButton type="button" variant="outline" onClick={addItem} disabled={!selectedProduct}>
                <Plus className="h-4 w-4" />
              </RippleButton>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              {items.map((item, index) => {
                const product = products.find((p) => p.id === item.product_id);
                const industry = industries.find((i) => i.id === item.industry_id);
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {product?.name ?? 'Produto'}
                      </div>
                      {industry && (
                        <div className="text-xs text-muted-foreground truncate">
                          Destino: {industry.name}
                        </div>
                      )}
                    </div>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateQty(index, parseInt(e.target.value, 10) || 0)}
                      className="h-8 w-20"
                    />
                    <button
                      type="button"
                      onClick={() => updateQty(index, 0)}
                      className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <RippleButton type="button" variant="ghost" onClick={() => navigate('/home')}>
              Cancelar
            </RippleButton>
            <RippleButton type="submit" disabled={mutation.isPending || items.length === 0}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enviar Solicitação
            </RippleButton>
          </div>
        </form>
      )}
    </div>
  );
}
