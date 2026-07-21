import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/RippleButton';
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
import { createRequestWithItems } from '@/services/requests';
import type { Product, Industry } from '@/types';

interface RequestItemDraft {
  product_id: string;
  quantity: number;
  industry_id: string | null;
}

export default function NewRequestPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<RequestItemDraft[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [industryId, setIndustryId] = useState('');
  const [notes, setNotes] = useState('');

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from('products')
        .select('*, industry:industries(*)')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: async (): Promise<Industry[]> => {
      const { data, error } = await supabase
        .from('industries')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Industry[];
    },
  });

  const addItem = () => {
    if (!productId) {
      toast.error('Selecione um produto.');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      toast.error('Quantidade inválida.');
      return;
    }
    if (items.some((i) => i.product_id === productId)) {
      toast.error('Produto já adicionado.');
      return;
    }
    setItems((prev) => [
      ...prev,
      { product_id: productId, quantity: qty, industry_id: industryId || null },
    ]);
    setProductId('');
    setQuantity('1');
    setIndustryId('');
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('Usuário não autenticado');
      if (items.length === 0) throw new Error('Adicione ao menos um item.');
      return createRequestWithItems(profile.id, items, notes || null);
    },
    onSuccess: () => {
      toast.success('Solicitação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-request-stats'] });
      navigate('/requests');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? '—';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Solicitação</h1>
        <p className="text-sm text-muted-foreground">Adicione produtos à sua solicitação.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="space-y-2">
            <Label>Produto</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Qtd.</Label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-20"
            />
          </div>
          <div className="space-y-2">
            <Label>Indústria</Label>
            <Select value={industryId} onValueChange={setIndustryId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Opcional" />
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
          <div className="flex items-end">
            <Button type="button" size="icon" onClick={addItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2"
              >
                <div className="text-sm">
                  <span className="font-medium text-foreground">
                    {productName(item.product_id)}
                  </span>
                  <span className="text-muted-foreground"> — {item.quantity} un.</span>
                </div>
                <button
                  onClick={() => removeItem(idx)}
                  className="rounded-lg p-1 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Notas adicionais..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button
          className="w-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4" />
          )}
          Enviar solicitação
        </Button>
      </div>
    </div>
  );
}
