import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Loader2, Factory } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import {
  fetchIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
} from '@/services/industries';
import type { Industry } from '@/types';

interface IndustryForm {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  active: boolean;
}

export default function IndustriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [form, setForm] = useState<IndustryForm>({
    name: '',
    cnpj: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    active: true,
  });

  const { data: industries = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      cnpj: '',
      contact_name: '',
      contact_email: '',
      contact_phone: '',
      active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (i: Industry) => {
    setEditing(i);
    setForm({
      name: i.name,
      cnpj: i.cnpj ?? '',
      contact_name: i.contact_name ?? '',
      contact_email: i.contact_email ?? '',
      contact_phone: i.contact_phone ?? '',
      active: i.active,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        cnpj: form.cnpj || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        active: form.active,
        address: null,
      };
      if (editing) {
        await updateIndustry(editing.id, payload);
      } else {
        await createIndustry(payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? 'Indústria atualizada!' : 'Indústria criada!');
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      toast.success('Indústria excluída!');
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indústrias</h1>
          <p className="text-sm text-muted-foreground">Gerencie os fornecedores.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova indústria
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : industries.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Nenhuma indústria"
          description="Cadastre sua primeira indústria."
          action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Nova indústria</Button>}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">CNPJ</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contato</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ativo</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {industries.map((i) => (
                <tr key={i.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={i.active ? 'default' : 'secondary'}>
                      {i.active ? 'Sim' : 'Não'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)} title="Editar">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(i.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar indústria' : 'Nova indústria'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="i-name">Nome</Label>
              <Input
                id="i-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="i-cnpj">CNPJ</Label>
              <Input
                id="i-cnpj"
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="i-contact">Contato</Label>
                <Input
                  id="i-contact"
                  value={form.contact_name}
                  onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="i-phone">Telefone</Label>
                <Input
                  id="i-phone"
                  value={form.contact_phone}
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="i-email">E-mail</Label>
              <Input
                id="i-email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.active}
                onCheckedChange={(c) => setForm({ ...form, active: c })}
              />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
