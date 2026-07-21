import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchIndustries, createIndustry, updateIndustry, deleteIndustry } from '@/services/industries';
import type { Industry } from '@/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/RippleButton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface IndustryForm {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  active: boolean;
}

const emptyForm: IndustryForm = {
  name: '',
  cnpj: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  active: true,
};

export function IndustriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [form, setForm] = useState<IndustryForm>(emptyForm);

  const { data: industries = [], isLoading } = useQuery<Industry[]>({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const createMutation = useMutation({
    mutationFn: (input: Parameters<typeof createIndustry>[0]) => createIndustry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria criada com sucesso!');
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateIndustry>[1] }) =>
      updateIndustry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria atualizada com sucesso!');
      setDialogOpen(false);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria excluída com sucesso!');
      setDeleteId(null);
    },
    onError: (err: Error) => toast.error('Erro: ' + err.message),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (industry: Industry) => {
    setEditing(industry);
    setForm({
      name: industry.name,
      cnpj: industry.cnpj || '',
      contact_name: industry.contact_name || '',
      contact_email: industry.contact_email || '',
      contact_phone: industry.contact_phone || '',
      address: industry.address || '',
      active: industry.active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      cnpj: form.cnpj || null,
      contact_name: form.contact_name || null,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      address: form.address || null,
      active: form.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, input: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indústrias</h1>
          <p className="text-sm text-muted-foreground">Gerencie as indústrias cadastradas</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Nova indústria
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : industries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma indústria encontrada</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">CNPJ</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contato</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {industries.map((industry) => (
                  <tr key={industry.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{industry.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{industry.cnpj || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{industry.contact_name || '-'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{industry.contact_phone || '-'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={industry.active ? 'default' : 'secondary'}>
                        {industry.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(industry)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(industry.id)}
                          className="text-destructive hover:bg-destructive/10"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar indústria' : 'Nova indústria'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ind-name">Nome</Label>
              <Input id="ind-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind-cnpj">CNPJ</Label>
              <Input id="ind-cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ind-contact">Contato</Label>
                <Input id="ind-contact" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ind-phone">Telefone</Label>
                <Input id="ind-phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind-email">E-mail</Label>
              <Input id="ind-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ind-address">Endereço</Label>
              <Input id="ind-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="ind-active"
                checked={form.active}
                onCheckedChange={(checked: boolean) => setForm({ ...form, active: checked })}
              />
              <Label htmlFor="ind-active">Ativa</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editing ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A indústria será permanentemente excluída.
            </AlertDialogDescription>
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
