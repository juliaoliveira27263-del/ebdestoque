import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import type { Product, Industry } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/RippleButton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CartItem {
  product_id: string;
  product_name: string;
  quantity: number;
  industry_id: string | null;
}

export function NewRequestPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery<Industry[]>({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const addItem = () => {
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) {
      toast.error('Selecione um produto');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      toast.error('Quantidade inválida');
      return;
    }
    if (items.some((i) => i.product_id === selectedProduct)) {
      toast.error('Produto já adicionado');
      return;
    }
    setItems([
      ...items,
      {
        product_id: selectedProduct,
        product_name: product.name,
        quantity: qty,
        industry_id: selectedIndustry || null,
      },
    ]);
    setSelectedProduct('');
    setSelectedIndustry('');
    setQuantity('1');
  };

  const removeItem = (productId: string) => {
    setItems(items.filter((i) => i.product_id !== productId));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }
    setLoading(true);
    try {
      await createRequestWithItems(
        profile!.id,
        items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          industry_id: i.industry_id,
        })),
        notes || null
      );
      await queryClient.invalidateQueries({ queryKey: ['requests'] });
      await queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast.success('Solicitação criada com sucesso!');
      navigate('/requests');
    } catch (err) {
      toast.error('Erro ao criar solicitação: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Solicitação</h1>
        <p className="text-sm text-muted-foreground">Selecione os produtos que deseja solicitar</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">Adicionar produto</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="product">Produto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.stock_quantity} {p.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="industry">Indústria (opcional)</Label>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger id="industry">
                <SelectValue placeholder="Selecione uma indústria" />
              </SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" className="w-full" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Itens da solicitação</h2>
          <div className="mt-4 space-y-2">
            {items.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center justify-between rounded-lg bg-muted px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Quantidade: {item.quantity}
                    {item.industry_id &&
                      ` | Indústria: ${industries.find((i) => i.id === item.industry_id)?.name || '-'}`}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(item.product_id)}
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Adicione observações sobre a solicitação..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSubmit} disabled={loading || items.length === 0} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <ShoppingCart className="h-4 w-4" />
              Enviar solicitação
            </>
          )}
        </Button>
        <Button variant="outline" onClick={() => navigate('/requests')}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
