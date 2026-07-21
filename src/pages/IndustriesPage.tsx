import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, Loader2 } from 'lucide-react';
import { fetchIndustries, createIndustry, updateIndustry, deleteIndustry } from '@/services/industries';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { RippleButton } from '@/components/RippleButton';
import { EmptyState } from '@/components/EmptyState';
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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: industries = [], isLoading } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const createMutation = useMutation({
    mutationFn: (i: Omit<Industry, 'id' | 'created_at' | 'updated_at'>) => createIndustry(i),
    onSuccess: () => { toast.success('Indústria criada!'); queryClient.invalidateQueries({ queryKey: ['industries'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Industry> }) => updateIndustry(id, updates),
    onSuccess: () => { toast.success('Indústria atualizada!'); queryClient.invalidateQueries({ queryKey: ['industries'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => { toast.success('Indústria excluída!'); queryClient.invalidateQueries({ queryKey: ['industries'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const openCreate = () => { setForm(emptyForm); setEditingId(null); setDialogOpen(true); };
  const openEdit = (i: Industry) => {
    setForm({
      name: i.name, cnpj: i.cnpj ?? '', contact_name: i.contact_name ?? '',
      contact_email: i.contact_email ?? '', contact_phone: i.contact_phone ?? '',
      address: i.address ?? '', active: i.active,
    });
    setEditingId(i.id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    const payload = {
      name: form.name.trim(),
      cnpj: form.cnpj.trim() || null,
      contact_name: form.contact_name.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_phone: form.contact_phone.trim() || null,
      address: form.address.trim() || null,
      active: form.active,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, updates: payload });
    } else {
      createMutation.mutate(payload);
    }
    setDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Indústrias</h1>
        <RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Nova indústria</RippleButton>
      </div>

      {industries.length === 0 ? (
        <EmptyState icon={Building2} title="Nenhuma indústria" description="Cadastre sua primeira indústria." action={<RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Nova indústria</RippleButton>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">CNPJ</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Contato</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Telefone</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Ativo</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {industries.map((i) => (
                <tr key={i.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{i.contact_phone ?? '—'}</td>
                  <td className="px-4 py-3">{i.active ? <Badge variant="default">Ativa</Badge> : <Badge variant="secondary">Inativa</Badge>}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <RippleButton variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></RippleButton>
                      <RippleButton variant="ghost" size="icon" onClick={() => setDeleteId(i.id)}><Trash2 className="h-4 w-4 text-destructive" /></RippleButton>
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
          <DialogHeader><DialogTitle>{editingId ? 'Editar indústria' : 'Nova indústria'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="name">Nome *</Label><Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="cnpj">CNPJ</Label><Input id="cnpj" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="contact">Contato</Label><Input id="contact" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label htmlFor="phone">Telefone</Label><Input id="phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
            <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="addr">Endereço</Label><Input id="addr" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={form.active} onCheckedChange={(c) => setForm({ ...form, active: c })} />
              <Label>Ativa</Label>
            </div>
          </div>
          <DialogFooter>
            <RippleButton variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</RippleButton>
            <RippleButton onClick={handleSave}>{editingId ? 'Salvar' : 'Criar'}</RippleButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => { if (!o) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
