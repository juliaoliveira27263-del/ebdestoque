import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RippleButton } from '@/components/RippleButton';

interface CartItem {
  product_id: string;
  product_name: string;
  industry_id: string;
  quantity: number;
}

export function NewRequestPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [productId, setProductId] = React.useState('');
  const [industryId, setIndustryId] = React.useState('');
  const [quantity, setQuantity] = React.useState('1');
  const [notes, setNotes] = React.useState('');
  const [items, setItems] = React.useState<CartItem[]>([]);

  const { data: products = [] } = useQuery({ queryKey: ['products'], queryFn: fetchProducts });
  const { data: industries = [] } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Usuário não autenticado');
      if (items.length === 0) throw new Error('Adicione pelo menos um item');
      await createRequestWithItems(
        profile.id,
        notes || null,
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, industry_id: i.industry_id || null }))
      );
    },
    onSuccess: () => {
      toast.success('Solicitação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      navigate('/requests');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addItem = () => {
    if (!productId) {
      toast.error('Selecione um produto');
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const qty = parseInt(quantity, 10);
    if (qty < 1) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === productId);
      if (existing) {
        return prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          product_id: productId,
          product_name: product.name,
          industry_id: industryId,
          quantity: qty,
        },
      ];
    });
    setProductId('');
    setIndustryId('');
    setQuantity('1');
  };

  const removeItem = (pid: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== pid));
  };

  const updateQty = (pid: string, qty: number) => {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.product_id === pid ? { ...i, quantity: qty } : i)));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <ShoppingBag className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Nova Solicitação</h1>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Indústria</Label>
            <Select value={industryId} onValueChange={setIndustryId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma indústria" /></SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="qty">Quantidade</Label>
            <Input id="qty" type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex items-end">
            <RippleButton type="button" variant="outline" className="w-full" onClick={addItem}>
              <Plus className="h-4 w-4" />
              Adicionar
            </RippleButton>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 font-semibold text-foreground">Itens ({items.length})</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                  {item.industry_id && (
                    <p className="text-xs text-muted-foreground">
                      {industries.find((i) => i.id === item.industry_id)?.name ?? ''}
                    </p>
                  )}
                </div>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateQty(item.product_id, parseInt(e.target.value, 10) || 1)}
                  className="h-9 w-20"
                />
                <button onClick={() => removeItem(item.product_id)} className="rounded-md p-2 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" placeholder="Observações opcionais..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <RippleButton variant="outline" className="flex-1" onClick={() => navigate(-1)}>
          Cancelar
        </RippleButton>
        <RippleButton
          className="flex-1"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || items.length === 0}
        >
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Enviar solicitação
        </RippleButton>
      </div>
    </div>
  );
}
