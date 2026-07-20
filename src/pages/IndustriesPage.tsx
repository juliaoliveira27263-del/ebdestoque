import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Factory,
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Building2,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchIndustries,
  createIndustry,
  updateIndustry,
  deleteIndustry,
  type IndustryInput,
} from '@/services/industries';
import { useAuth } from '@/contexts/AuthContext';
import { RippleButton } from '@/components/RippleButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import type { Industry } from '@/types';

const schema = z.object({
  name: z.string().min(2, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  address: z.string().optional(),
  active: z.boolean(),
});

type Form = z.infer<typeof schema>;

export function IndustriesPage() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: industries = [], isLoading, error, refetch } = useQuery({
    queryKey: ['industries'],
    queryFn: fetchIndustries,
  });

  const filtered = useMemo(() => {
    return industries.filter(
      (i) =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        (i.cnpj ?? '').includes(search) ||
        (i.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
    );
  }, [industries, search]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { active: true },
  });

  const createMutation = useMutation({
    mutationFn: (input: IndustryInput) => createIndustry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria cadastrada!');
      setDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<IndustryInput> }) =>
      updateIndustry(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria atualizada!');
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteIndustry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['industries'] });
      toast.success('Indústria excluída.');
      setDeleteId(null);
    },
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', cnpj: '', contact_name: '', contact_email: '', contact_phone: '', address: '', active: true });
    setDialogOpen(true);
  };

  const openEdit = (i: Industry) => {
    setEditing(i);
    reset({
      name: i.name,
      cnpj: i.cnpj ?? '',
      contact_name: i.contact_name ?? '',
      contact_email: i.contact_email ?? '',
      contact_phone: i.contact_phone ?? '',
      address: i.address ?? '',
      active: i.active,
    });
    setDialogOpen(true);
  };

  const onSubmit = (data: Form) => {
    const input: IndustryInput = {
      name: data.name,
      cnpj: data.cnpj || undefined,
      contact_name: data.contact_name || undefined,
      contact_email: data.contact_email || undefined,
      contact_phone: data.contact_phone || undefined,
      address: data.address || undefined,
      active: data.active,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, input });
    } else {
      createMutation.mutate(input);
    }
  };

  if (error) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Indústrias</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie as indústrias parceiras da EBD Petrolina
          </p>
        </div>
        {isAdmin && (
          <RippleButton onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nova Indústria
          </RippleButton>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou contato..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Factory}
          title="Nenhuma indústria encontrada"
          description="Cadastre as indústrias parceiras para vincular aos produtos."
          action={isAdmin && <RippleButton onClick={openCreate}><Plus className="h-4 w-4" />Nova Indústria</RippleButton>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <div
              key={i.id}
              className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{i.name}</h3>
                    {i.cnpj && (
                      <p className="text-xs text-muted-foreground">CNPJ: {i.cnpj}</p>
                    )}
                  </div>
                </div>
                <Badge className={i.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}>
                  {i.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                {i.contact_name && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium text-foreground">{i.contact_name}</span>
                  </p>
                )}
                {i.contact_email && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{i.contact_email}</span>
                  </p>
                )}
                {i.contact_phone && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    {i.contact_phone}
                  </p>
                )}
                {i.address && (
                  <p className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{i.address}</span>
                  </p>
                )}
              </div>

              {isAdmin && (
                <div className="mt-4 flex justify-end gap-1 border-t border-border pt-3">
                  <button
                    onClick={() => openEdit(i)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(i.id)}
                    className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-90vh overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Indústria' : 'Nova Indústria'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize as informações da indústria.' : 'Cadastre uma nova indústria parceira.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" placeholder="Nome da indústria" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input id="cnpj" placeholder="00.000.000/0000-00" {...register('cnpj')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contato</Label>
                <Input id="contact_name" placeholder="Nome do contato" {...register('contact_name')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">E-mail</Label>
                <Input id="contact_email" type="email" placeholder="contato@industria.com" {...register('contact_email')} />
                {errors.contact_email && <p className="text-xs text-destructive">{errors.contact_email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Telefone</Label>
                <Input id="contact_phone" placeholder="(87) 99999-9999" {...register('contact_phone')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea id="address" rows={2} placeholder="Endereço completo" {...register('address')} />
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Switch
                id="active"
                checked={watch('active')}
                onCheckedChange={(v) => setValue('active', v)}
              />
              <Label htmlFor="active" className="cursor-pointer">Indústria ativa</Label>
            </div>
            <DialogFooter>
              <RippleButton type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </RippleButton>
              <RippleButton type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? 'Salvar' : 'Cadastrar'}
              </RippleButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir indústria?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Produtos vinculados ficarão sem indústria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
