import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Pencil, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchIndustries, createIndustry, updateIndustry, deleteIndustry,
} from '@/services/industries';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import type { Industry } from '@/types';

interface FormState {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  active: boolean;
}

const emptyForm: FormState = {
  name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', active: true,
};

export function IndustriesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Industry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Industry | null>(null);

  const { data: industries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const filtered = industries.filter((i) =>
    !search || i.name.toLowerCase().includes(search.toLowerCase()) || (i.cnpj ?? '').includes(search)
  );

  const createMutation = useMutation({
    mutationFn: (input: Omit<Industry, 'id' | 'created_at' | 'updated_at'>) => createIndustry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Indústria criada com sucesso!');
      setCreateOpen(false);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao criar indústria.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Industry> }) => updateIndustry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Indústria atualizada!');
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao atualizar indústria.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Indústria excluída.');
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message || 'Erro ao excluir indústria.'),
  });

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Indústrias</h2>
          <p className="text-sm text-muted-foreground">Gerencie as indústrias parceiras</p>
        </div>
        <RippleButton onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Nova Indústria
        </RippleButton>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma indústria encontrada"
          description="Cadastre uma nova indústria parceira."
          action={<RippleButton onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />Nova Indústria</RippleButton>}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.cnpj ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_name ?? '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_phone ?? '-'}</td>
                  <td className="px-4 py-3">
                    {i.active ? (
                      <Badge className="bg-success/15 text-success">Ativa</Badge>
                    ) : (
                      <Badge className="bg-muted text-muted-foreground">Inativa</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <RippleButton size="icon" variant="ghost" onClick={() => setEditTarget(i)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </RippleButton>
                      <RippleButton size="icon" variant="ghost" onClick={() => setDeleteTarget(i)} title="Excluir">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </RippleButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen && (
        <IndustryDialog
          onClose={() => setCreateOpen(false)}
          onSubmit={(form) => createMutation.mutate({
            name: form.name,
            cnpj: form.cnpj || null,
            contact_name: form.contact_name || null,
            contact_email: form.contact_email || null,
            contact_phone: form.contact_phone || null,
            address: form.address || null,
            active: form.active,
          })}
          loading={createMutation.isPending}
        />
      )}

      {editTarget && (
        <IndustryDialog
          industry={editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={(form) => updateMutation.mutate({
            id: editTarget.id,
            input: {
              name: form.name,
              cnpj: form.cnpj || null,
              contact_name: form.contact_name || null,
              contact_email: form.contact_email || null,
              contact_phone: form.contact_phone || null,
              address: form.address || null,
              active: form.active,
            },
          })}
          loading={updateMutation.isPending}
        />
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface IndustryDialogProps {
  industry?: Industry;
  onClose: () => void;
  onSubmit: (form: FormState) => void;
  loading: boolean;
}

function IndustryDialog({ industry, onClose, onSubmit, loading }: IndustryDialogProps) {
  const [form, setForm] = useState<FormState>(industry ? {
    name: industry.name,
    cnpj: industry.cnpj ?? '',
    contact_name: industry.contact_name ?? '',
    contact_email: industry.contact_email ?? '',
    contact_phone: industry.contact_phone ?? '',
    address: industry.address ?? '',
    active: industry.active,
  } : emptyForm);

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Informe o nome da indústria.');
      return;
    }
    onSubmit(form);
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{industry ? 'Editar Indústria' : 'Nova Indústria'}</DialogTitle>
          <DialogDescription>
            {industry ? 'Atualize as informações da indústria.' : 'Cadastre uma nova indústria parceira.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ind-name">Nome *</Label>
            <Input id="ind-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Nome da indústria" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input id="cnpj" value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Nome do Contato</Label>
              <Input id="contact-name" value={form.contact_name} onChange={(e) => set('contact_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Telefone</Label>
              <Input id="contact-phone" value={form.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} placeholder="(00) 0000-0000" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">E-mail</Label>
            <Input id="contact-email" type="email" value={form.contact_email} onChange={(e) => set('contact_email', e.target.value)} placeholder="contato@industria.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea id="address" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Endereço completo" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="ind-active" className="text-sm font-medium">Indústria ativa</Label>
            <Switch id="ind-active" checked={form.active} onCheckedChange={(v) => set('active', v)} />
          </div>
          <DialogFooter>
            <RippleButton type="button" variant="ghost" onClick={onClose}>Cancelar</RippleButton>
            <RippleButton type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {industry ? 'Salvar' : 'Criar'}
            </RippleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
