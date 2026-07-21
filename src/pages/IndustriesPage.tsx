import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { fetchIndustries, createIndustry, updateIndustry, deleteIndustry } from '@/services/industries';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Industry } from '@/types';

interface IndustryForm {
  name: string;
  cnpj: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  active: boolean;
}

export function IndustriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Industry | null>(null);
  const [form, setForm] = useState<IndustryForm>({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', active: true });
  const [saving, setSaving] = useState(false);

  const { data: industries = [], isLoading } = useQuery({ queryKey: ['industries'], queryFn: fetchIndustries });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', active: true });
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
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        cnpj: form.cnpj || null,
        contact_name: form.contact_name || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        address: null,
        active: form.active,
      };
      if (editing) {
        await updateIndustry(editing.id, payload);
        toast.success('Indústria atualizada!');
      } else {
        await createIndustry(payload);
        toast.success('Indústria criada!');
      }
      queryClient.invalidateQueries({ queryKey: ['industries'] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIndustry(id);
      toast.success('Indústria excluída!');
      queryClient.invalidateQueries({ queryKey: ['industries'] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Indústrias</h1>
          <p className="text-sm text-muted-foreground">Gerencie as indústrias cadastradas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <RippleButton onClick={openCreate}><Plus className="h-4 w-4" /> Nova indústria</RippleButton>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar indústria' : 'Nova indústria'}</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="flex flex-col gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Contato</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>E-mail</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
              <div className="flex flex-col gap-2"><Label>Telefone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
              <RippleButton onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</RippleButton>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Nome</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">CNPJ</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Contato</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Telefone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {industries.map((i) => (
              <tr key={i.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-sm text-foreground">{i.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{i.cnpj ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{i.contact_name ?? '-'}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{i.contact_phone ?? '-'}</td>
                <td className="px-4 py-3">
                  <Badge variant={i.active ? 'default' : 'secondary'}>{i.active ? 'Ativa' : 'Inativa'}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <RippleButton variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="h-4 w-4" /></RippleButton>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Editar indústria</DialogTitle></DialogHeader>
                        <div className="grid grid-cols-1 gap-4 py-2">
                          <div className="flex flex-col gap-2"><Label>Nome</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                          <div className="flex flex-col gap-2"><Label>CNPJ</Label><Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} /></div>
                          <div className="flex flex-col gap-2"><Label>Contato</Label><Input value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} /></div>
                          <div className="flex flex-col gap-2"><Label>E-mail</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                          <div className="flex flex-col gap-2"><Label>Telefone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
                          <div className="flex items-center gap-3"><Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} /><Label>Ativa</Label></div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild><RippleButton variant="outline">Cancelar</RippleButton></DialogClose>
                          <RippleButton onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</RippleButton>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <RippleButton variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></RippleButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(i.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
