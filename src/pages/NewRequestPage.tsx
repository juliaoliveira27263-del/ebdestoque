import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProducts } from '@/services/products';
import { fetchIndustries } from '@/services/industries';
import { createRequestWithItems } from '@/services/requests';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestItemInput {
  product_id: string;
  quantity: number;
  industry_id: string | null;
  product_name: string;
}

export function NewRequestPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<RequestItemInput[]>([]);
  const [notes, setNotes] = useState('');
  const [productId, setProductId] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [loading, setLoading] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  const { data: industries = [] } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const addItem = () => {
    if (!productId) {
      toast.error('Selecione um produto');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!qty || qty < 1) {
      toast.error('Quantidade inválida');
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setItems((prev) => [
      ...prev,
      {
        product_id: productId,
        quantity: qty,
        industry_id: industryId || null,
        product_name: product.name,
      },
    ]);
    setProductId('');
    setIndustryId('');
    setQuantity('1');
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
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
        items.map((i) => ({ product_id: i.product_id, quantity: i.quantity, industry_id: i.industry_id })),
        notes || null
      );
      toast.success('Solicitação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      navigate('/requests');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nova Solicitação</h1>
        <p className="text-sm text-muted-foreground">Selecione os produtos que deseja solicitar.</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
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
          <div className="flex flex-col gap-2">
            <Label>Indústria (opcional)</Label>
            <Select value={industryId} onValueChange={setIndustryId}>
              <SelectTrigger><SelectValue placeholder="Selecione uma indústria" /></SelectTrigger>
              <SelectContent>
                {industries.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <div className="w-32">
            <Label>Quantidade</Label>
            <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div className="flex items-end">
            <RippleButton onClick={addItem} variant="secondary">
              <Plus className="h-4 w-4" /> Adicionar
            </RippleButton>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Itens da solicitação</h2>
        {items.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <ShoppingCart className="mb-2 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Nenhum item adicionado.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.product_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qtd: {item.quantity}
                    {item.industry_id && ` · ${industries.find((i) => i.id === item.industry_id)?.name ?? ''}`}
                  </p>
                </div>
                <RippleButton variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </RippleButton>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <Label>Observações</Label>
        <Textarea className="mt-2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adicione observações (opcional)" />
      </div>

      <div className="flex justify-end gap-3">
        <RippleButton variant="outline" onClick={() => navigate(-1)}>Cancelar</RippleButton>
        <RippleButton onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enviar solicitação
        </RippleButton>
      </div>
    </div>
  );
}
